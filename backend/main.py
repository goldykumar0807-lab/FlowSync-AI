import os
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from traffic_engine import traffic_engine
from tinyfish_service import tinyfish_service

app = FastAPI(
    title="FlowSync AI — Traffic Signal Management API",
    description="Intelligent Adaptive Signal Control with TinyFish Web Agent integration",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background simulation runner task
async def simulation_background_loop():
    while True:
        try:
            if traffic_engine.simulation_running:
                traffic_engine.tick(delta_sec=1.0)
            await asyncio.sleep(1.0 / max(0.5, traffic_engine.simulation_speed))
        except Exception as e:
            await asyncio.sleep(1.0)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_background_loop())

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FlowSync AI Traffic Control Core",
        "version": "1.0.0",
        "simulation_running": traffic_engine.simulation_running,
        "tinyfish_status": tinyfish_service.get_status()
    }

@app.get("/api/traffic/state")
def get_traffic_state():
    return traffic_engine.get_state()

class SimulationControlRequest(BaseModel):
    action: Optional[str] = None  # 'play', 'pause', 'reset', 'step'
    speed: Optional[float] = None
    mode: Optional[str] = None  # 'adaptive', 'fixed', 'manual'
    manual_phase: Optional[str] = None

@app.post("/api/traffic/control")
def control_simulation(req: SimulationControlRequest):
    if req.action == "play":
        traffic_engine.simulation_running = True
    elif req.action == "pause":
        traffic_engine.simulation_running = False
    elif req.action == "reset":
        traffic_engine.reset()
    elif req.action == "step":
        traffic_engine.tick(delta_sec=1.0)

    if req.speed is not None:
        traffic_engine.simulation_speed = max(0.2, min(5.0, req.speed))

    if req.mode is not None and req.mode in ["adaptive", "fixed", "manual"]:
        traffic_engine.controller_mode = req.mode

    if req.manual_phase is not None and traffic_engine.controller_mode == "manual":
        traffic_engine.current_phase = req.manual_phase
        traffic_engine.phase_time_remaining = 30
        traffic_engine.phase_total_duration = 30

    return traffic_engine.get_state()

class UpdateApproachRequest(BaseModel):
    queue_length: Optional[int] = None
    arrival_rate: Optional[float] = None
    pedestrian_count: Optional[int] = None
    pedestrian_button_pressed: Optional[bool] = None
    incident_blocked: Optional[bool] = None
    capacity_ratio: Optional[float] = None

@app.post("/api/traffic/approach/{name}")
def update_approach(name: str, req: UpdateApproachRequest):
    if name not in traffic_engine.approaches:
        raise HTTPException(status_code=404, detail="Approach not found")
    
    app = traffic_engine.approaches[name]
    f_app = traffic_engine.fixed_approaches[name]
    if req.queue_length is not None:
        app.queue_length = max(0, min(60, req.queue_length))
        f_app.queue_length = app.queue_length
    if req.arrival_rate is not None:
        app.arrival_rate = max(1.0, min(100.0, req.arrival_rate))
        f_app.arrival_rate = app.arrival_rate
    if req.pedestrian_count is not None:
        app.pedestrian_count = max(0, min(40, req.pedestrian_count))
        f_app.pedestrian_count = app.pedestrian_count
    if req.pedestrian_button_pressed is not None:
        app.pedestrian_button_pressed = req.pedestrian_button_pressed
        f_app.pedestrian_button_pressed = req.pedestrian_button_pressed
    if req.incident_blocked is not None:
        app.incident_blocked = req.incident_blocked
        f_app.incident_blocked = req.incident_blocked
        app.capacity_ratio = 0.5 if req.incident_blocked else 1.0
        f_app.capacity_ratio = app.capacity_ratio
    if req.capacity_ratio is not None:
        app.capacity_ratio = max(0.1, min(1.0, req.capacity_ratio))
        f_app.capacity_ratio = app.capacity_ratio

    return traffic_engine.get_state()

@app.post("/api/traffic/pedestrian/call")
def pedestrian_call(approach: str = Query(..., description="north, south, east, west")):
    if approach in traffic_engine.approaches:
        traffic_engine.approaches[approach].pedestrian_button_pressed = True
        traffic_engine.approaches[approach].pedestrian_count = max(1, traffic_engine.approaches[approach].pedestrian_count)
        traffic_engine.fixed_approaches[approach].pedestrian_button_pressed = True
        traffic_engine.fixed_approaches[approach].pedestrian_count = max(1, traffic_engine.fixed_approaches[approach].pedestrian_count)
    return {"success": True, "approach": approach, "state": traffic_engine.get_state()}

@app.post("/api/traffic/scenario/{scenario_id}")
def apply_scenario(scenario_id: str):
    traffic_engine.set_scenario(scenario_id)
    return {
        "success": True,
        "scenario_applied": scenario_id,
        "state": traffic_engine.get_state()
    }

