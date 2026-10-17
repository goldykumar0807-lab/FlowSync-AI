import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { DemoModeModal } from './components/common/DemoModeModal';
import { OverviewPage } from './pages/OverviewPage';
import { LiveIntersectionPage } from './pages/LiveIntersectionPage';
import { AdaptiveControllerPage } from './pages/AdaptiveControllerPage';
import { PedestrianManagementPage } from './pages/PedestrianManagementPage';
import { TrafficAnalyticsPage } from './pages/TrafficAnalyticsPage';
import { TinyFishIntelligencePage } from './pages/TinyFishIntelligencePage';
import { ScenarioSimulatorPage } from './pages/ScenarioSimulatorPage';
import { SettingsPage } from './pages/SettingsPage';
import { trafficApi } from './services/api';
import { IntersectionState, TrafficMetricPoint, AnalyticsSummary, ApproachName } from './types/traffic';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Core Simulation State
  const [state, setState] = useState<IntersectionState | null>(null);
  const [analytics, setAnalytics] = useState<{
    history: TrafficMetricPoint[];
    summary: AnalyticsSummary;
  }>({
    history: [],
    summary: {
      avg_wait_adaptive: 16.5,
      avg_wait_fixed: 27.8,
      wait_reduction_percent: 40.6,
      max_queue_adaptive: 14,
      max_queue_fixed: 22,
      ped_wait_adaptive: 12.5,
      ped_wait_fixed: 22.8,
      throughput_adaptive: 114,
      throughput_fixed: 82,
      throughput_gain_percent: 39.0,
      total_fuel_saved_gallons: 8.6,
      total_co2_saved_kg: 77.4,
    },
  });

  const fetchLatestState = useCallback(async () => {
    try {
      const st = await trafficApi.getState();
      if (st) {
        setState(st);
        setBackendOnline(true);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  const fetchLatestAnalytics = useCallback(async () => {
    try {
      const an = await trafficApi.getAnalytics();
      if (an && an.history) {
        setAnalytics(an);
      }
    } catch {
      // fallback
    }
  }, []);

  // Poll state and analytics regularly
  useEffect(() => {
    fetchLatestState();
    fetchLatestAnalytics();

    const stateInterval = setInterval(() => {
      fetchLatestState();
    }, 1000);

    const analyticsInterval = setInterval(() => {
      fetchLatestAnalytics();
    }, 4000);

    return () => {
      clearInterval(stateInterval);
      clearInterval(analyticsInterval);
    };
  }, [fetchLatestState, fetchLatestAnalytics]);

  // Handlers for controls
  const handleControlSimulation = async (
    action?: 'play' | 'pause' | 'reset' | 'step',
    speed?: number,
    mode?: any,
    manual_phase?: string
  ) => {
    try {
      const next = await trafficApi.controlSimulation({ action, speed, mode, manual_phase });
      if (next) setState(next);
    } catch {
      // fallback handled
    }
  };

  const handleUpdateApproach = async (name: ApproachName, updates: any) => {
    // 1. Optimistically calculate and update state immediately for zero-latency slider feedback
    setState((prevState) => {
      if (!prevState) return prevState;
      const nextApproaches = {
        ...prevState.approaches,
        [name]: { ...prevState.approaches[name], ...updates },
      };

      const ns_q = nextApproaches.north.queue_length + nextApproaches.south.queue_length;
      const ew_q = nextApproaches.east.queue_length + nextApproaches.west.queue_length;
      const ns_wait = (nextApproaches.north.avg_wait_time + nextApproaches.south.avg_wait_time) / 2;
      const ew_wait = (nextApproaches.east.avg_wait_time + nextApproaches.west.avg_wait_time) / 2;
      const ns_peds = nextApproaches.north.pedestrian_count + nextApproaches.south.pedestrian_count;
      const ew_peds = nextApproaches.east.pedestrian_count + nextApproaches.west.pedestrian_count;
      const ns_pressed = nextApproaches.north.pedestrian_button_pressed || nextApproaches.south.pedestrian_button_pressed;
      const ew_pressed = nextApproaches.east.pedestrian_button_pressed || nextApproaches.west.pedestrian_button_pressed;

      const ns_score = Number(((ns_q * 1.6) + (ns_wait * 0.85) + (ns_peds * 2.4) + (ns_pressed ? 18 : 0)).toFixed(1));
      const ew_score = Number(((ew_q * 1.6) + (ew_wait * 0.85) + (ew_peds * 2.4) + (ew_pressed ? 18 : 0)).toFixed(1));

      let recPhase = "NS_GREEN";
      let recDur = 30;
      let reason = "";

      if (prevState.emergency_vehicle_active) {
        recPhase = "WEST_PREEMPTION";
        recDur = 35;
        reason = "Opticom Preemption Triggered: Emergency Vehicle en-route on WEST corridor. Safety interlock active.";
      } else if (ns_peds >= 10 && ns_pressed) {
        recPhase = "NS_GREEN";
        recDur = 26;
        reason = `Pedestrian Surge Priority: ${ns_peds} waiting pedestrians on North-South crosswalk. Pedestrian walk interval prioritized.`;
      } else if (ew_peds >= 10 && ew_pressed) {
        recPhase = "EW_GREEN";
        recDur = 26;
        reason = `Pedestrian Surge Priority: ${ew_peds} waiting pedestrians on East-West crosswalk. Pedestrian walk interval prioritized.`;
      } else if (ns_score >= ew_score) {
        recPhase = "NS_GREEN";
        const ratio = Math.max(0.15, Math.min(1.0, ns_q / 32.0));
        recDur = Math.round(10 + ratio * 50);
        reason = `North-South corridor prioritized (Score: ${ns_score} vs EW: ${ew_score}). Combined queue: ${ns_q} veh, ${ns_peds} peds. Dynamic Webster green: ${recDur}s.`;
      } else {
        recPhase = "EW_GREEN";
        const ratio = Math.max(0.15, Math.min(1.0, ew_q / 32.0));
        recDur = Math.round(10 + ratio * 50);
        reason = `East-West arterial prioritized (Score: ${ew_score} vs NS: ${ns_score}). Combined queue: ${ew_q} veh, ${ew_peds} peds. Dynamic Webster green: ${recDur}s.`;
      }

      const totalQ = Object.values(nextApproaches).reduce((acc, a) => acc + a.queue_length, 0);
      const maxQ = Math.max(...Object.values(nextApproaches).map((a) => a.queue_length));
      const totalPeds = Object.values(nextApproaches).reduce((acc, a) => acc + a.pedestrian_count, 0);

      return {
        ...prevState,
        approaches: nextApproaches,
        total_queued: totalQ,
        max_queue: maxQ,
        total_pedestrians_waiting: totalPeds,
        ai_recommendation: {
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
        },
      };
    });

    // 2. Transmit to backend
    try {
      const next = await trafficApi.updateApproach(name, updates);
      if (next) setState(next);
    } catch {
      // fallback handled
    }
  };

  const handlePedestrianCall = async (approach: ApproachName) => {
    try {
      const res = await trafficApi.callPedestrian(approach);
      if (res.state) setState(res.state);
    } catch {
      // fallback handled
    }
  };

  const handleAddCar = async (approach: ApproachName) => {
    if (!state) return;
    const currentQ = state.approaches[approach].queue_length;
    await handleUpdateApproach(approach, { queue_length: currentQ + 1 });
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-slate-300 font-mono space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-spin">
          <div className="w-6 h-6 rounded-lg bg-cyan-400" />
        </div>
        <div className="text-sm font-semibold tracking-wide">
          FlowSync AI Initializing Telemetry Hub...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          state={state}
          backendOnline={backendOnline}
          onOpenDemoInfo={() => setDemoModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <TopNavbar
            activeTab={activeTab}
            state={state}
            onControlSimulation={handleControlSimulation}
            onOpenDemoInfo={() => setDemoModalOpen(true)}
          />

          {/* Active Page View */}
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-navy-950 via-navy-900/60 to-navy-950">
            <div className="max-w-7xl mx-auto">
              {activeTab === 'overview' && (
                <OverviewPage
                  state={state}
                  analytics={analytics}
                  onNavigate={setActiveTab}
                  onPedestrianCall={handlePedestrianCall}
                  onAddCar={handleAddCar}
                />
              )}

              {activeTab === 'live_intersection' && (
                <LiveIntersectionPage
                  state={state}
                  onControlSimulation={handleControlSimulation}
                  onUpdateApproach={handleUpdateApproach}
                  onPedestrianCall={handlePedestrianCall}
                  onAddCar={handleAddCar}
                />
              )}

              {activeTab === 'adaptive_controller' && (
                <AdaptiveControllerPage state={state} />
              )}

              {activeTab === 'pedestrian_management' && (
                <PedestrianManagementPage
                  state={state}
                  onPedestrianCall={handlePedestrianCall}
                  onUpdateApproach={handleUpdateApproach}
                />
              )}

              {activeTab === 'traffic_analytics' && (
                <TrafficAnalyticsPage analytics={analytics} />
              )}

              {activeTab === 'tinyfish_intelligence' && (
                <TinyFishIntelligencePage
                  onAdvisoryInjected={() => {
                    fetchLatestState();
                    fetchLatestAnalytics();
                  }}
                />
              )}

              {activeTab === 'scenario_simulator' && (
                <ScenarioSimulatorPage
                  state={state}
                  onScenarioApplied={() => {
                    fetchLatestState();
                    fetchLatestAnalytics();
                  }}
                  onUpdateApproach={handleUpdateApproach}
                  onControlSimulation={handleControlSimulation}
                />
              )}

              {activeTab === 'settings' && <SettingsPage />}
            </div>
          </main>
        </div>
      </div>

      {/* Hackathon Demo Information Modal */}
      <DemoModeModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
};

export default App;
