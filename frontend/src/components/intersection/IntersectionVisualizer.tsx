import React from 'react';
import { IntersectionState, ApproachName } from '../../types/traffic';
import { AlertTriangle, User, ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Footprints } from 'lucide-react';

interface Props {
  state: IntersectionState;
  onPedestrianCall?: (approach: ApproachName) => void;
  onAddCar?: (approach: ApproachName) => void;
  compact?: boolean;
}

export const IntersectionVisualizer: React.FC<Props> = ({
  state,
  onPedestrianCall,
  onAddCar,
  compact = false,
}) => {
  const { approaches, signals, current_phase, phase_time_remaining, emergency_vehicle_active, emergency_approach } = state;

  const renderSignalHead = (direction: 'north' | 'south' | 'east' | 'west') => {
    const color = signals[direction];
    const isGreen = color === 'green';
    const isAmber = color === 'amber';
    const isRed = color === 'red';

    return (
      <div className="flex flex-col items-center bg-gray-950/95 border border-slate-700 rounded-lg p-1.5 shadow-2xl backdrop-blur-md z-30 ring-1 ring-black">
        {/* Signal Hoods & Lenses */}
        <div className="flex space-x-1.5 mb-1.5 bg-black/60 p-1 rounded-md border border-slate-800">
          {/* Red */}
          <div className="relative">
            <div className="w-4 h-1 bg-slate-800 rounded-t-sm -mb-0.5 mx-auto" />
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                isRed ? 'bg-signal-red traffic-light-glow-red scale-110' : 'bg-red-950/30 border border-red-900/20'
              }`}
            />
          </div>
          {/* Amber */}
          <div className="relative">
            <div className="w-4 h-1 bg-slate-800 rounded-t-sm -mb-0.5 mx-auto" />
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                isAmber ? 'bg-signal-amber traffic-light-glow-amber scale-110' : 'bg-amber-950/30 border border-amber-900/20'
              }`}
            />
          </div>
          {/* Green */}
          <div className="relative">
            <div className="w-4 h-1 bg-slate-800 rounded-t-sm -mb-0.5 mx-auto" />
            <div
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                isGreen ? 'bg-signal-green traffic-light-glow-green scale-110' : 'bg-emerald-950/30 border border-emerald-900/20'
              }`}
            />
          </div>
        </div>
        {/* Countdown */}
        <div className="text-[10px] font-mono font-extrabold tracking-tight px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/80">
          <span className={isGreen ? 'text-emerald-400' : isAmber ? 'text-amber-400' : 'text-slate-400'}>
            {phase_time_remaining}s
          </span>
        </div>
      </div>
    );
  };

  const getQueueBadgeColor = (queue: number) => {
    if (queue > 20) return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (queue > 10) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  };

  // Check if NS or EW is actively green for animated moving vehicle in center
  const isNSGreen = signals.north === 'green';
  const isEWGreen = signals.east === 'green';

  return (
    <div
      className={`relative w-full rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-charcoal-900 border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center ${
        compact ? 'h-[380px]' : 'h-[560px]'
      }`}
    >
      {/* Background grid lines for HUD aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0c_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0c_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Emergency Corridor Banner if Active */}
      {emergency_vehicle_active && (
        <div className="absolute top-3 z-40 bg-red-600/95 border border-red-400 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center space-x-2 animate-bounce shadow-glow-red">
          <ShieldAlert className="w-4 h-4 text-white animate-spin" />
          <span>CODE 3 EMS CORRIDOR PREEMPTION ACTIVE — {emergency_approach?.toUpperCase()} PRIORITY</span>
        </div>
      )}

      {/* SVG ROAD NETWORK */}
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full max-w-[620px] max-h-[620px] select-none pointer-events-none"
      >
        {/* Corner Sidewalks / Plazas */}
        <rect x="0" y="0" width="220" height="220" fill="#0C1322" />
        <rect x="380" y="0" width="220" height="220" fill="#0C1322" />
        <rect x="0" y="380" width="220" height="220" fill="#0C1322" />
        <rect x="380" y="380" width="220" height="220" fill="#0C1322" />

        {/* Concrete Curbs */}
        <rect x="216" y="0" width="4" height="220" fill="#334155" />
        <rect x="380" y="0" width="4" height="220" fill="#334155" />
        <rect x="216" y="380" width="4" height="220" fill="#334155" />
        <rect x="380" y="380" width="4" height="220" fill="#334155" />
        <rect x="0" y="216" width="220" height="4" fill="#334155" />
        <rect x="0" y="380" width="220" height="4" fill="#334155" />
        <rect x="380" y="216" width="220" height="4" fill="#334155" />
        <rect x="380" y="380" width="220" height="4" fill="#334155" />

        {/* North-South Asphalt Roadway */}
        <rect x="220" y="0" width="160" height="600" fill="#151D2C" />

        {/* East-West Asphalt Roadway */}
        <rect x="0" y="220" width="600" height="160" fill="#151D2C" />

        {/* Center Intersection Box */}
        <rect x="220" y="220" width="160" height="160" fill="#172233" />

        {/* Yellow Double Center Lines (North & South) */}
        <line x1="298" y1="0" x2="298" y2="208" stroke="#EAB308" strokeWidth="2.5" />
        <line x1="302" y1="0" x2="302" y2="208" stroke="#EAB308" strokeWidth="2.5" />
        <line x1="298" y1="392" x2="298" y2="600" stroke="#EAB308" strokeWidth="2.5" />
        <line x1="302" y1="392" x2="302" y2="600" stroke="#EAB308" strokeWidth="2.5" />

        {/* Yellow Double Center Lines (East & West) */}
        <line x1="0" y1="298" x2="208" y2="298" stroke="#EAB308" strokeWidth="2.5" />
        <line x1="0" y1="302" x2="208" y2="302" stroke="#EAB308" strokeWidth="2.5" />
        <line x1="392" y1="298" x2="600" y2="298" stroke="#EAB308" strokeWidth="2.5" />
        <line x1="392" y1="302" x2="600" y2="302" stroke="#EAB308" strokeWidth="2.5" />

        {/* White Dashed Lane Dividers */}
        <line x1="260" y1="0" x2="260" y2="208" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />
        <line x1="340" y1="0" x2="340" y2="208" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />
        <line x1="260" y1="392" x2="260" y2="600" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />
        <line x1="340" y1="392" x2="340" y2="600" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />

        <line x1="0" y1="260" x2="208" y2="260" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />
        <line x1="0" y1="340" x2="208" y2="340" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />
        <line x1="392" y1="260" x2="600" y2="260" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />
        <line x1="392" y1="340" x2="600" y2="340" stroke="#64748B" strokeWidth="1.5" strokeDasharray="10 8" />

        {/* Solid White Stop Bars */}
        <line x1="220" y1="210" x2="298" y2="210" stroke="#F8FAFC" strokeWidth="4" />
        <line x1="302" y1="390" x2="380" y2="390" stroke="#F8FAFC" strokeWidth="4" />
        <line x1="210" y1="302" x2="210" y2="380" stroke="#F8FAFC" strokeWidth="4" />
        <line x1="390" y1="220" x2="390" y2="298" stroke="#F8FAFC" strokeWidth="4" />

        {/* Zebra Crosswalk Stripes (North) */}
        {[224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364].map((x) => (
          <rect key={`ped-n-${x}`} x={x} y="213" width="8" height="6" fill="#E2E8F0" opacity="0.9" />
        ))}
        {/* Zebra Crosswalk Stripes (South) */}
        {[224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364].map((x) => (
          <rect key={`ped-s-${x}`} x={x} y="381" width="8" height="6" fill="#E2E8F0" opacity="0.9" />
        ))}
        {/* Zebra Crosswalk Stripes (West) */}
        {[224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364].map((y) => (
          <rect key={`ped-w-${y}`} x="213" y={y} width="6" height="8" fill="#E2E8F0" opacity="0.9" />
        ))}
        {/* Zebra Crosswalk Stripes (East) */}
        {[224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364].map((y) => (
          <rect key={`ped-e-${y}`} x="381" y={y} width="6" height="8" fill="#E2E8F0" opacity="0.9" />
        ))}

        {/* VEHICLE QUEUES VISUALIZATION (Cars on roads) */}
        {/* North Approach (Heading South towards Stop Line) */}
        {Array.from({ length: Math.min(8, approaches.north.queue_length) }).map((_, i) => (
          <g key={`car-n-${i}`} transform={`translate(${i % 2 === 0 ? 240 : 272}, ${170 - i * 24})`}>
            {/* Detailed Car Body */}
            <rect width="24" height="34" rx="5" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.2" />
            <rect x="3" y="6" width="18" height="8" rx="2" fill="#0C4A6E" />
            <rect x="3" y="20" width="18" height="6" rx="1.5" fill="#0C4A6E" />
            {/* Headlights */}
            <circle cx="5" cy="32" r="2" fill="#FEF08A" />
            <circle cx="19" cy="32" r="2" fill="#FEF08A" />
            {/* Taillights */}
            <circle cx="5" cy="2" r="1.5" fill="#EF4444" />
            <circle cx="19" cy="2" r="1.5" fill="#EF4444" />
          </g>
        ))}

        {/* South Approach (Heading North towards Stop Line) */}
        {Array.from({ length: Math.min(8, approaches.south.queue_length) }).map((_, i) => (
          <g key={`car-s-${i}`} transform={`translate(${i % 2 === 0 ? 320 : 352}, ${398 + i * 24})`}>
            <rect width="24" height="34" rx="5" fill="#2563EB" stroke="#60A5FA" strokeWidth="1.2" />
            <rect x="3" y="20" width="18" height="8" rx="2" fill="#1E3A8A" />
            <rect x="3" y="8" width="18" height="6" rx="1.5" fill="#1E3A8A" />
            <circle cx="5" cy="2" r="2" fill="#FEF08A" />
            <circle cx="19" cy="2" r="2" fill="#FEF08A" />
            <circle cx="5" cy="32" r="1.5" fill="#EF4444" />
            <circle cx="19" cy="32" r="1.5" fill="#EF4444" />
          </g>
        ))}

        {/* East Approach (Heading West towards Stop Line) */}
        {Array.from({ length: Math.min(8, approaches.east.queue_length) }).map((_, i) => (
          <g key={`car-e-${i}`} transform={`translate(${398 + i * 26}, ${i % 2 === 0 ? 238 : 270})`}>
            {approaches.east.incident_blocked && i === 0 ? (
              <g>
                <rect width="34" height="24" rx="5" fill="#DC2626" stroke="#EF4444" strokeWidth="1.5" />
                <line x1="4" y1="4" x2="30" y2="20" stroke="#FEF08A" strokeWidth="2.5" strokeDasharray="3 3" />
              </g>
            ) : (
              <g>
                <rect width="34" height="24" rx="5" fill="#0D9488" stroke="#2DD4BF" strokeWidth="1.2" />
                <rect x="6" y="3" width="8" height="18" rx="2" fill="#134E4A" />
                <rect x="20" y="3" width="6" height="18" rx="1.5" fill="#134E4A" />
                <circle cx="2" cy="5" r="2" fill="#FEF08A" />
                <circle cx="2" cy="19" r="2" fill="#FEF08A" />
                <circle cx="32" cy="5" r="1.5" fill="#EF4444" />
                <circle cx="32" cy="19" r="1.5" fill="#EF4444" />
              </g>
            )}
          </g>
        ))}

        {/* West Approach (Heading East towards Stop Line) */}
        {Array.from({ length: Math.min(8, approaches.west.queue_length) }).map((_, i) => (
          <g key={`car-w-${i}`} transform={`translate(${168 - i * 26}, ${i % 2 === 0 ? 320 : 352})`}>
            {emergency_vehicle_active && i === 0 ? (
              // Emergency Ambulance with flashing strobes
              <g className="animate-pulse">
                <rect width="38" height="24" rx="4" fill="#F8FAFC" stroke="#DC2626" strokeWidth="2" />
                <rect x="15" y="2" width="8" height="20" fill="#DC2626" />
                <rect x="9" y="8" width="20" height="8" fill="#DC2626" />
                <circle cx="34" cy="5" r="3.5" fill="#3B82F6" className="animate-ping" />
                <circle cx="34" cy="19" r="3.5" fill="#EF4444" className="animate-ping" />
              </g>
            ) : (
              <g>
                <rect width="34" height="24" rx="5" fill="#7C3AED" stroke="#A78BFA" strokeWidth="1.2" />
                <rect x="20" y="3" width="8" height="18" rx="2" fill="#4C1D95" />
                <rect x="8" y="3" width="6" height="18" rx="1.5" fill="#4C1D95" />
                <circle cx="32" cy="5" r="2" fill="#FEF08A" />
                <circle cx="32" cy="19" r="2" fill="#FEF08A" />
                <circle cx="2" cy="5" r="1.5" fill="#EF4444" />
                <circle cx="2" cy="19" r="1.5" fill="#EF4444" />
              </g>
            )}
          </g>
        ))}

        {/* ANIMATED PASSING VEHICLES IN JUNCTION CENTER */}
        {isNSGreen && approaches.north.queue_length > 0 && (
          <g transform="translate(256, 275)">
            <rect width="24" height="34" rx="5" fill="#38BDF8" stroke="#F0F9FF" strokeWidth="1.5" />
            <circle cx="5" cy="32" r="2" fill="#FEF08A" />
            <circle cx="19" cy="32" r="2" fill="#FEF08A" />
          </g>
        )}
        {isEWGreen && approaches.east.queue_length > 0 && (
          <g transform="translate(285, 255)">
            <rect width="34" height="24" rx="5" fill="#2DD4BF" stroke="#F0FDF4" strokeWidth="1.5" />
            <circle cx="2" cy="5" r="2" fill="#FEF08A" />
            <circle cx="2" cy="19" r="2" fill="#FEF08A" />
          </g>
        )}

        {/* PEDESTRIANS AT CURBS */}
        {approaches.north.pedestrian_count > 0 && (
          <g transform="translate(202, 204)">
            <circle cx="6" cy="4" r="3" fill="#FBBF24" />
            <rect x="4" y="8" width="4" height="7" rx="1.5" fill="#FBBF24" />
          </g>
        )}
        {approaches.south.pedestrian_count > 0 && (
          <g transform="translate(388, 388)">
            <circle cx="6" cy="4" r="3" fill="#FBBF24" />
            <rect x="4" y="8" width="4" height="7" rx="1.5" fill="#FBBF24" />
          </g>
        )}
      </svg>

      {/* OVERLAY: SIGNAL HEADS (4 CORNERS OF JUNCTION) */}
      {/* North Signal Head */}
      <div className="absolute top-[28%] left-[27%] z-30 transform -translate-x-1/2 -translate-y-1/2">
        {renderSignalHead('north')}
      </div>

      {/* South Signal Head */}
      <div className="absolute top-[72%] left-[73%] z-30 transform -translate-x-1/2 -translate-y-1/2">
        {renderSignalHead('south')}
      </div>

      {/* East Signal Head */}
      <div className="absolute top-[28%] left-[73%] z-30 transform -translate-x-1/2 -translate-y-1/2">
        {renderSignalHead('east')}
      </div>

      {/* West Signal Head */}
      <div className="absolute top-[72%] left-[27%] z-30 transform -translate-x-1/2 -translate-y-1/2">
        {renderSignalHead('west')}
      </div>

      {/* APPROACH HUD CARDS */}
      {/* NORTH APPROACH CARD */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 z-20">
        <div className="bg-navy-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-slate-300 font-semibold">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>North Main</span>
          </div>
          <span className={`px-2 py-0.5 rounded font-mono font-bold border ${getQueueBadgeColor(approaches.north.queue_length)}`}>
            Queue: {approaches.north.queue_length}
          </span>
          <span className="text-slate-400 font-mono hidden sm:inline">
            {approaches.north.arrival_rate} v/m
          </span>
          {onAddCar && (
            <button
              onClick={() => onAddCar('north')}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700 transition"
              title="Add vehicle to North queue"
            >
              +1 Car
            </button>
          )}
        </div>
      </div>

      {/* SOUTH APPROACH CARD */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 z-20">
        <div className="bg-navy-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-slate-300 font-semibold">
            <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>South Main</span>
          </div>
          <span className={`px-2 py-0.5 rounded font-mono font-bold border ${getQueueBadgeColor(approaches.south.queue_length)}`}>
            Queue: {approaches.south.queue_length}
          </span>
          <span className="text-slate-400 font-mono hidden sm:inline">
            {approaches.south.arrival_rate} v/m
          </span>
          {onAddCar && (
            <button
              onClick={() => onAddCar('south')}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700 transition"
              title="Add vehicle to South queue"
            >
              +1 Car
            </button>
          )}
        </div>
      </div>

      {/* EAST APPROACH CARD */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 z-20">
        <div className="bg-navy-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md flex flex-col space-y-1 text-xs max-w-[130px]">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span className="truncate">East Grand</span>
            <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`px-1.5 py-0.5 rounded font-mono font-bold border text-[11px] ${getQueueBadgeColor(approaches.east.queue_length)}`}>
              Q: {approaches.east.queue_length}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {approaches.east.arrival_rate}v/m
            </span>
          </div>
          {approaches.east.incident_blocked && (
            <div className="flex items-center space-x-1 text-[10px] text-amber-400 font-semibold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Lane Restricted</span>
            </div>
          )}
          {onAddCar && (
            <button
              onClick={() => onAddCar('east')}
              className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700 transition"
            >
              +1 Car
            </button>
          )}
        </div>
      </div>

      {/* WEST APPROACH CARD */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1 z-20">
        <div className="bg-navy-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-md flex flex-col space-y-1 text-xs max-w-[130px]">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
            <span className="truncate">West Grand</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`px-1.5 py-0.5 rounded font-mono font-bold border text-[11px] ${getQueueBadgeColor(approaches.west.queue_length)}`}>
              Q: {approaches.west.queue_length}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {approaches.west.arrival_rate}v/m
            </span>
          </div>
          {onAddCar && (
            <button
              onClick={() => onAddCar('west')}
              className="bg-slate-800 hover:bg-slate-700 text-teal-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700 transition"
            >
              +1 Car
            </button>
          )}
        </div>
      </div>

      {/* PEDESTRIAN CALL BUTTONS & CROSSING INDICATORS */}
      {/* North-South Crosswalk Indicator */}
      <div className="absolute top-[20%] right-[20%] z-20">
        <div className="bg-navy-950/90 border border-slate-700 rounded-lg p-1.5 flex items-center space-x-1.5 text-[11px] shadow-lg">
          <Footprints className={`w-3.5 h-3.5 ${approaches.north.pedestrian_count > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-slate-300">{approaches.north.pedestrian_count} peds</span>
          {onPedestrianCall && (
            <button
              onClick={() => onPedestrianCall('north')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] border border-amber-500/40 transition font-bold"
              title="Call NS Pedestrian Crossing"
            >
              Call
            </button>
          )}
        </div>
      </div>

      {/* East-West Crosswalk Indicator */}
      <div className="absolute bottom-[20%] left-[20%] z-20">
        <div className="bg-navy-950/90 border border-slate-700 rounded-lg p-1.5 flex items-center space-x-1.5 text-[11px] shadow-lg">
          <Footprints className={`w-3.5 h-3.5 ${approaches.east.pedestrian_count > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-slate-300">{approaches.east.pedestrian_count} peds</span>
          {onPedestrianCall && (
            <button
              onClick={() => onPedestrianCall('east')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-[10px] border border-amber-500/40 transition font-bold"
              title="Call EW Pedestrian Crossing"
            >
              Call
            </button>
          )}
        </div>
      </div>

      {/* CENTER HUD BADGE: CURRENT PHASE & COUNTDOWN */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="bg-navy-950/95 border border-cyan-500/50 rounded-2xl px-4 py-2 text-center shadow-glow-cyan backdrop-blur-md">
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
            {current_phase.replace('_', ' ')}
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {phase_time_remaining}s
          </div>
          <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
            {state.controller_mode} mode
          </div>
        </div>
      </div>
    </div>
  );
};
