export type ApproachName = 'north' | 'south' | 'east' | 'west';

export interface ApproachState {
  name: ApproachName;
  label: string;
  queue_length: number;
  arrival_rate: number; // veh/min
  avg_wait_time: number; // seconds
  max_wait_time: number; // seconds
  pedestrian_count: number;
  pedestrian_wait_time: number;
  pedestrian_button_pressed: boolean;
  incident_blocked: boolean;
  speed_limit_mph: number;
  capacity_ratio: number;
}

export type SignalColor = 'red' | 'amber' | 'green';
export type PedestrianSignal = 'dont_walk' | 'walk' | 'flashing';

export interface SignalState {
  north: SignalColor;
  south: SignalColor;
  east: SignalColor;
  west: SignalColor;
  pedestrian_ns: PedestrianSignal;
  pedestrian_ew: PedestrianSignal;
}

export interface DecisionLog {
  id: string;
  timestamp: string;
  phase_chosen: string;
  duration: number;
  trigger_reason: string;
  queue_ns: number;
  queue_ew: number;
  ped_ns: number;
  ped_ew: number;
  controller_mode: string;
  priority_scores: {
    ns: number;
    ew: number;
  };
}

export interface TrafficMetricPoint {
  timestamp: string;
  time_sec: number;
  queue_ns: number;
  queue_ew: number;
  avg_wait_adaptive: number;
  avg_wait_fixed: number;
  max_queue_adaptive: number;
  max_queue_fixed: number;
  ped_wait_adaptive: number;
  ped_wait_fixed: number;
  ped_wait_avg?: number;
  throughput_adaptive: number;
  throughput_fixed: number;
  fuel_saved_gallons: number;
  co2_saved_kg: number;
}

export interface AIRecommendation {
  recommended_phase: string;
  recommended_duration: number;
  reason: string;
  confidence: number;
  scores: {
    ns_score: number;
    ew_score: number;
    ns_queue: number;
    ew_queue: number;
    ns_peds: number;
    ew_peds: number;
    ns_wait?: number;
    ew_wait?: number;
    ns_peds_pressed?: boolean;
    ew_peds_pressed?: boolean;
  };
  min_green: number;
  max_green: number;
  clearance_intervals: {
    yellow: number;
    all_red: number;
    ped_clearance: number;
  };
}

export interface IntersectionState {
  simulation_running: boolean;
  simulation_speed: number;
  simulation_time_sec: number;
  controller_mode: 'adaptive' | 'fixed' | 'manual';
  current_phase: string;
  phase_time_remaining: number;
  phase_total_duration: number;
  approaches: Record<ApproachName, ApproachState>;
  signals: SignalState;
  total_queued: number;
  avg_wait_time: number;
  max_queue: number;
  total_pedestrians_waiting: number;
  active_incident_count: number;
  emergency_vehicle_active: boolean;
  emergency_approach?: ApproachName | null;
  ai_recommendation: AIRecommendation;
  decision_history: DecisionLog[];
  fixed_current_phase?: string;
  fixed_phase_remaining?: number;
  fixed_total_queued?: number;
  fixed_avg_wait?: number;
  metrics_comparison?: {
    wait_reduction_percent?: number;
    throughput_gain_percent?: number;
    total_adaptive_throughput?: number;
    total_fixed_throughput?: number;
  };
}

export interface TinyFishAdvisory {
  id: string;
  title: string;
  category: 'closure' | 'incident' | 'advisory' | 'construction' | 'weather';
  severity: 'critical' | 'high' | 'moderate' | 'low';
  location: string;
  affected_approach?: ApproachName | 'all' | null;
  description: string;
  source_name: string;
  source_url: string;
  published_at: string;
  is_active: boolean;
  capacity_reduction_percent: number;
}

export interface AnalyticsSummary {
  avg_wait_adaptive: number;
  avg_wait_fixed: number;
  wait_reduction_percent: number;
  max_queue_adaptive: number;
  max_queue_fixed: number;
  ped_wait_adaptive: number;
  ped_wait_fixed: number;
  throughput_adaptive: number;
  throughput_fixed: number;
  throughput_gain_percent: number;
  total_fuel_saved_gallons: number;
  total_co2_saved_kg: number;
}

export interface TinyFishStatus {
  configured: boolean;
  is_demo_mode: boolean;
  provider: string;
  api_endpoint: string;
  last_fetch_time: string;
  cached_count: number;
  active_injected_count: number;
}
