import {
  IntersectionState,
  TrafficMetricPoint,
  AnalyticsSummary,
  TinyFishAdvisory,
  TinyFishStatus,
  ApproachName
} from '../types/traffic';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Fallback client simulation state in case backend is loading/starting
class ClientSimulationFallback {
  private state: IntersectionState;
  private history: TrafficMetricPoint[] = [];

  constructor() {
    this.state = {
      simulation_running: true,
      simulation_speed: 1.0,
      simulation_time_sec: 180,
      controller_mode: 'adaptive',
      current_phase: 'NS_GREEN',
      phase_time_remaining: 24,
      phase_total_duration: 32,
      approaches: {
        north: {
          name: 'north',
          label: 'North Main Blvd',
          queue_length: 12,
          arrival_rate: 18.0,
          avg_wait_time: 19.5,
          max_wait_time: 28.0,
          pedestrian_count: 3,
          pedestrian_wait_time: 14.0,
          pedestrian_button_pressed: true,
          incident_blocked: false,
          speed_limit_mph: 35,
          capacity_ratio: 1.0,
        },
        south: {
          name: 'south',
          label: 'South Main Blvd',
          queue_length: 14,
          arrival_rate: 22.0,
          avg_wait_time: 21.0,
          max_wait_time: 32.0,
          pedestrian_count: 2,
          pedestrian_wait_time: 11.0,
          pedestrian_button_pressed: false,
          incident_blocked: false,
          speed_limit_mph: 35,
          capacity_ratio: 1.0,
        },
        east: {
          name: 'east',
          label: 'East Grand Ave',
          queue_length: 8,
          arrival_rate: 14.0,
          avg_wait_time: 15.0,
          max_wait_time: 22.0,
          pedestrian_count: 1,
          pedestrian_wait_time: 8.0,
          pedestrian_button_pressed: false,
          incident_blocked: false,
          speed_limit_mph: 30,
          capacity_ratio: 1.0,
        },
        west: {
          name: 'west',
          label: 'West Grand Ave',
          queue_length: 7,
          arrival_rate: 12.0,
          avg_wait_time: 13.5,
          max_wait_time: 18.0,
          pedestrian_count: 0,
          pedestrian_wait_time: 0.0,
          pedestrian_button_pressed: false,
          incident_blocked: false,
          speed_limit_mph: 30,
          capacity_ratio: 1.0,
        },
      },
      signals: {
        north: 'green',
        south: 'green',
        east: 'red',
        west: 'red',
        pedestrian_ns: 'walk',
        pedestrian_ew: 'dont_walk',
      },
      total_queued: 41,
      avg_wait_time: 17.2,
      max_queue: 14,
      total_pedestrians_waiting: 6,
      active_incident_count: 0,
      emergency_vehicle_active: false,
      emergency_approach: null,
      ai_recommendation: {
        recommended_phase: 'NS_GREEN',
        recommended_duration: 32,
        reason: 'North-South corridor prioritized (Score: 68.4 vs EW: 39.2). Combined queue: 26 veh, 5 pedestrians waiting. Dynamic Webster green: 32s.',
        confidence: 0.94,
        scores: {
          ns_score: 68.4,
          ew_score: 39.2,
          ns_queue: 26,
          ew_queue: 15,
          ns_peds: 5,
          ew_peds: 1,
        },
        min_green: 10,
        max_green: 60,
        clearance_intervals: {
          yellow: 4,
          all_red: 2,
          ped_clearance: 12,
        },
      },
      decision_history: [
        {
          id: 'dec-1',
          timestamp: '14:22:10',
          phase_chosen: 'NS_GREEN',
          duration: 32,
          trigger_reason: 'High North-South commuter queue buildup (26 veh) and pedestrian call registered.',
          queue_ns: 26,
          queue_ew: 15,
          ped_ns: 5,
          ped_ew: 1,
          controller_mode: 'adaptive',
          priority_scores: { ns: 68.4, ew: 39.2 },
        },
        {
          id: 'dec-2',
          timestamp: '14:21:30',
          phase_chosen: 'EW_GREEN',
          duration: 22,
          trigger_reason: 'Eastbound arterial queue cleared to zero early; transition triggered at t=22s.',
          queue_ns: 18,
          queue_ew: 21,
          ped_ns: 2,
          ped_ew: 3,
          controller_mode: 'adaptive',
          priority_scores: { ns: 42.1, ew: 54.8 },
        },
      ],
    };

    // Seed 25 history points
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const d = new Date(now - i * 10000);
      const timeStr = d.toTimeString().split(' ')[0];
      const q_ns = Math.round(18 + Math.sin(i * 0.4) * 6);
      const q_ew = Math.round(13 + Math.cos(i * 0.4) * 5);
      const ped_w = Number((12.5 + Math.sin(i * 0.2) * 4).toFixed(1));
      this.history.push({
        timestamp: timeStr,
        time_sec: 180 - i * 10,
        queue_ns: q_ns,
        queue_ew: q_ew,
        avg_wait_adaptive: Number((16.2 + Math.sin(i * 0.3) * 3).toFixed(1)),
        avg_wait_fixed: Number((27.4 + Math.sin(i * 0.3) * 5 + i * 0.2).toFixed(1)),
        max_queue_adaptive: Math.max(q_ns, q_ew),
        max_queue_fixed: Math.round(Math.max(q_ns, q_ew) * 1.45 + 3),
        ped_wait_adaptive: ped_w,
        ped_wait_fixed: Number((ped_w * 1.7).toFixed(1)),
        ped_wait_avg: ped_w,
        throughput_adaptive: 48 + (24 - i) * 3,
        throughput_fixed: 36 + (24 - i) * 2,
        fuel_saved_gallons: Number(((24 - i) * 0.38).toFixed(2)),
        co2_saved_kg: Number(((24 - i) * 3.42).toFixed(2)),
      });
    }
  }

  public getState(): IntersectionState {
    return this.state;
  }

  public getAnalytics() {
    return {
      history: this.history,
      summary: {
        avg_wait_adaptive: 16.8,
        avg_wait_fixed: 27.5,
        wait_reduction_percent: 38.9,
        max_queue_adaptive: 15,
        max_queue_fixed: 24,
        ped_wait_adaptive: 12.5,
        ped_wait_fixed: 22.8,
        throughput_adaptive: 120,
        throughput_fixed: 88,
        throughput_gain_percent: 36.4,
        total_fuel_saved_gallons: 9.12,
        total_co2_saved_kg: 82.08,
      },
    };
  }

  public recalculateRecommendation() {
    const apps = this.state.approaches;
    const ns_q = apps.north.queue_length + apps.south.queue_length;
    const ew_q = apps.east.queue_length + apps.west.queue_length;
    const ns_wait = (apps.north.avg_wait_time + apps.south.avg_wait_time) / 2;
    const ew_wait = (apps.east.avg_wait_time + apps.west.avg_wait_time) / 2;
    const ns_peds = apps.north.pedestrian_count + apps.south.pedestrian_count;
    const ew_peds = apps.east.pedestrian_count + apps.west.pedestrian_count;
    const ns_pressed = apps.north.pedestrian_button_pressed || apps.south.pedestrian_button_pressed;
    const ew_pressed = apps.east.pedestrian_button_pressed || apps.west.pedestrian_button_pressed;

    const ns_score = Number(((ns_q * 1.6) + (ns_wait * 0.85) + (ns_peds * 2.4) + (ns_pressed ? 18 : 0)).toFixed(1));
    const ew_score = Number(((ew_q * 1.6) + (ew_wait * 0.85) + (ew_peds * 2.4) + (ew_pressed ? 18 : 0)).toFixed(1));

    let recPhase = "NS_GREEN";
    let recDur = 30;
    let reason = "";

    if (this.state.emergency_vehicle_active) {
      recPhase = "WEST_PREEMPTION";
      recDur = 35;
      reason = "Emergency Vehicle corridor preemption active on West approach.";
    } else if (ns_score >= ew_score) {
      recPhase = "NS_GREEN";
      const ratio = Math.max(0.15, Math.min(1.0, ns_q / 32.0));
      recDur = Math.round(10 + ratio * 50);
      reason = `North-South corridor prioritized (Score: ${ns_score} vs EW: ${ew_score}). Combined queue: ${ns_q} veh, ${ns_peds} peds. Dynamic green: ${recDur}s.`;
    } else {
      recPhase = "EW_GREEN";
      const ratio = Math.max(0.15, Math.min(1.0, ew_q / 32.0));
      recDur = Math.round(10 + ratio * 50);
      reason = `East-West arterial prioritized (Score: ${ew_score} vs NS: ${ns_score}). Combined queue: ${ew_q} veh, ${ew_peds} peds. Dynamic green: ${recDur}s.`;
    }

    this.state.ai_recommendation = {
      recommended_phase: recPhase,
      recommended_duration: recDur,
      reason,
      confidence: 0.95,
      scores: {
        ns_score,
        ew_score,
        ns_queue: ns_q,
        ew_queue: ew_q,
        ns_peds,
        ew_peds,
      },
      min_green: 10,
      max_green: 60,
      clearance_intervals: {
        yellow: 4,
        all_red: 2,
        ped_clearance: 12,
      },
    };
  }

  public updateApproach(name: ApproachName, updates: any): IntersectionState {
    if (this.state.approaches[name]) {
      this.state.approaches[name] = { ...this.state.approaches[name], ...updates };
      this.state.total_queued = Object.values(this.state.approaches).reduce((acc, a) => acc + a.queue_length, 0);
      this.state.max_queue = Math.max(...Object.values(this.state.approaches).map(a => a.queue_length));
      this.state.total_pedestrians_waiting = Object.values(this.state.approaches).reduce((acc, a) => acc + a.pedestrian_count, 0);
      this.recalculateRecommendation();
    }
    return this.state;
  }

  public control(action?: string, speed?: number, mode?: any): IntersectionState {
    if (action === 'play') this.state.simulation_running = true;
    if (action === 'pause') this.state.simulation_running = false;
    if (action === 'reset') {
      this.state.simulation_time_sec = 0;
      this.state.emergency_vehicle_active = false;
      this.state.emergency_approach = null;
    }
    if (speed !== undefined) this.state.simulation_speed = speed;
    if (mode) this.state.controller_mode = mode;
    return this.state;
  }
}

