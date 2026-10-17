import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Footprints,
  Car,
  ShieldAlert,
  Radio,
  Sparkles,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import { IntersectionState, ApproachName } from '../types/traffic';
import { IntersectionVisualizer } from '../components/intersection/IntersectionVisualizer';
import { trafficApi } from '../services/api';

interface Props {
  state: IntersectionState;
  onControlSimulation: (action?: 'play' | 'pause' | 'reset' | 'step', speed?: number, mode?: any, manual_phase?: string) => void;
  onUpdateApproach: (name: ApproachName, updates: any) => void;
  onPedestrianCall: (approach: ApproachName) => void;
  onAddCar: (approach: ApproachName) => void;
}

export const LiveIntersectionPage: React.FC<Props> = ({
  state,
  onControlSimulation,
  onUpdateApproach,
  onPedestrianCall,
  onAddCar,
}) => {
  const { approaches, controller_mode, current_phase, phase_time_remaining, emergency_vehicle_active, ai_recommendation } = state;

  const handleQueueChange = (approach: ApproachName, val: number) => {
    onUpdateApproach(approach, { queue_length: val });
  };

  const handleArrivalRateChange = (approach: ApproachName, val: number) => {
    onUpdateApproach(approach, { arrival_rate: val });
  };

  const handlePedCountChange = (approach: ApproachName, val: number) => {
    onUpdateApproach(approach, { pedestrian_count: val, pedestrian_button_pressed: val > 0 });
  };

  const handleApplyPreset = async (scenarioId: string) => {
    await trafficApi.applyScenario(scenarioId);
    const st = await trafficApi.getState();
    if (st) {
      Object.keys(st.approaches).forEach((k) => {
        const appKey = k as ApproachName;
        onUpdateApproach(appKey, st.approaches[appKey]);
      });
    }
  };

  const toggleEmergencyVehicle = () => {
    if (emergency_vehicle_active) {
      onControlSimulation('reset');
    } else {
      onUpdateApproach('west', { queue_length: Math.max(14, approaches.west.queue_length) });
      onControlSimulation(undefined, undefined, undefined, 'WEST_PREEMPTION');
    }
  };

  const totalPedestrians =
    approaches.north.pedestrian_count +
    approaches.south.pedestrian_count +
    approaches.east.pedestrian_count +
    approaches.west.pedestrian_count;

  const avgPedWait = (
    (approaches.north.pedestrian_wait_time +
      approaches.south.pedestrian_wait_time +
      approaches.east.pedestrian_wait_time +
      approaches.west.pedestrian_wait_time) /
    4
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Scenario Presets Bar */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>Scenario Presets:</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'normal', label: 'Normal Traffic', color: 'hover:border-emerald-400' },
            { id: 'heavy_ns', label: 'Heavy North–South', color: 'hover:border-cyan-400' },
            { id: 'heavy_ew', label: 'Heavy East–West', color: 'hover:border-teal-400' },
            { id: 'rush_hour', label: 'Rush Hour Congestion', color: 'hover:border-indigo-400' },
            { id: 'high_pedestrian', label: 'High Pedestrian Demand', color: 'hover:border-amber-400' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition ${preset.color}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Control Banner */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          {/* Simulation Play / Pause / Reset */}
          <div className="flex items-center bg-navy-950 border border-slate-700/80 rounded-2xl p-1">
            <button
              onClick={() => onControlSimulation(state.simulation_running ? 'pause' : 'play')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                state.simulation_running
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {state.simulation_running ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{state.simulation_running ? 'Pause' : 'Start Simulation'}</span>
            </button>
            <button
              onClick={() => onControlSimulation('reset')}
              className="px-3.5 py-2 text-slate-400 hover:text-white transition rounded-xl text-xs flex items-center space-x-1"
              title="Reset simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Mode Selector: Fixed Timing vs Adaptive AI */}
          <div className="flex items-center bg-navy-950 border border-slate-700/80 rounded-2xl p-1 text-xs">
            <span className="text-slate-400 px-3 font-mono text-[11px] hidden sm:inline">Operating Mode:</span>
            {[
              { id: 'adaptive', label: 'Adaptive AI' },
              { id: 'fixed', label: 'Fixed Timing' },
              { id: 'manual', label: 'Manual' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onControlSimulation(undefined, undefined, m.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  controller_mode === m.id
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Vehicle Dispatch */}
        <div className="flex items-center space-x-2">
          {controller_mode === 'manual' && (
            <div className="flex items-center space-x-1 bg-navy-950 border border-slate-700 rounded-2xl p-1 text-xs">
              <span className="text-slate-400 px-2 font-mono text-[10px]">Command:</span>
              <button
                onClick={() => onControlSimulation(undefined, undefined, undefined, 'NS_GREEN')}
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-cyan-300 hover:bg-slate-700 text-xs font-semibold transition"
              >
                Force NS Green
              </button>
              <button
                onClick={() => onControlSimulation(undefined, undefined, undefined, 'EW_GREEN')}
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-teal-300 hover:bg-slate-700 text-xs font-semibold transition"
              >
                Force EW Green
              </button>
            </div>
          )}

          <button
            onClick={toggleEmergencyVehicle}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition border ${
              emergency_vehicle_active
                ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-glow-red'
                : 'bg-slate-800/80 hover:bg-red-950/60 text-red-300 border-red-500/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>{emergency_vehicle_active ? 'Disengage EMS Preemption' : 'Dispatch EMS Ambulance'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Dynamic AI Recommendation HUD Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-cyan-950/40 to-navy-900 border border-cyan-500/40 rounded-3xl p-5 shadow-glow-cyan/10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Adaptive Controller Feedback</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Confidence: {(ai_recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-sm font-semibold text-slate-300">Recommended Phase:</span>
              <span className="text-lg font-mono font-extrabold text-cyan-400">
                {ai_recommendation.recommended_phase.replace('_', ' ')}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-sm font-semibold text-slate-300">Optimal Green Duration:</span>
              <span className="text-lg font-mono font-extrabold text-emerald-400">
                {ai_recommendation.recommended_duration}s
              </span>
            </div>

            {/* Clear Explanation of Why the AI Selected That Phase */}
            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-navy-950/70 p-3 rounded-2xl border border-slate-800">
              <strong className="text-cyan-300">AI Selection Reason:</strong> {ai_recommendation.reason}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-950/90 border border-slate-700/80 text-right min-w-[210px] shrink-0">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Current Actuated Signal</div>
            <div className="text-lg font-mono font-extrabold text-white mt-0.5">
              {current_phase.replace('_', ' ')}
            </div>
            <div className="text-xs font-mono font-bold text-cyan-400 mt-1">
              Time Remaining: {phase_time_remaining}s
            </div>
          </div>
        </div>
      </div>

      {/* Visualizer & Interactive Sliders Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Visualizer (7 cols) */}
        <div className="xl:col-span-7 bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>4-Way Signalized Micro-Simulation</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-time lane queuing, signal heads, zebra crossings & pedestrian calls
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Total Queue: {state.total_queued} cars
              </span>
            </div>
          </div>

          <IntersectionVisualizer
            state={state}
            onPedestrianCall={onPedestrianCall}
            onAddCar={onAddCar}
            compact={false}
          />
        </div>

        {/* Right Column: Interactive Sliders (0–60 veh & Pedestrians) (5 cols) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Lane Vehicle & Pedestrian Demand Controls</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Drag any slider to directly set vehicle counts (<strong>0–60</strong>) or waiting pedestrians. The AI controller immediately recalculates priority demand in real-time.
            </p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {/* 4 VEHICLE APPROACH SLIDERS (0-60) */}
              {(['north', 'south', 'east', 'west'] as ApproachName[]).map((appKey) => {
                const app = approaches[appKey];
                const Icon =
                  appKey === 'north' ? ArrowDown :
                  appKey === 'south' ? ArrowUp :
                  appKey === 'east' ? ArrowLeft : ArrowRight;

                const isNS = appKey === 'north' || appKey === 'south';

                return (
                  <div
                    key={appKey}
                    className="p-3.5 rounded-2xl bg-navy-950/80 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${isNS ? 'text-cyan-400' : 'text-teal-400'}`} />
                        <span className="font-bold text-xs text-white capitalize">{app.label}</span>
                      </div>
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                        {app.queue_length} vehicles
                      </span>
                    </div>

                    {/* 0–60 Queue Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>Vehicle Queue (0–60)</span>
                        <span className="text-slate-200 font-bold">{app.queue_length} / 60</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={app.queue_length}
                        onChange={(e) => handleQueueChange(appKey, Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    {/* Arrival Rate */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span>Flow Rate: {app.arrival_rate} v/m</span>
                      <span>Avg Wait: {app.avg_wait_time.toFixed(1)}s</span>
                    </div>
                  </div>
                );
              })}

              {/* WAITING PEDESTRIAN SLIDERS (0-30) */}
              <div className="p-3.5 rounded-2xl bg-navy-950/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Footprints className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">Crosswalk Waiting Pedestrians</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Total: {totalPedestrians} peds
                  </span>
                </div>

                {/* North-South Pedestrians Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>North–South Crosswalk (0–30)</span>
                    <span className="text-amber-300 font-bold">{approaches.north.pedestrian_count} peds</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={approaches.north.pedestrian_count}
                    onChange={(e) => handlePedCountChange('north', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* East-West Pedestrians Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>East–West Crosswalk (0–30)</span>
                    <span className="text-amber-300 font-bold">{approaches.east.pedestrian_count} peds</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={approaches.east.pedestrian_count}
                    onChange={(e) => handlePedCountChange('east', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>Avg Ped Wait: {avgPedWait}s</span>
                  <button
                    onClick={() => onPedestrianCall('north')}
                    className="text-amber-300 hover:text-amber-200 underline text-[10px]"
                  >
                    Trigger Crossing Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
