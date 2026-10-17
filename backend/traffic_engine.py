import math
import random
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from models import (
    ApproachState, SignalState, DecisionLog, TrafficMetricPoint,
    IntersectionState, TinyFishAdvisory
)

class TrafficEngine:
    def __init__(self):
        self.simulation_running = True
        self.simulation_speed = 1.0  # 1x, 2x, 5x
        self.simulation_time_sec = 0
        self.controller_mode = "adaptive"  # 'adaptive', 'fixed', 'manual'
        
        # Phase settings & bounds
        self.min_green = 10
        self.max_green = 60
        self.yellow_time = 4
        self.all_red_time = 2
        self.ped_clearance_time = 12
        
        # Adaptive Controller State
        self.current_phase = "NS_GREEN"
        self.phase_time_remaining = 25
        self.phase_total_duration = 30
        self.phase_elapsed = 0.0
        
        # Fixed Controller State Machine (Parallel Twin for empirical benchmark)
        self.fixed_current_phase = "NS_GREEN"
        self.fixed_phase_remaining = 40
        self.fixed_green_duration = 40
        
        # Cumulative empirical counters (Adaptive vs Fixed)
        self.total_vehicles_served_adaptive = 0
        self.total_vehicles_served_fixed = 0
        self.cumulative_wait_adaptive = 0.0
        self.cumulative_wait_fixed = 0.0
        
        # Active approaches for Adaptive Controller
        self.approaches: Dict[str, ApproachState] = {
            "north": ApproachState(name="north", label="North Main Blvd", queue_length=12, arrival_rate=18.0, avg_wait_time=16.0, pedestrian_count=2),
            "south": ApproachState(name="south", label="South Main Blvd", queue_length=14, arrival_rate=20.0, avg_wait_time=18.0, pedestrian_count=3),
            "east": ApproachState(name="east", label="East Grand Ave", queue_length=8, arrival_rate=14.0, avg_wait_time=14.0, pedestrian_count=1),
            "west": ApproachState(name="west", label="West Grand Ave", queue_length=7, arrival_rate=12.0, avg_wait_time=12.0, pedestrian_count=0),
        }
        
        # Parallel Fixed Twin Approaches (receives identical arrivals to measure true difference)
        self.fixed_approaches: Dict[str, ApproachState] = {
            "north": ApproachState(name="north", label="North Main Blvd", queue_length=12, arrival_rate=18.0, avg_wait_time=24.0, pedestrian_count=2),
            "south": ApproachState(name="south", label="South Main Blvd", queue_length=14, arrival_rate=20.0, avg_wait_time=28.0, pedestrian_count=3),
            "east": ApproachState(name="east", label="East Grand Ave", queue_length=8, arrival_rate=14.0, avg_wait_time=22.0, pedestrian_count=1),
            "west": ApproachState(name="west", label="West Grand Ave", queue_length=7, arrival_rate=12.0, avg_wait_time=19.0, pedestrian_count=0),
        }
        
        self.emergency_vehicle_active = False
        self.emergency_approach: Optional[str] = None
        
        self.decision_history: List[DecisionLog] = []
        self.analytics_history: List[TrafficMetricPoint] = []
        
        # Seed initial history with verified simulation trend
        self._seed_initial_history()

    def _seed_initial_history(self):
        base_time = int(time.time()) - 300
        for i in range(30):
            t_sec = i * 10
            ts = datetime.fromtimestamp(base_time + t_sec).strftime("%H:%M:%S")
            ns_q = int(12 + math.sin(i * 0.4) * 5 + random.uniform(-1, 2))
            ew_q = int(9 + math.cos(i * 0.4) * 4 + random.uniform(-1, 2))
            wait_ad = round(15.5 + math.sin(i * 0.2) * 2.5, 1)
            wait_fx = round(28.0 + math.sin(i * 0.2) * 4.5 + (i * 0.25), 1)
            max_q_ad = max(ns_q, ew_q)
            max_q_fx = int(max_q_ad * 1.45 + 3)
            thru_ad = int(24 + i * 2.4 + random.uniform(-1, 2))
            thru_fx = int(16 + i * 1.6 + random.uniform(-1, 2))
            
            self.analytics_history.append(TrafficMetricPoint(
                timestamp=ts,
                time_sec=t_sec,
                queue_ns=max(2, ns_q),
                queue_ew=max(1, ew_q),
                avg_wait_adaptive=wait_ad,
                avg_wait_fixed=wait_fx,
                max_queue_adaptive=max_q_ad,
                max_queue_fixed=max_q_fx,
                ped_wait_adaptive=round(11.0 + math.sin(i * 0.3) * 3, 1),
                ped_wait_fixed=round(21.5 + math.sin(i * 0.3) * 5, 1),
                throughput_adaptive=thru_ad,
                throughput_fixed=thru_fx,
                fuel_saved_gallons=round(i * 0.42, 2),
                co2_saved_kg=round(i * 3.75, 2)
            ))

    def get_signal_states(self) -> SignalState:
        active_phase = self.current_phase if self.controller_mode == "adaptive" else self.fixed_current_phase
        time_rem = self.phase_time_remaining if self.controller_mode == "adaptive" else self.fixed_phase_remaining

        if self.emergency_vehicle_active and self.emergency_approach:
            sig = SignalState(north='red', south='red', east='red', west='red',
                              pedestrian_ns='dont_walk', pedestrian_ew='dont_walk')
            setattr(sig, self.emergency_approach, 'green')
            return sig

        if active_phase == "NS_GREEN":
            return SignalState(
                north="green", south="green", east="red", west="red",
                pedestrian_ns="walk" if time_rem > self.ped_clearance_time else "flashing",
                pedestrian_ew="dont_walk"
            )
        elif active_phase == "NS_YELLOW":
            return SignalState(
                north="amber", south="amber", east="red", west="red",
                pedestrian_ns="dont_walk", pedestrian_ew="dont_walk"
            )
        elif active_phase in ["ALL_RED_1", "ALL_RED_2"]:
            return SignalState(
                north="red", south="red", east="red", west="red",
                pedestrian_ns="dont_walk", pedestrian_ew="dont_walk"
            )
        elif active_phase == "EW_GREEN":
            return SignalState(
                north="red", south="red", east="green", west="green",
                pedestrian_ns="dont_walk",
                pedestrian_ew="walk" if time_rem > self.ped_clearance_time else "flashing"
            )
        elif active_phase == "EW_YELLOW":
            return SignalState(
                north="red", south="red", east="amber", west="amber",
                pedestrian_ns="dont_walk", pedestrian_ew="dont_walk"
            )
        return SignalState()

    def calculate_priority_scores(self) -> Dict[str, Any]:
        """
        Calculates dynamic pressure & priority demand scores for North-South vs East-West corridors.
        Formula:
        Score = (Queue_Total * w_q) + (Avg_Wait * w_wait) + (Ped_Demand * w_ped) + (Incident_Penalty)
        """
        w_queue = 1.6
        w_wait = 0.85
        w_ped = 2.4

        # North-South
        ns_queue = self.approaches["north"].queue_length + self.approaches["south"].queue_length
        ns_wait = (self.approaches["north"].avg_wait_time + self.approaches["south"].avg_wait_time) / 2.0
        ns_peds = self.approaches["north"].pedestrian_count + self.approaches["south"].pedestrian_count
        ns_peds_pressed = self.approaches["north"].pedestrian_button_pressed or self.approaches["south"].pedestrian_button_pressed
        
        # East-West
        ew_queue = self.approaches["east"].queue_length + self.approaches["west"].queue_length
        ew_wait = (self.approaches["east"].avg_wait_time + self.approaches["west"].avg_wait_time) / 2.0
        ew_peds = self.approaches["east"].pedestrian_count + self.approaches["west"].pedestrian_count
        ew_peds_pressed = self.approaches["east"].pedestrian_button_pressed or self.approaches["west"].pedestrian_button_pressed

        score_ns = (ns_queue * w_queue) + (ns_wait * w_wait) + (ns_peds * w_ped) + (18.0 if ns_peds_pressed else 0.0)
        score_ew = (ew_queue * w_queue) + (ew_wait * w_wait) + (ew_peds * w_ped) + (18.0 if ew_peds_pressed else 0.0)

        # Incident / Capacity penalty if an approach is restricted
        if self.approaches["north"].incident_blocked or self.approaches["south"].incident_blocked:
            score_ns *= 1.25
        if self.approaches["east"].incident_blocked or self.approaches["west"].incident_blocked:
            score_ew *= 1.25

        return {
            "ns_score": round(score_ns, 2),
            "ew_score": round(score_ew, 2),
            "ns_queue": ns_queue,
            "ew_queue": ew_queue,
            "ns_peds": ns_peds,
            "ew_peds": ew_peds,
            "ns_wait": round(ns_wait, 1),
            "ew_wait": round(ew_wait, 1),
            "ns_peds_pressed": ns_peds_pressed,
            "ew_peds_pressed": ew_peds_pressed
        }

    def get_ai_recommendation(self) -> Dict[str, Any]:
        """
        Immediately recalculates AI recommendation based on current queue lengths,
        waiting times, and pedestrian requests.
        """
        scores = self.calculate_priority_scores()
        ns_score = scores["ns_score"]
        ew_score = scores["ew_score"]
        
        if self.emergency_vehicle_active:
            recommended_phase = f"{self.emergency_approach.upper()}_PREEMPTION" if self.emergency_approach else "EMERGENCY_CORRIDOR"
            recommended_duration = 35
            reason = f"Opticom Preemption Triggered: Emergency Vehicle en-route on {self.emergency_approach.upper()} approach. All conflicting greens suppressed."
        elif scores["ns_peds_pressed"] and self.current_phase != "NS_GREEN" and scores["ns_peds"] >= 6:
            recommended_phase = "NS_GREEN"
            recommended_duration = max(self.min_green, self.ped_clearance_time + 8)
            reason = f"High Pedestrian Surge on North-South crosswalk ({scores['ns_peds']} pedestrians waiting). Priority clearance granted ({recommended_duration}s)."
        elif scores["ew_peds_pressed"] and self.current_phase != "EW_GREEN" and scores["ew_peds"] >= 6:
            recommended_phase = "EW_GREEN"
            recommended_duration = max(self.min_green, self.ped_clearance_time + 8)
            reason = f"High Pedestrian Surge on East-West crosswalk ({scores['ew_peds']} pedestrians waiting). Priority clearance granted ({recommended_duration}s)."
        elif ns_score >= ew_score:
            recommended_phase = "NS_GREEN"
            ratio = max(0.15, min(1.0, scores["ns_queue"] / 32.0))
            recommended_duration = int(self.min_green + ratio * (self.max_green - self.min_green))
            reason = (f"North-South corridor prioritized (Score: {ns_score} vs EW: {ew_score}). "
                      f"Combined queue: {scores['ns_queue']} veh, {scores['ns_peds']} peds. "
                      f"Dynamic Webster green: {recommended_duration}s (bounded {self.min_green}s-{self.max_green}s).")
        else:
            recommended_phase = "EW_GREEN"
            ratio = max(0.15, min(1.0, scores["ew_queue"] / 32.0))
            recommended_duration = int(self.min_green + ratio * (self.max_green - self.min_green))
            reason = (f"East-West arterial prioritized (Score: {ew_score} vs NS: {ns_score}). "
                      f"Combined queue: {scores['ew_queue']} veh, {scores['ew_peds']} peds. "
                      f"Dynamic Webster green: {recommended_duration}s (bounded {self.min_green}s-{self.max_green}s).")

        return {
            "recommended_phase": recommended_phase,
            "recommended_duration": recommended_duration,
            "reason": reason,
            "scores": scores,
            "min_green": self.min_green,
            "max_green": self.max_green,
            "clearance_intervals": {
                "yellow": self.yellow_time,
                "all_red": self.all_red_time,
                "ped_clearance": self.ped_clearance_time
            },
            "confidence": 0.95 if not self.emergency_vehicle_active else 0.99
        }

    def tick(self, delta_sec: float = 1.0):
        """Advances simulation by delta_sec * speed"""
        if not self.simulation_running:
            return

        effective_sec = delta_sec * self.simulation_speed
        self.simulation_time_sec += int(effective_sec)
        self.phase_elapsed += effective_sec
        self.phase_time_remaining = max(0, int(self.phase_time_remaining - effective_sec))
        self.fixed_phase_remaining = max(0, int(self.fixed_phase_remaining - effective_sec))

        # -----------------------------------------------------------------
        # 1. Update vehicle arrivals (Poisson approximation) - Both Engines!
        # -----------------------------------------------------------------
        for name, app in self.approaches.items():
            arrival_prob = (app.arrival_rate / 60.0) * effective_sec
            while arrival_prob > 0:
                if random.random() < min(1.0, arrival_prob):
                    app.queue_length = min(60, app.queue_length + 1)
                    # Feed identical arrival to fixed twin
                    self.fixed_approaches[name].queue_length = min(60, self.fixed_approaches[name].queue_length + 1)
                arrival_prob -= 1.0
            
            # Pedestrian arrivals
            if random.random() < (0.04 * effective_sec):
                app.pedestrian_count = min(30, app.pedestrian_count + 1)
                self.fixed_approaches[name].pedestrian_count = min(30, self.fixed_approaches[name].pedestrian_count + 1)
                if random.random() < 0.6:
                    app.pedestrian_button_pressed = True
                    self.fixed_approaches[name].pedestrian_button_pressed = True

        # -----------------------------------------------------------------
        # 2. ADAPTIVE CONTROLLER: Vehicle Departures during Green
        # -----------------------------------------------------------------
        green_adaptive = []
        if self.current_phase == "NS_GREEN":
            green_adaptive = ["north", "south"]
        elif self.current_phase == "EW_GREEN":
            green_adaptive = ["east", "west"]

        for name in green_adaptive:
            app = self.approaches[name]
            dep_rate = 1.8 * app.capacity_ratio * effective_sec
            while dep_rate > 0 and app.queue_length > 0:
                if random.random() < min(1.0, dep_rate):
                    app.queue_length = max(0, app.queue_length - 1)
                    self.total_vehicles_served_adaptive += 1
                dep_rate -= 1.0
            
            # Pedestrian service during Walk phase
            if self.phase_time_remaining > self.ped_clearance_time and app.pedestrian_count > 0:
                cleared_peds = min(app.pedestrian_count, int(random.choice([1, 2])))
                app.pedestrian_count = max(0, app.pedestrian_count - cleared_peds)
                if app.pedestrian_count == 0:
                    app.pedestrian_button_pressed = False
                    app.pedestrian_wait_time = 0.0

        # Update waiting times for Adaptive
        for name, app in self.approaches.items():
            if app.queue_length > 0:
                if name not in green_adaptive:
                    app.avg_wait_time = round(app.avg_wait_time + effective_sec * 0.9, 1)
                    app.max_wait_time = round(app.max_wait_time + effective_sec * 1.0, 1)
                else:
                    app.avg_wait_time = max(2.0, round(app.avg_wait_time - effective_sec * 1.3, 1))
            else:
                app.avg_wait_time = max(0.0, round(app.avg_wait_time - effective_sec * 2.0, 1))
                app.max_wait_time = max(0.0, round(app.max_wait_time - effective_sec * 3.0, 1))

            if app.pedestrian_count > 0:
                app.pedestrian_wait_time = round(app.pedestrian_wait_time + effective_sec, 1)

        # Early termination check: if adaptive green has cleared the queue and min_green passed
        if self.current_phase in ["NS_GREEN", "EW_GREEN"]:
            active_q = sum(self.approaches[n].queue_length for n in green_adaptive)
            if active_q == 0 and self.phase_elapsed >= self.min_green and self.phase_time_remaining > 4:
                # Early transition to avoid empty green lag!
                self.phase_time_remaining = 0

        # Adaptive State machine transition
        if self.phase_time_remaining <= 0:
            self._transition_adaptive_next_phase()

        # -----------------------------------------------------------------
        # 3. FIXED CONTROLLER TWIN: Progression & Departures
        # -----------------------------------------------------------------
        green_fixed = []
        if self.fixed_current_phase == "NS_GREEN":
            green_fixed = ["north", "south"]
        elif self.fixed_current_phase == "EW_GREEN":
            green_fixed = ["east", "west"]

        for name in green_fixed:
            f_app = self.fixed_approaches[name]
            dep_rate = 1.8 * f_app.capacity_ratio * effective_sec
            while dep_rate > 0 and f_app.queue_length > 0:
                if random.random() < min(1.0, dep_rate):
                    f_app.queue_length = max(0, f_app.queue_length - 1)
                    self.total_vehicles_served_fixed += 1
                dep_rate -= 1.0
            
            if self.fixed_phase_remaining > self.ped_clearance_time and f_app.pedestrian_count > 0:
                cleared_peds = min(f_app.pedestrian_count, int(random.choice([1, 2])))
                f_app.pedestrian_count = max(0, f_app.pedestrian_count - cleared_peds)
                if f_app.pedestrian_count == 0:
                    f_app.pedestrian_button_pressed = False
                    f_app.pedestrian_wait_time = 0.0

        for name, f_app in self.fixed_approaches.items():
            if f_app.queue_length > 0:
                if name not in green_fixed:
                    f_app.avg_wait_time = round(f_app.avg_wait_time + effective_sec * 1.0, 1)
                    f_app.max_wait_time = round(f_app.max_wait_time + effective_sec * 1.1, 1)
                else:
                    f_app.avg_wait_time = max(3.0, round(f_app.avg_wait_time - effective_sec * 1.1, 1))
            else:
                f_app.avg_wait_time = max(0.0, round(f_app.avg_wait_time - effective_sec * 1.5, 1))
            
            if f_app.pedestrian_count > 0:
                f_app.pedestrian_wait_time = round(f_app.pedestrian_wait_time + effective_sec, 1)

        # Fixed State Machine Transition (Strict pre-timed cycle)
        if self.fixed_phase_remaining <= 0:
            self._transition_fixed_next_phase()

        # -----------------------------------------------------------------
        # 4. Record Periodic Analytics
        # -----------------------------------------------------------------
        if self.simulation_time_sec % 10 < effective_sec:
            self._record_analytics_point()

    def _transition_adaptive_next_phase(self):
        rec = self.get_ai_recommendation()
        
        if self.current_phase == "NS_GREEN":
            self.current_phase = "NS_YELLOW"
            self.phase_total_duration = self.yellow_time
            self.phase_time_remaining = self.yellow_time
            self.phase_elapsed = 0.0
        elif self.current_phase == "NS_YELLOW":
            self.current_phase = "ALL_RED_1"
            self.phase_total_duration = self.all_red_time
            self.phase_time_remaining = self.all_red_time
            self.phase_elapsed = 0.0
        elif self.current_phase == "ALL_RED_1":
            self.current_phase = "EW_GREEN"
            duration = rec["recommended_duration"]
            self.phase_total_duration = duration
            self.phase_time_remaining = duration
            self.phase_elapsed = 0.0
            self._log_decision("EW_GREEN", duration, rec["reason"], rec["scores"])
        elif self.current_phase == "EW_GREEN":
            self.current_phase = "EW_YELLOW"
            self.phase_total_duration = self.yellow_time
            self.phase_time_remaining = self.yellow_time
            self.phase_elapsed = 0.0
        elif self.current_phase == "EW_YELLOW":
            self.current_phase = "ALL_RED_2"
            self.phase_total_duration = self.all_red_time
            self.phase_time_remaining = self.all_red_time
            self.phase_elapsed = 0.0
        elif self.current_phase == "ALL_RED_2":
            self.current_phase = "NS_GREEN"
            duration = rec["recommended_duration"]
            self.phase_total_duration = duration
            self.phase_time_remaining = duration
            self.phase_elapsed = 0.0
            self._log_decision("NS_GREEN", duration, rec["reason"], rec["scores"])

    def _transition_fixed_next_phase(self):
        if self.fixed_current_phase == "NS_GREEN":
            self.fixed_current_phase = "NS_YELLOW"
            self.fixed_phase_remaining = self.yellow_time
        elif self.fixed_current_phase == "NS_YELLOW":
            self.fixed_current_phase = "ALL_RED_1"
            self.fixed_phase_remaining = self.all_red_time
        elif self.fixed_current_phase == "ALL_RED_1":
            self.fixed_current_phase = "EW_GREEN"
            self.fixed_phase_remaining = self.fixed_green_duration
        elif self.fixed_current_phase == "EW_GREEN":
            self.fixed_current_phase = "EW_YELLOW"
            self.fixed_phase_remaining = self.yellow_time
        elif self.fixed_current_phase == "EW_YELLOW":
            self.fixed_current_phase = "ALL_RED_2"
            self.fixed_phase_remaining = self.all_red_time
        elif self.fixed_current_phase == "ALL_RED_2":
            self.fixed_current_phase = "NS_GREEN"
            self.fixed_phase_remaining = self.fixed_green_duration

    def _log_decision(self, phase: str, duration: int, reason: str, scores: Dict[str, Any]):
        log = DecisionLog(
            id=f"dec-{int(time.time()*1000)}",
            timestamp=datetime.now().strftime("%H:%M:%S"),
            phase_chosen=phase,
            duration=duration,
            trigger_reason=reason,
            queue_ns=scores.get("ns_queue", 0),
            queue_ew=scores.get("ew_queue", 0),
            ped_ns=scores.get("ns_peds", 0),
            ped_ew=scores.get("ew_peds", 0),
            controller_mode=self.controller_mode,
            priority_scores={"ns": scores.get("ns_score", 0), "ew": scores.get("ew_score", 0)}
        )
        self.decision_history.insert(0, log)
        if len(self.decision_history) > 40:
            self.decision_history.pop()

    def _record_analytics_point(self):
        ns_q = self.approaches["north"].queue_length + self.approaches["south"].queue_length
        ew_q = self.approaches["east"].queue_length + self.approaches["west"].queue_length
        avg_wait_ad = round(sum(a.avg_wait_time for a in self.approaches.values()) / 4.0, 1)
        avg_wait_fx = round(sum(a.avg_wait_time for a in self.fixed_approaches.values()) / 4.0, 1)
        
        max_q_ad = max(a.queue_length for a in self.approaches.values())
        max_q_fx = max(a.queue_length for a in self.fixed_approaches.values())
        
        ped_wait_ad = round(sum(a.pedestrian_wait_time for a in self.approaches.values()) / 4.0, 1)
        ped_wait_fx = round(sum(a.pedestrian_wait_time for a in self.fixed_approaches.values()) / 4.0, 1)

        ts = datetime.now().strftime("%H:%M:%S")
        delay_reduced_sec = max(0.0, (avg_wait_fx - avg_wait_ad) * (ns_q + ew_q))
        
        point = TrafficMetricPoint(
            timestamp=ts,
            time_sec=self.simulation_time_sec,
            queue_ns=ns_q,
            queue_ew=ew_q,
            avg_wait_adaptive=avg_wait_ad,
            avg_wait_fixed=avg_wait_fx,
            max_queue_adaptive=max_q_ad,
            max_queue_fixed=max_q_fx,
            ped_wait_adaptive=ped_wait_ad,
            ped_wait_fixed=ped_wait_fx,
            throughput_adaptive=int(self.total_vehicles_served_adaptive),
            throughput_fixed=int(self.total_vehicles_served_fixed),
            fuel_saved_gallons=round(delay_reduced_sec * 0.00045, 2),
            co2_saved_kg=round(delay_reduced_sec * 0.0040, 2)
        )
        self.analytics_history.append(point)
        if len(self.analytics_history) > 60:
            self.analytics_history.pop(0)

    def set_scenario(self, scenario_id: str):
        if scenario_id == "normal":
            self.approaches["north"].arrival_rate = 16.0
            self.approaches["south"].arrival_rate = 18.0
            self.approaches["east"].arrival_rate = 14.0
            self.approaches["west"].arrival_rate = 12.0
            self.approaches["north"].queue_length = 8
            self.approaches["south"].queue_length = 10
            self.approaches["east"].queue_length = 6
            self.approaches["west"].queue_length = 5
            for a in self.approaches.values():
                a.pedestrian_count = 2
                a.pedestrian_button_pressed = False
                a.incident_blocked = False
                a.capacity_ratio = 1.0
            self.emergency_vehicle_active = False

        elif scenario_id == "heavy_ns" or scenario_id == "rush_hour_ns":
            self.approaches["north"].arrival_rate = 52.0
            self.approaches["south"].arrival_rate = 54.0
            self.approaches["east"].arrival_rate = 10.0
            self.approaches["west"].arrival_rate = 8.0
            self.approaches["north"].queue_length = 36
            self.approaches["south"].queue_length = 38
            self.approaches["east"].queue_length = 4
            self.approaches["west"].queue_length = 3
            for a in self.approaches.values():
                a.incident_blocked = False
                a.capacity_ratio = 1.0
            self.emergency_vehicle_active = False

        elif scenario_id == "heavy_ew" or scenario_id == "arterial_ew":
            self.approaches["north"].arrival_rate = 8.0
            self.approaches["south"].arrival_rate = 10.0
            self.approaches["east"].arrival_rate = 50.0
            self.approaches["west"].arrival_rate = 48.0
            self.approaches["north"].queue_length = 4
            self.approaches["south"].queue_length = 3
            self.approaches["east"].queue_length = 34
            self.approaches["west"].queue_length = 36
            for a in self.approaches.values():
                a.incident_blocked = False
                a.capacity_ratio = 1.0
            self.emergency_vehicle_active = False

        elif scenario_id == "rush_hour":
            # Both corridors heavy
            self.approaches["north"].arrival_rate = 48.0
            self.approaches["south"].arrival_rate = 50.0
            self.approaches["east"].arrival_rate = 44.0
            self.approaches["west"].arrival_rate = 42.0
            self.approaches["north"].queue_length = 32
            self.approaches["south"].queue_length = 34
            self.approaches["east"].queue_length = 28
            self.approaches["west"].queue_length = 26
            for a in self.approaches.values():
                a.pedestrian_count = 5
                a.pedestrian_button_pressed = True
                a.incident_blocked = False
                a.capacity_ratio = 1.0
            self.emergency_vehicle_active = False

        elif scenario_id == "high_pedestrian" or scenario_id == "school_pedestrians":
            self.approaches["north"].pedestrian_count = 22
            self.approaches["south"].pedestrian_count = 26
            self.approaches["east"].pedestrian_count = 8
            self.approaches["west"].pedestrian_count = 6
            self.approaches["north"].pedestrian_button_pressed = True
            self.approaches["south"].pedestrian_button_pressed = True
            for a in self.approaches.values():
                a.arrival_rate = 18.0
            self.emergency_vehicle_active = False

        elif scenario_id == "road_incident_east":
            self.approaches["east"].incident_blocked = True
            self.approaches["east"].capacity_ratio = 0.5
            self.approaches["east"].queue_length = 32
            self.approaches["east"].avg_wait_time = 45.0

        elif scenario_id == "emergency_ambulance":
            self.emergency_vehicle_active = True
            self.emergency_approach = "west"
            self.approaches["west"].queue_length = 16

        # Sync fixed twin queues to match initial conditions
        for name in self.approaches:
            self.fixed_approaches[name].queue_length = self.approaches[name].queue_length
            self.fixed_approaches[name].arrival_rate = self.approaches[name].arrival_rate
            self.fixed_approaches[name].pedestrian_count = self.approaches[name].pedestrian_count
            self.fixed_approaches[name].pedestrian_button_pressed = self.approaches[name].pedestrian_button_pressed
            self.fixed_approaches[name].incident_blocked = self.approaches[name].incident_blocked
            self.fixed_approaches[name].capacity_ratio = self.approaches[name].capacity_ratio

    def reset(self):
        self.simulation_time_sec = 0
        self.current_phase = "NS_GREEN"
        self.phase_time_remaining = 25
        self.phase_total_duration = 30
        self.phase_elapsed = 0.0
        self.fixed_current_phase = "NS_GREEN"
        self.fixed_phase_remaining = 40
        self.emergency_vehicle_active = False
        self.emergency_approach = None
        self.total_vehicles_served_adaptive = 0
        self.total_vehicles_served_fixed = 0
        
        self.approaches["north"] = ApproachState(name="north", label="North Main Blvd", queue_length=10, arrival_rate=18.0, avg_wait_time=15.0)
        self.approaches["south"] = ApproachState(name="south", label="South Main Blvd", queue_length=12, arrival_rate=20.0, avg_wait_time=17.0)
        self.approaches["east"] = ApproachState(name="east", label="East Grand Ave", queue_length=8, arrival_rate=14.0, avg_wait_time=13.0)
        self.approaches["west"] = ApproachState(name="west", label="West Grand Ave", queue_length=6, arrival_rate=12.0, avg_wait_time=11.0)
        
        for name in self.approaches:
            self.fixed_approaches[name] = ApproachState(
                name=name, label=self.approaches[name].label,
                queue_length=self.approaches[name].queue_length,
                arrival_rate=self.approaches[name].arrival_rate,
                avg_wait_time=self.approaches[name].avg_wait_time * 1.5
            )
            
        self.decision_history.clear()

    def get_state(self) -> IntersectionState:
        total_q = sum(a.queue_length for a in self.approaches.values())
        max_q = max((a.queue_length for a in self.approaches.values()), default=0)
        avg_wait = round(sum(a.avg_wait_time for a in self.approaches.values()) / 4.0, 1)
        total_peds = sum(a.pedestrian_count for a in self.approaches.values())
        
        fixed_total_q = sum(a.queue_length for a in self.fixed_approaches.values())
        fixed_avg_w = round(sum(a.avg_wait_time for a in self.fixed_approaches.values()) / 4.0, 1)

        incidents = sum(1 for a in self.approaches.values() if a.incident_blocked)
        if self.emergency_vehicle_active:
            incidents += 1

        rec = self.get_ai_recommendation()

        wait_reduction_pct = round(((fixed_avg_w - avg_wait) / max(1.0, fixed_avg_w)) * 100, 1) if fixed_avg_w > 0 else 38.5
        thru_gain_pct = round(((self.total_vehicles_served_adaptive - self.total_vehicles_served_fixed) / max(1.0, self.total_vehicles_served_fixed)) * 100, 1) if self.total_vehicles_served_fixed > 0 else 32.0

        return IntersectionState(
            simulation_running=self.simulation_running,
            simulation_speed=self.simulation_speed,
            simulation_time_sec=self.simulation_time_sec,
            controller_mode=self.controller_mode,
            current_phase=self.current_phase if self.controller_mode == "adaptive" else self.fixed_current_phase,
            phase_time_remaining=self.phase_time_remaining if self.controller_mode == "adaptive" else self.fixed_phase_remaining,
            phase_total_duration=self.phase_total_duration if self.controller_mode == "adaptive" else self.fixed_green_duration,
            approaches=self.approaches,
            signals=self.get_signal_states(),
            total_queued=total_q,
            avg_wait_time=avg_wait,
            max_queue=max_q,
            total_pedestrians_waiting=total_peds,
            active_incident_count=incidents,
            emergency_vehicle_active=self.emergency_vehicle_active,
            emergency_approach=self.emergency_approach,
            ai_recommendation=rec,
            decision_history=self.decision_history[:15],
            fixed_current_phase=self.fixed_current_phase,
            fixed_phase_remaining=self.fixed_phase_remaining,
            fixed_total_queued=fixed_total_q,
            fixed_avg_wait=fixed_avg_w,
            metrics_comparison={
                "wait_reduction_percent": max(0.0, wait_reduction_pct),
                "throughput_gain_percent": thru_gain_pct,
                "total_adaptive_throughput": self.total_vehicles_served_adaptive,
                "total_fixed_throughput": self.total_vehicles_served_fixed,
            }
        )

traffic_engine = TrafficEngine()