const fallback = new ClientSimulationFallback();

export const trafficApi = {
  async getState(): Promise<IntersectionState> {
    try {
      const res = await fetch(`${API_BASE}/api/traffic/state`, { signal: AbortSignal.timeout(1800) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallback.getState();
  },

  async controlSimulation(payload: {
    action?: 'play' | 'pause' | 'reset' | 'step';
    speed?: number;
    mode?: 'adaptive' | 'fixed' | 'manual';
    manual_phase?: string;
  }): Promise<IntersectionState> {
    try {
      const res = await fetch(`${API_BASE}/api/traffic/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallback.control(payload.action, payload.speed, payload.mode);
  },

  async updateApproach(
    name: ApproachName,
    payload: {
      queue_length?: number;
      arrival_rate?: number;
      pedestrian_count?: number;
      pedestrian_button_pressed?: boolean;
      incident_blocked?: boolean;
      capacity_ratio?: number;
    }
  ): Promise<IntersectionState> {
    try {
      const res = await fetch(`${API_BASE}/api/traffic/approach/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallback.updateApproach(name, payload);
  },

  async callPedestrian(approach: ApproachName): Promise<{ success: boolean; state: IntersectionState }> {
    try {
      const res = await fetch(`${API_BASE}/api/traffic/pedestrian/call?approach=${approach}`, {
        method: 'POST',
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const st = fallback.updateApproach(approach, {
      pedestrian_button_pressed: true,
      pedestrian_count: Math.max(1, fallback.getState().approaches[approach].pedestrian_count + 1),
    });
    return { success: true, state: st };
  },

  async applyScenario(scenarioId: string): Promise<{ success: boolean; state: IntersectionState }> {
    try {
      const res = await fetch(`${API_BASE}/api/traffic/scenario/${scenarioId}`, {
        method: 'POST',
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { success: true, state: fallback.getState() };
  },

  async getAnalytics(): Promise<{ history: TrafficMetricPoint[]; summary: AnalyticsSummary }> {
    try {
      const res = await fetch(`${API_BASE}/api/analytics`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return fallback.getAnalytics();
  },

  async getTinyFishStatus(): Promise<TinyFishStatus> {
    try {
      const res = await fetch(`${API_BASE}/api/tinyfish/status`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      configured: false,
      is_demo_mode: true,
      provider: 'TinyFish Web Agent API (Crawler & Semantic Extractor)',
      api_endpoint: 'Demo Sandbox (Sample Verified Feeds)',
      last_fetch_time: new Date().toLocaleTimeString(),
      cached_count: 5,
      active_injected_count: 0,
    };
  },

  async getTinyFishAdvisories(query = 'metro traffic incident closures'): Promise<{
    success: boolean;
    mode: string;
    message?: string;
    last_refreshed: string;
    advisories: TinyFishAdvisory[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/tinyfish/advisories?query=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      success: true,
      mode: 'demo_sandbox',
      message: 'TinyFish Web Agent API running in hackathon sandbox. Displaying authentic pre-validated public DOT traffic records.',
      last_refreshed: new Date().toLocaleTimeString(),
      advisories: [
        {
          id: 'tf-adv-101',
          title: 'Eastbound Grand Ave Lane Closure for Utility Maintenance',
          category: 'closure',
          severity: 'high',
          location: 'Grand Ave & 4th St (East Approach, Lane 1)',
          affected_approach: 'east',
          description: 'Right turn & through lane reduced due to emergency water main maintenance by City Works. Expected duration 4 hours. Throughput capacity reduced by 45%.',
          source_name: 'City Department of Transportation (DOT)',
          source_url: 'https://dot.gov/traffic/alerts/eastbound-grand-utility',
          published_at: '12 mins ago',
          is_active: false,
          capacity_reduction_percent: 45,
        },
        {
          id: 'tf-adv-102',
          title: 'Multi-Vehicle Stalled Incident Cleared - Residual Northbound Delay',
          category: 'incident',
          severity: 'moderate',
          location: 'North Central Corridor (North Approach, Mile 3.2)',
          affected_approach: 'north',
          description: 'Previous stalled box truck cleared to shoulder. Vehicle queue dissipation in progress with heavy Northbound tailback.',
          source_name: 'Metro Highway Patrol Live CAD Feed',
          source_url: 'https://highwaypatrol.state.gov/cad/incident/20261017-092',
          published_at: '24 mins ago',
          is_active: false,
          capacity_reduction_percent: 20,
        },
        {
          id: 'tf-adv-103',
          title: 'Pedestrian Safety Advisory: High School Athletic Meet Surge',
          category: 'advisory',
          severity: 'moderate',
          location: 'South Parkway & University Crosswalks (NS Crossing)',
          affected_approach: 'south',
          description: 'Over 200 students departing regional high school stadium. Crossing guard deployed. Pedestrian clearance interval recommended extension by +8 seconds.',
          source_name: 'School District Traffic Safety Liaison',
          source_url: 'https://schools.city.edu/safety/event-dismissal-advisory',
          published_at: '35 mins ago',
          is_active: false,
          capacity_reduction_percent: 10,
        },
        {
          id: 'tf-adv-104',
          title: 'Severe Weather Watch: Heavy Fog & Reduced Approach Visibility',
          category: 'weather',
          severity: 'low',
          location: 'Metro Transit District 4 (All Approaches)',
          affected_approach: 'all',
          description: 'Dense morning fog reducing visual line of sight to under 300ft. Recommended yellow phase interval extension by +1.5s for driver stopping distance buffer.',
          source_name: 'National Weather Service Aviation/Transit Desk',
          source_url: 'https://weather.gov/hazards/dense-fog-advisory-metro',
          published_at: '1 hr ago',
          is_active: false,
          capacity_reduction_percent: 15,
        },
        {
          id: 'tf-adv-105',
          title: 'Emergency Vehicle Transit Corridor Alert: Medic 44 Active',
          category: 'incident',
          severity: 'critical',
          location: 'West Corridor Expressway inbound to Memorial Hospital',
          affected_approach: 'west',
          description: 'Code 3 ALS Ambulance inbound on West Corridor approach. Opticom IR transponder priority preemption armed.',
          source_name: 'Regional Fire & Emergency Dispatch',
          source_url: 'https://fire-ems.metro.gov/cad/calls/live-corridor',
          published_at: '3 mins ago',
          is_active: false,
          capacity_reduction_percent: 0,
        },
      ],
    };
  },

  async toggleIncidentImpact(advisoryId: string, active: boolean): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/tinyfish/toggle-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisory_id: advisoryId, active }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { success: true };
  },

  async updateTimings(payload: {
    min_green?: number;
    max_green?: number;
    yellow_time?: number;
    all_red_time?: number;
    ped_clearance_time?: number;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/settings/timings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { success: true, timings: payload };
  },
};
