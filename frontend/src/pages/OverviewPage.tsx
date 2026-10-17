import React from 'react';
import {
  Car,
  Clock,
  TrendingDown,
  Users,
  Radio,
  Timer,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { IntersectionState, TrafficMetricPoint, AnalyticsSummary, ApproachName } from '../types/traffic';
import { IntersectionVisualizer } from '../components/intersection/IntersectionVisualizer';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  state: IntersectionState;
  analytics: { history: TrafficMetricPoint[]; summary: AnalyticsSummary };
  onNavigate: (tab: any) => void;
  onPedestrianCall: (approach: ApproachName) => void;
  onAddCar: (approach: ApproachName) => void;
}

export const OverviewPage: React.FC<Props> = ({
  state,
  analytics,
  onNavigate,
  onPedestrianCall,
  onAddCar,
}) => {
  const { approaches, current_phase, phase_time_remaining, ai_recommendation } = state;
  const { summary, history } = analytics;

  const kpis = [
    {
      title: 'Total Queued Vehicles',
      value: state.total_queued,
      unit: 'cars',
      subtitle: 'Across all 4 approaches',
      icon: Car,
      color: 'text-cyan-400',
      bgGlow: 'shadow-glow-cyan',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Avg Vehicle Wait Time',
      value: `${state.avg_wait_time.toFixed(1)}s`,
      unit: '',
      subtitle: `-${summary.wait_reduction_percent}% vs fixed time`,
      icon: Clock,
      color: 'text-teal-400',
      bgGlow: 'shadow-glow-teal',
      borderColor: 'border-teal-500/30',
    },
    {
      title: 'Maximum Queue Length',
      value: state.max_queue,
      unit: 'cars',
      subtitle: 'Congestion peak approach',
      icon: TrendingDown,
      color: 'text-indigo-400',
      bgGlow: 'shadow-glow-cyan',
      borderColor: 'border-indigo-500/30',
    },
    {
      title: 'Pedestrians Waiting',
      value: state.total_pedestrians_waiting,
      unit: 'people',
      subtitle: 'Crosswalk clearance active',
      icon: Users,
      color: 'text-amber-400',
      bgGlow: 'shadow-glow-amber',
      borderColor: 'border-amber-500/30',
    },
    {
      title: 'Active Signal Phase',
      value: current_phase.replace('_', ' '),
      unit: '',
      subtitle: `${phase_time_remaining}s remaining in phase`,
      icon: Radio,
      color: 'text-emerald-400',
      bgGlow: 'shadow-glow-green',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'AI Recommended Green',
      value: `${ai_recommendation.recommended_duration}s`,
      unit: '',
      subtitle: `${(ai_recommendation.confidence * 100).toFixed(0)}% optimization confidence`,
      icon: Timer,
      color: 'text-purple-400',
      bgGlow: 'shadow-glow-cyan',
      borderColor: 'border-purple-500/30',
    },
  ];

  const approachesList: ApproachName[] = ['north', 'south', 'east', 'west'];

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-navy-900/90 border ${kpi.borderColor} rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 leading-tight">
                  {kpi.title}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <div className="text-xl font-mono font-extrabold text-white tracking-tight flex items-baseline space-x-1">
                  <span>{kpi.value}</span>
                  {kpi.unit && <span className="text-xs text-slate-400 font-normal">{kpi.unit}</span>}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                  {kpi.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Visualizer + AI Reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Intersection Live View (7 cols) */}
        <div className="lg:col-span-7 bg-navy-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Live Intersection Telemetry</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time 4-way micro-simulation with lane queues & signals
              </p>
            </div>
            <button
              onClick={() => onNavigate('live_intersection')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/40 transition"
            >
              <span>Full View & Controls</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <IntersectionVisualizer
            state={state}
            onPedestrianCall={onPedestrianCall}
            onAddCar={onAddCar}
            compact={true}
          />

          {/* 4 Approach Queue Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {approachesList.map((appKey) => {
              const app = approaches[appKey];
              const pct = Math.min(100, (app.queue_length / 25) * 100);
              return (
                <div
                  key={appKey}
                  className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-300 uppercase font-mono text-[11px]">
                      {appKey}
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{app.queue_length} veh</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        app.queue_length > 15
                          ? 'bg-red-500'
                          : app.queue_length > 8
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>{app.arrival_rate} v/m</span>
                    <span>{app.avg_wait_time.toFixed(0)}s wait</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Decision Explanation & Real-Time Performance (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Decision Explanation Card */}
          <div className="bg-navy-900/90 border border-cyan-500/30 rounded-3xl p-5 shadow-glow-cyan/5 relative overflow-hidden">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Dynamic Pressure Optimization</span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Phase Decision: {ai_recommendation.recommended_phase.replace('_', ' ')} (
              {ai_recommendation.recommended_duration}s)
            </h3>
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-slate-200 leading-relaxed font-sans mb-3">
              {ai_recommendation.reason}
            </div>

            {/* Score Comparison Bars */}
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">North-South Pressure Score</span>
                  <span className="text-cyan-400 font-bold">
                    {ai_recommendation.scores.ns_score.toFixed(1)} pts
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (ai_recommendation.scores.ns_score /
                          Math.max(
                            1,
                            ai_recommendation.scores.ns_score + ai_recommendation.scores.ew_score
                          )) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">East-West Pressure Score</span>
                  <span className="text-teal-400 font-bold">
                    {ai_recommendation.scores.ew_score.toFixed(1)} pts
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (ai_recommendation.scores.ew_score /
                          Math.max(
                            1,
                            ai_recommendation.scores.ns_score + ai_recommendation.scores.ew_score
                          )) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NEMA TS-2 Min/Max Safe</span>
              </span>
              <button
                onClick={() => onNavigate('adaptive_controller')}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Inspect Heuristics &rarr;
              </button>
            </div>
          </div>

          {/* Fixed-Time vs Adaptive Real-Time Comparison */}
          <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-teal-400" />
                <span>Adaptive vs Fixed-Time Benchmark</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                +{summary.wait_reduction_percent}% Efficiency
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] text-slate-400">Avg Delay / Vehicle</div>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {summary.avg_wait_adaptive}s
                </div>
                <div className="text-[10px] text-slate-400 line-through">
                  Fixed: {summary.avg_wait_fixed}s
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] text-slate-400">Throughput Output</div>
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {summary.throughput_adaptive} veh
                </div>
                <div className="text-[10px] text-slate-400 line-through">
                  Fixed: {summary.throughput_fixed} veh
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-navy-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">CO2 Emissions Avoided</span>
              <span className="text-emerald-400 font-bold">{summary.total_co2_saved_kg} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Traffic Congestion Chart */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Approach Queue Dynamics</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Simulated queue dissipation & accumulation curve (vehicles)
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>North-South Queue</span>
            </span>
            <span className="flex items-center space-x-1.5 text-teal-400">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span>East-West Queue</span>
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorEw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#F8FAFC',
                }}
              />
              <Area
                type="monotone"
                dataKey="queue_ns"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNs)"
                name="North-South Queue"
              />
              <Area
                type="monotone"
                dataKey="queue_ew"
                stroke="#14B8A6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEw)"
                name="East-West Queue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
