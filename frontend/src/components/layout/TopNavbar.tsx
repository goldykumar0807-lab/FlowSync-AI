import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Bell,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { IntersectionState } from '../../types/traffic';
import { NavTab } from './Sidebar';

interface Props {
  activeTab: NavTab;
  state: IntersectionState;
  backendOnline?: boolean;
  onControlSimulation: (action?: 'play' | 'pause' | 'reset' | 'step', speed?: number) => void;
  onOpenDemoInfo: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Operations Overview',
    subtitle: 'Real-time telemetry, KPI metrics & multi-approach load status',
  },
  live_intersection: {
    title: 'Live 4-Way Intersection',
    subtitle: 'Dynamic physical junction visualization & micro-simulation controls',
  },
  adaptive_controller: {
    title: 'Adaptive AI Controller Core',
    subtitle: 'Priority pressure heuristics, safety clearance matrices & decision rationale',
  },
  pedestrian_management: {
    title: 'Pedestrian Demand & Crosswalks',
    subtitle: 'Walk phases, clearance intervals & accessibility compliance',
  },
  traffic_analytics: {
    title: 'Traffic Analytics & Comparative Benchmark',
    subtitle: 'Empirical comparison: FlowSync AI vs Fixed-Time signal timings',
  },
  tinyfish_intelligence: {
    title: 'TinyFish Web Agent Intelligence',
    subtitle: 'Autonomous semantic extraction of municipal advisories, road closures & incidents',
  },
  scenario_simulator: {
    title: 'Scenario Testing Lab',
    subtitle: 'Stress test edge cases: rush hour commuter surges, lane closures & EMS preemption',
  },
  settings: {
    title: 'System & Timing Configurations',
    subtitle: 'NEMA TS-2 phase intervals, minimum green limits & API secrets',
  },
};

export const TopNavbar: React.FC<Props> = ({
  activeTab,
  state,
  backendOnline = false,
  onControlSimulation,
  onOpenDemoInfo,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = TAB_TITLES[activeTab];

  return (
    <header className="h-16 bg-navy-900/90 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md z-20 shrink-0">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>FlowSync AI</span>
          <span>/</span>
          <span className="text-cyan-400 capitalize">{activeTab.replace('_', ' ')}</span>
        </div>
        <h1 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
          <span>{meta.title}</span>
        </h1>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center space-x-4">
        {/* Live Date & Time HUD */}
        <div className="hidden lg:flex items-center space-x-2.5 bg-navy-950/80 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">{currentDate}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-100 font-semibold">{currentTime}</span>
        </div>

        {/* Simulation Control Deck */}
        <div className="flex items-center bg-navy-950/90 border border-slate-800 rounded-xl p-1 space-x-1 shadow-inner">
          {/* Play/Pause Toggle */}
          <button
            onClick={() => onControlSimulation(state.simulation_running ? 'pause' : 'play')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              state.simulation_running
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
            }`}
            title={state.simulation_running ? 'Pause Simulation' : 'Run Simulation'}
          >
            {state.simulation_running ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={() => onControlSimulation('reset')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-0.5 border-l border-slate-800 pl-1">
            {[1.0, 2.0, 5.0].map((spd) => (
              <button
                key={spd}
                onClick={() => onControlSimulation(undefined, spd)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition ${
                  state.simulation_speed === spd
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Engine Status Chip */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border backdrop-blur-md">
          {backendOnline ? (
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>FastAPI Cloud</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>In-Browser Sim</span>
            </span>
          )}
        </div>

        {/* Demo Mode Indicator Button */}
        <button
          onClick={onOpenDemoInfo}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-950/80 to-navy-900 border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-mono font-medium hover:border-cyan-400 transition shadow-glow-cyan"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Hackathon Demo Mode</span>
        </button>

        {/* Notifications Icon with active alerts badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-navy-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition relative"
            title="System Event Logs"
          >
            <Bell className="w-4 h-4" />
            {state.active_incident_count > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-xs text-white">Live System Events</span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {state.decision_history.length} logged
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2.5 py-2">
                {state.emergency_vehicle_active && (
                  <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-300">Code 3 EMS Preemption</div>
                      <div className="text-slate-300 text-[11px]">
                        Ambulance approaching on {state.emergency_approach?.toUpperCase()} corridor.
                      </div>
                    </div>
                  </div>
                )}
                {state.decision_history.slice(0, 4).map((dec) => (
                  <div
                    key={dec.id}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400 text-[11px]">
                        {dec.phase_chosen.replace('_', ' ')} ({dec.duration}s)
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{dec.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {dec.trigger_reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
