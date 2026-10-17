import React, { useState } from 'react';
import {
  Footprints,
  User,
  ShieldCheck,
  Clock,
  HeartHandshake,
  School,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { IntersectionState, ApproachName } from '../types/traffic';

interface Props {
  state: IntersectionState;
  onPedestrianCall: (approach: ApproachName) => void;
  onUpdateApproach: (name: ApproachName, updates: any) => void;
}

export const PedestrianManagementPage: React.FC<Props> = ({
  state,
  onPedestrianCall,
  onUpdateApproach,
}) => {
  const { approaches, signals } = state;
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [schoolZoneMode, setSchoolZoneMode] = useState(false);

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

  const handleAccessibilityToggle = () => {
    setAccessibilityMode(!accessibilityMode);
  };

  const handleSchoolZoneToggle = () => {
    const next = !schoolZoneMode;
    setSchoolZoneMode(next);
    if (next) {
      // Simulate surge of kids crossing
      onUpdateApproach('north', { pedestrian_count: 12, pedestrian_button_pressed: true });
      onUpdateApproach('south', { pedestrian_count: 14, pedestrian_button_pressed: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900/90 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Pedestrians Waiting</span>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
              {totalPedestrians} people
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Curb queues active</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Footprints className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Average Pedestrian Delay</span>
            <div className="text-2xl font-mono font-extrabold text-cyan-400 mt-1">
              {avgPedWait}s
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Target: &lt;30s</span>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">School Zone Mode</span>
            <div className="text-sm font-bold text-white mt-1">
              {schoolZoneMode ? 'Active (+8s buffer)' : 'Standard Operation'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Extended clearance</span>
          </div>
          <button
            onClick={handleSchoolZoneToggle}
            className={`p-2.5 rounded-xl border transition ${
              schoolZoneMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-amber'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <School className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">ADA Accessibility Walk</span>
            <div className="text-sm font-bold text-white mt-1">
              {accessibilityMode ? 'Elderly / ADA Enabled' : 'Normal Walk Pace'}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">3.0 ft/s safety timing</span>
          </div>
          <button
            onClick={handleAccessibilityToggle}
            className={`p-2.5 rounded-xl border transition ${
              accessibilityMode
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <HeartHandshake className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Crosswalk Controls & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* North-South Crosswalk Deck */}
        <div className="p-5 rounded-3xl bg-navy-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Footprints className="w-4 h-4 text-cyan-400" />
                <span>North–South Crosswalk (Across Grand Ave)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Corridor width: 64 ft | Speed: 3.5 ft/sec</p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                  signals.pedestrian_ns === 'walk'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : signals.pedestrian_ns === 'flashing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {signals.pedestrian_ns.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">North Curb Queue</span>
              <div className="text-lg font-bold text-white mt-1">{approaches.north.pedestrian_count}</div>
              <span className="text-slate-500 text-[10px]">{approaches.north.pedestrian_wait_time.toFixed(0)}s wait</span>
            </div>

            <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">South Curb Queue</span>
              <div className="text-lg font-bold text-white mt-1">{approaches.south.pedestrian_count}</div>
              <span className="text-slate-500 text-[10px]">{approaches.south.pedestrian_wait_time.toFixed(0)}s wait</span>
            </div>

            <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Call Button State</span>
              <div
                className={`text-xs font-bold mt-2 uppercase ${
                  approaches.north.pedestrian_button_pressed || approaches.south.pedestrian_button_pressed
                    ? 'text-amber-400 animate-pulse'
                    : 'text-slate-400'
                }`}
              >
                {approaches.north.pedestrian_button_pressed || approaches.south.pedestrian_button_pressed
                  ? 'Request Armed'
                  : 'Idle'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => onPedestrianCall('north')}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition shadow-glow-amber flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Press Pedestrian Push-Button (North Curb)</span>
            </button>
            <button
              onClick={() => onPedestrianCall('south')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
            >
              South Curb Call
            </button>
          </div>
        </div>

        {/* East-West Crosswalk Deck */}
        <div className="p-5 rounded-3xl bg-navy-900/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Footprints className="w-4 h-4 text-teal-400" />
                <span>East–West Crosswalk (Across Main Blvd)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Corridor width: 68 ft | Speed: 3.5 ft/sec</p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                  signals.pedestrian_ew === 'walk'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : signals.pedestrian_ew === 'flashing'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {signals.pedestrian_ew.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">East Curb Queue</span>
              <div className="text-lg font-bold text-white mt-1">{approaches.east.pedestrian_count}</div>
              <span className="text-slate-500 text-[10px]">{approaches.east.pedestrian_wait_time.toFixed(0)}s wait</span>
            </div>

            <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">West Curb Queue</span>
              <div className="text-lg font-bold text-white mt-1">{approaches.west.pedestrian_count}</div>
              <span className="text-slate-500 text-[10px]">{approaches.west.pedestrian_wait_time.toFixed(0)}s wait</span>
            </div>

            <div className="p-3 rounded-2xl bg-navy-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px]">Call Button State</span>
              <div
                className={`text-xs font-bold mt-2 uppercase ${
                  approaches.east.pedestrian_button_pressed || approaches.west.pedestrian_button_pressed
                    ? 'text-amber-400 animate-pulse'
                    : 'text-slate-400'
                }`}
              >
                {approaches.east.pedestrian_button_pressed || approaches.west.pedestrian_button_pressed
                  ? 'Request Armed'
                  : 'Idle'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => onPedestrianCall('east')}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-teal-600/20 hover:from-teal-500/30 hover:to-teal-600/30 text-teal-300 font-bold text-xs border border-teal-500/40 transition shadow-glow-teal flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Press Pedestrian Push-Button (East Curb)</span>
            </button>
            <button
              onClick={() => onPedestrianCall('west')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
            >
              West Curb Call
            </button>
          </div>
        </div>
      </div>

      {/* Pedestrian vs Vehicle Signal Conflict Interlock Matrix */}
      <div className="p-5 rounded-3xl bg-navy-900/90 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>MUTCD Pedestrian vs Vehicle Safety Interlock Matrix</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Visual verification that vehicle movements in conflict with active pedestrian crosswalk intervals are strictly prohibited with all-red interlocks.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="p-3">Signal State</th>
                <th className="p-3">North Vehicle</th>
                <th className="p-3">South Vehicle</th>
                <th className="p-3">East Vehicle</th>
                <th className="p-3">West Vehicle</th>
                <th className="p-3">NS Ped Crosswalk</th>
                <th className="p-3">EW Ped Crosswalk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-bold text-cyan-400">NS Phase Active</td>
                <td className="p-3 text-emerald-400 font-semibold">GREEN</td>
                <td className="p-3 text-emerald-400 font-semibold">GREEN</td>
                <td className="p-3 text-red-400">RED</td>
                <td className="p-3 text-red-400">RED</td>
                <td className="p-3 text-emerald-400 font-semibold">WALK (Parallel)</td>
                <td className="p-3 text-red-400">DON'T WALK (Suppressed)</td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-bold text-teal-400">EW Phase Active</td>
                <td className="p-3 text-red-400">RED</td>
                <td className="p-3 text-red-400">RED</td>
                <td className="p-3 text-emerald-400 font-semibold">GREEN</td>
                <td className="p-3 text-emerald-400 font-semibold">GREEN</td>
                <td className="p-3 text-red-400">DON'T WALK (Suppressed)</td>
                <td className="p-3 text-emerald-400 font-semibold">WALK (Parallel)</td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="p-3 font-bold text-amber-400">Ped Exclusive / Clearance</td>
                <td className="p-3 text-red-400">RED HOLD</td>
                <td className="p-3 text-red-400">RED HOLD</td>
                <td className="p-3 text-red-400">RED HOLD</td>
                <td className="p-3 text-red-400">RED HOLD</td>
                <td className="p-3 text-amber-400 font-semibold">FLASHING DON'T WALK</td>
                <td className="p-3 text-amber-400 font-semibold">FLASHING DON'T WALK</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
