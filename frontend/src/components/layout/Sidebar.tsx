import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Cpu,
  Footprints,
  BarChart3,
  Fish,
  SlidersHorizontal,
  Settings,
  Activity,
  Zap,
} from 'lucide-react';
import { IntersectionState } from '../../types/traffic';

export type NavTab =
  | 'overview'
  | 'live_intersection'
  | 'adaptive_controller'
  | 'pedestrian_management'
  | 'traffic_analytics'
  | 'tinyfish_intelligence'
  | 'scenario_simulator'
  | 'settings';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  state: IntersectionState;
  backendOnline: boolean;
  onOpenDemoInfo: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  state,
  backendOnline,
  onOpenDemoInfo,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<any>; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live_intersection', label: 'Live Intersection', icon: Radio },
    { id: 'adaptive_controller', label: 'Adaptive AI Controller', icon: Cpu, badge: 'AI' },
    { id: 'pedestrian_management', label: 'Pedestrian Management', icon: Footprints },
    { id: 'traffic_analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'tinyfish_intelligence', label: 'TinyFish Intelligence', icon: Fish, badge: 'Agent' },
    { id: 'scenario_simulator', label: 'Scenario Simulator', icon: SlidersHorizontal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-slate-800/80 flex flex-col justify-between select-none z-30 shrink-0">
      {/* Top Header / Logo */}
      <div>
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-0.5 shadow-glow-cyan">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            {state.simulation_running && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-navy-900 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                FlowSync
              </span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">
              Smart Signal Ops v1.0
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="px-4 py-3 bg-navy-950/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
            <span className="text-slate-300 font-mono text-[11px]">
              {backendOnline ? 'FastAPI Connected' : 'Client Simulator'}
            </span>
          </div>
          <button
            onClick={onOpenDemoInfo}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 transition"
          >
            Demo Info
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-teal-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer: Simulation Summary */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-950/40 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 text-[11px]">Controller Mode</span>
          <span className="px-2 py-0.5 rounded font-mono font-semibold text-[11px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 uppercase">
            {state.controller_mode}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
          <span>Sim Elapsed</span>
          <span className="text-slate-200 font-bold">{state.simulation_time_sec}s</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mt-1">
          <span>Sim Speed</span>
          <span className="text-cyan-400 font-bold">{state.simulation_speed}x</span>
        </div>
      </div>
    </aside>
  );
};
