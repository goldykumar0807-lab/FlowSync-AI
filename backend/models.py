from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal, Any
from datetime import datetime

class ApproachState(BaseModel):
    name: str  # 'north', 'south', 'east', 'west'
    label: str  # 'North Approach (Main Blvd)', etc.
    queue_length: int = Field(default=0, ge=0)
    arrival_rate: float = Field(default=15.0, ge=0)  # vehicles per minute
    avg_wait_time: float = Field(default=0.0, ge=0)  # seconds
    max_wait_time: float = Field(default=0.0, ge=0)  # seconds
    pedestrian_count: int = Field(default=0, ge=0)
    pedestrian_wait_time: float = Field(default=0.0, ge=0)
    pedestrian_button_pressed: bool = False
    incident_blocked: bool = False
    speed_limit_mph: int = 35
    capacity_ratio: float = 1.0  # 1.0 normal, 0.5 if lane closed

class SignalState(BaseModel):
    north: Literal['red', 'amber', 'green'] = 'red'
    south: Literal['red', 'amber', 'green'] = 'red'
    east: Literal['red', 'amber', 'green'] = 'red'
    west: Literal['red', 'amber', 'green'] = 'red'
    pedestrian_ns: Literal['dont_walk', 'walk', 'flashing'] = 'dont_walk'
    pedestrian_ew: Literal['dont_walk', 'walk', 'flashing'] = 'dont_walk'

class DecisionLog(BaseModel):
    id: str
    timestamp: str
    phase_chosen: str
    duration: int
    trigger_reason: str
    queue_ns: int
    queue_ew: int
    ped_ns: int
    ped_ew: int
    controller_mode: str
    priority_scores: Dict[str, float]

class TrafficMetricPoint(BaseModel):
    timestamp: str
    time_sec: int
    queue_ns: int
    queue_ew: int
    avg_wait_adaptive: float
    avg_wait_fixed: float
    max_queue_adaptive: int
    max_queue_fixed: int
    ped_wait_adaptive: float
    ped_wait_fixed: float
    throughput_adaptive: int
    throughput_fixed: int
    fuel_saved_gallons: float
    co2_saved_kg: float

class AIRecommendation(BaseModel):
    recommended_phase: str
    recommended_duration: int
    reason: str
    confidence: float
    scores: Dict[str, float]
    min_green: int
    max_green: int
    clearance_intervals: Dict[str, int]

class IntersectionState(BaseModel):
    simulation_running: bool = True
    simulation_speed: float = 1.0  # 1.0, 2.0, 5.0
    simulation_time_sec: int = 0
    controller_mode: Literal['adaptive', 'fixed', 'manual'] = 'adaptive'
    current_phase: str = 'NS_GREEN'  # 'NS_GREEN', 'NS_YELLOW', 'ALL_RED_1', 'EW_GREEN', 'EW_YELLOW', 'ALL_RED_2', 'PED_EXCLUSIVE'
    phase_time_remaining: int = 25
    phase_total_duration: int = 30
    approaches: Dict[str, ApproachState]
    signals: SignalState
    total_queued: int = 0
    avg_wait_time: float = 0.0
    max_queue: int = 0
    total_pedestrians_waiting: int = 0
    active_incident_count: int = 0
    emergency_vehicle_active: bool = False
    emergency_approach: Optional[str] = None
    ai_recommendation: Dict
    decision_history: List[DecisionLog] = []
    
    # Dual simulation twin metrics
    fixed_current_phase: str = "NS_GREEN"
    fixed_phase_remaining: int = 40
    fixed_total_queued: int = 0
    fixed_avg_wait: float = 0.0
    metrics_comparison: Dict[str, Any] = {}

class TinyFishAdvisory(BaseModel):
    id: str
    title: str
    category: Literal['closure', 'incident', 'advisory', 'construction', 'weather']
    severity: Literal['critical', 'high', 'moderate', 'low']
    location: str
    affected_approach: Optional[str] = None  # 'north', 'south', 'east', 'west', or 'all'
    description: str
    source_name: str
    source_url: str
    published_at: str
    is_active: bool = True
    capacity_reduction_percent: int = 0

class ScenarioPreset(BaseModel):
    id: str
    name: str
    description: str
    arrival_rates: Dict[str, float]
    pedestrian_demand: Dict[str, int]
    incident_approach: Optional[str] = None
    emergency_approach: Optional[str] = None
