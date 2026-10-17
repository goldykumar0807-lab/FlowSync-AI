import React from 'react';
import {
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  History,
  TrendingUp,
  Sliders,
  Scale,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { IntersectionState, ApproachName } from '../types/traffic';

interface Props {
  state: IntersectionState;
}

export const AdaptiveControllerPage: React.FC<Props> = ({ state }) => {
  const { approaches, current_phase, phase_time_remaining, ai_recommendation, decision_history } = state;

  const safetyChecks = [
    {
      title: 'Phase Conflict Interlock',
      desc: 'MUTCD Section 4D compliant: Zero concurrent vehicle green signals between opposing corridors (NS vs EW).',
      status: 'VERIFIED ACTIVE',
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
    {
      title: 'Minimum Green Constraint',
      desc: `Guarantees a minimum vehicle green of ${ai_recommendation.min_green}s before transition to prevent driver dilemma zones.`,
      status: `${ai_recommendation.min_green}s Min Bound`,
      icon: CheckCircle2,
      color: 'text-cyan-400',
    },
    {
      title: 'Maximum Green Termination',
      desc: `Limits continuous green extension to ${ai_recommendation.max_green}s to prevent starvation of competing queues.`,
      status: `${ai_recommendation.max_green}s Max Cap`,
      icon: CheckCircle2,
      color: 'text-cyan-400',
    },
    {
      title: 'Clearance & Dilemma Zone Intervals',
      desc: `Enforces yellow clearance interval (${ai_recommendation.clearance_intervals.yellow}s) followed by all-red clearance (${ai_recommendation.clearance_intervals.all_red}s).`,
      status: `${ai_recommendation.clearance_intervals.yellow}s Y + ${ai_recommendation.clearance_intervals.all_red}s All-Red`,
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
    {
      title: 'Pedestrian Clearance Protection',
      desc: `Calculates dynamic walking interval (${ai_recommendation.clearance_intervals.ped_clearance}s flashing clearance) for crosswalk safety.`,
      status: `${ai_recommendation.clearance_intervals.ped_clearance}s Ped Interval`,
      icon: CheckCircle2,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Recommendation vs Actuation Distinction */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-navy-900 to-navy-900 border border-cyan-500/40 rounded-3xl p-5 shadow-glow-cyan/5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                Advisory vs Commanded Status
              </span>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {(ai_recommendation.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Selected Phase:</span>
              <span className="text-cyan-400 font-mono">{ai_recommendation.recommended_phase.replace('_', ' ')}</span>
              <span className="text-slate-400">| Recommended Green:</span>
              <span className="text-emerald-400 font-mono">{ai_recommendation.recommended_duration}s</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              <strong className="text-cyan-300">Operational Guarantee:</strong> AI recommendations undergo deterministic NEMA TS-2 safety interlock validation before being actuated to physical signal heads.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-950/80 border border-slate-700/80 text-right min-w-[200px]">
            <div className="text-[11px] text-slate-400 font-mono">Actuated Signal Phase</div>
            <div className="text-base font-mono font-extrabold text-emerald-400">
              {current_phase.replace('_', ' ')} ({phase_time_remaining}s left)
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Status: Actuated & Safe
            </div>
          </div>
        </div>
      </div>

      {/* Demand Matrix by Approach */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <span>Multi-Approach Real-Time Traffic Demand Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Live input parameters fed into dynamic pressure heuristic equation
            </p>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-xl border border-cyan-800/40">
            Formula: Score = 1.6×Q + 0.85×W + 2.4×Ped
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['north', 'south', 'east', 'west'] as ApproachName[]).map((appKey) => {
            const app = approaches[appKey];
            const isNS = appKey === 'north' || appKey === 'south';
            return (
              <div
                key={appKey}
                className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="font-bold text-sm text-white capitalize">{app.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isNS ? 'bg-cyan-500/20 text-cyan-300' : 'bg-teal-500/20 text-teal-300'
                  }`}>
                    {isNS ? 'NS Corridor' : 'EW Arterial'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Queue Length</span>
                    <span className="text-white font-bold text-sm">{app.queue_length} veh</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Avg Delay</span>
                    <span className="text-teal-400 font-bold text-sm">{app.avg_wait_time.toFixed(1)}s</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Arrival Flow</span>
                    <span className="text-cyan-400 font-bold text-sm">{app.arrival_rate} v/m</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Pedestrians</span>
                    <span className="text-amber-400 font-bold text-sm">{app.pedestrian_count}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                  <span>Pedestrian Call Button:</span>
                  <span className={`font-mono font-bold ${app.pedestrian_button_pressed ? 'text-amber-400' : 'text-slate-500'}`}>
                    {app.pedestrian_button_pressed ? 'CALL REGISTERED' : 'IDLE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Constraints & Clearance Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Safety Interlocks & Constraints</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            AI recommendations are bounded by hard deterministic timing and safety rules.
          </p>

          <div className="space-y-3">
            {safetyChecks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800 flex items-start space-x-3"
                >
                  <Icon className={`w-4 h-4 ${item.color} mt-0.5 shrink-0`} />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{item.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Decision Logs */}
        <div className="lg:col-span-6 bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Auditable Decision History Log</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {decision_history.length} state transitions
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Transparent log recording every heuristic trigger and dynamic timing allocation.
            </p>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {decision_history.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="font-bold text-cyan-400">{log.phase_chosen.replace('_', ' ')}</span>
                      <span className="text-emerald-400 font-semibold">{log.duration}s</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-sans">{log.trigger_reason}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Queues: NS {log.queue_ns} | EW {log.queue_ew}</span>
                    <span>Scores: NS {log.priority_scores.ns} | EW {log.priority_scores.ew}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