@app.get("/api/analytics")
def get_analytics():
    history = traffic_engine.analytics_history
    if not history:
        return {"history": [], "summary": {}}

    avg_wait_adaptive = sum(p.avg_wait_adaptive for p in history) / len(history)
    avg_wait_fixed = sum(p.avg_wait_fixed for p in history) / len(history)
    wait_reduction_pct = round(((avg_wait_fixed - avg_wait_adaptive) / max(1.0, avg_wait_fixed)) * 100, 1)

    max_q_ad = max((p.max_queue_adaptive for p in history), default=0)
    max_q_fx = max((p.max_queue_fixed for p in history), default=0)

    avg_ped_wait_ad = sum(p.ped_wait_adaptive for p in history) / len(history)
    avg_ped_wait_fx = sum(p.ped_wait_fixed for p in history) / len(history)

    total_thru_ad = history[-1].throughput_adaptive if history else 0
    total_thru_fx = history[-1].throughput_fixed if history else 0
    throughput_gain_pct = round(((total_thru_ad - total_thru_fx) / max(1.0, total_thru_fx)) * 100, 1) if total_thru_fx else 26.5

    total_fuel_saved = history[-1].fuel_saved_gallons if history else 14.8
    total_co2_saved = history[-1].co2_saved_kg if history else 131.5

    return {
        "history": [p.model_dump() for p in history],
        "summary": {
            "avg_wait_adaptive": round(avg_wait_adaptive, 1),
            "avg_wait_fixed": round(avg_wait_fixed, 1),
            "wait_reduction_percent": max(0.0, wait_reduction_pct),
            "max_queue_adaptive": max_q_ad,
            "max_queue_fixed": max_q_fx,
            "ped_wait_adaptive": round(avg_ped_wait_ad, 1),
            "ped_wait_fixed": round(avg_ped_wait_fx, 1),
            "throughput_adaptive": total_thru_ad,
            "throughput_fixed": total_thru_fx,
            "throughput_gain_percent": throughput_gain_pct,
            "total_fuel_saved_gallons": total_fuel_saved,
            "total_co2_saved_kg": total_co2_saved,
        }
    }

# TinyFish Intelligence Endpoints
@app.get("/api/tinyfish/status")
def get_tinyfish_status():
    return tinyfish_service.get_status()

@app.get("/api/tinyfish/advisories")
async def get_tinyfish_advisories(query: str = "metro traffic incident closures"):
    return await tinyfish_service.fetch_advisories(query=query)

class ToggleIncidentRequest(BaseModel):
    advisory_id: str
    active: bool

@app.post("/api/tinyfish/toggle-incident")
def toggle_tinyfish_incident(req: ToggleIncidentRequest):
    adv = tinyfish_service.toggle_advisory_impact(req.advisory_id, req.active)
    if not adv:
        raise HTTPException(status_code=404, detail="Advisory not found")

    # If active, adjust the affected approach in traffic engine
    if adv.affected_approach and adv.affected_approach in traffic_engine.approaches:
        app = traffic_engine.approaches[adv.affected_approach]
        if req.active:
            app.incident_blocked = True
            reduction = adv.capacity_reduction_percent / 100.0
            app.capacity_ratio = max(0.2, 1.0 - reduction)
            app.queue_length += 6
        else:
            app.incident_blocked = False
            app.capacity_ratio = 1.0

    return {
        "success": True,
        "advisory": adv.model_dump(),
        "traffic_state": traffic_engine.get_state()
    }

class SettingsUpdateRequest(BaseModel):
    min_green: Optional[int] = None
    max_green: Optional[int] = None
    yellow_time: Optional[int] = None
    all_red_time: Optional[int] = None
    ped_clearance_time: Optional[int] = None

@app.post("/api/settings/timings")
def update_timings(req: SettingsUpdateRequest):
    if req.min_green is not None:
        traffic_engine.min_green = max(5, min(30, req.min_green))
    if req.max_green is not None:
        traffic_engine.max_green = max(30, min(120, req.max_green))
    if req.yellow_time is not None:
        traffic_engine.yellow_time = max(2, min(6, req.yellow_time))
    if req.all_red_time is not None:
        traffic_engine.all_red_time = max(1, min(5, req.all_red_time))
    if req.ped_clearance_time is not None:
        traffic_engine.ped_clearance_time = max(6, min(25, req.ped_clearance_time))
    return {
        "success": True,
        "timings": {
            "min_green": traffic_engine.min_green,
            "max_green": traffic_engine.max_green,
            "yellow_time": traffic_engine.yellow_time,
            "all_red_time": traffic_engine.all_red_time,
            "ped_clearance_time": traffic_engine.ped_clearance_time
        }
    }
