import React from 'react';
import { X, Sparkles, CheckCircle2, Shield, Radio, Cpu, Fish, Database } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-navy-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                FlowSync AI — Hackathon Demonstration Guide
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                System Architecture, Live AI Controller & TinyFish Integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs leading-relaxed text-slate-300">
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/40">
            <h3 className="font-semibold text-cyan-300 flex items-center space-x-2 text-sm mb-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Adaptive Dynamic Pressure AI vs Fixed-Time Timing</span>
            </h3>
            <p>
              Traditional traffic lights operate on rigid, predetermined timing cycles (e.g. 45s Green regardless of whether cars are waiting). FlowSync AI calculates dynamic pressure across all 4 approaches ($Q \cdot w_q + W \cdot w_w + Ped \cdot w_p$) to eliminate wasted green time and dynamically prioritize queues before gridlock propagates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-navy-950/60 border border-slate-800">
              <h4 className="font-bold text-white flex items-center space-x-2 mb-1.5">
                <Fish className="w-4 h-4 text-teal-400" />
                <span>TinyFish Web Agent Integration</span>
              </h4>
              <p className="text-slate-400 text-[11px]">
                Connects to TinyFish Web Agent API to crawl and extract public DOT advisories, emergency CAD feeds, and road closure bulletins. Runs in Sandbox Demo Mode with real-world verified alerts if API key is unconfigured.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-950/60 border border-slate-800">
              <h4 className="font-bold text-white flex items-center space-x-2 mb-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Safety & Clearance Interlocks</span>
              </h4>
              <p className="text-slate-400 text-[11px]">
                Enforces MUTCD / NEMA TS-2 compliant minimum green intervals (10s), yellow clearance (4s), all-red safety buffer (2s), and pedestrian clearance intervals (12s) to prevent vehicle conflicts.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Future Real-World Sensors & Integration Ready
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-navy-900 border border-slate-700/60 font-mono text-[11px] text-cyan-300">
                YOLOv8 & OpenCV
                <div className="text-[10px] text-slate-400">CCTV Detection</div>
              </div>
              <div className="p-2 rounded-xl bg-navy-900 border border-slate-700/60 font-mono text-[11px] text-teal-300">
                SUMO Micro-Sim
                <div className="text-[10px] text-slate-400">TraCI Python API</div>
              </div>
              <div className="p-2 rounded-xl bg-navy-900 border border-slate-700/60 font-mono text-[11px] text-indigo-300">
                NEMA TS-2 Controller
                <div className="text-[10px] text-slate-400">Field Telemetry</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            FlowSync AI — Intelligent Adaptive Traffic Signal System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs shadow-glow-cyan transition"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
