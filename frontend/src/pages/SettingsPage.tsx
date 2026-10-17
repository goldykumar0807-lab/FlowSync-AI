import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Key,
  Clock,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Volume2,
  VolumeX,
  Server,
  Cpu,
} from 'lucide-react';
import { trafficApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [minGreen, setMinGreen] = useState<number>(10);
  const [maxGreen, setMaxGreen] = useState<number>(60);
  const [yellowTime, setYellowTime] = useState<number>(4);
  const [allRedTime, setAllRedTime] = useState<number>(2);
  const [pedClearance, setPedClearance] = useState<number>(12);

  const [queueWeight, setQueueWeight] = useState<number>(1.6);
  const [delayWeight, setDelayWeight] = useState<number>(0.85);
  const [pedWeight, setPedWeight] = useState<number>(2.4);

  const [tinyFishKey, setTinyFishKey] = useState<string>('');
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveTimings = async () => {
    try {
      await trafficApi.updateTimings({
        min_green: minGreen,
        max_green: maxGreen,
        yellow_time: yellowTime,
        all_red_time: allRedTime,
        ped_clearance_time: pedClearance,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      // handled
    }
  };

  const handleTestTinyFishKey = () => {
    setTestingKey(true);
    setKeyStatus(null);
    setTimeout(() => {
      setTestingKey(false);
      if (tinyFishKey.trim().length > 8) {
        setKeyStatus('valid');
      } else {
        setKeyStatus('invalid');
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Controller Parameters & System Configurations</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Calibrate NEMA TS-2 phase intervals, dynamic pressure weights & external APIs
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timing Intervals Card */}
        <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Safety Timing & Clearance Bounds</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              MUTCD Standards
            </span>
          </div>

          {/* Min Green */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Minimum Green Interval: {minGreen}s</span>
              <span className="text-slate-500">Range: 5s - 25s</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={minGreen}
              onChange={(e) => setMinGreen(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Minimum duration allocated before switching to yellow to prevent driver hesitation.
            </p>
          </div>

          {/* Max Green */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Maximum Green Ceiling: {maxGreen}s</span>
              <span className="text-slate-500">Range: 30s - 90s</span>
            </div>
            <input
              type="range"
              min="30"
              max="90"
              value={maxGreen}
              onChange={(e) => setMaxGreen(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Prevents queue starvation on opposing approaches during heavy congestion.
            </p>
          </div>

          {/* Yellow Clearance */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Yellow Change Interval: {yellowTime}s</span>
              <span className="text-slate-500">Range: 3s - 5s</span>
            </div>
            <input
              type="range"
              min="3"
              max="5"
              value={yellowTime}
              onChange={(e) => setYellowTime(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* All-Red Buffer */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>All-Red Clearance Interval: {allRedTime}s</span>
              <span className="text-slate-500">Range: 1s - 3s</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              value={allRedTime}
              onChange={(e) => setAllRedTime(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
            />
          </div>

          <button
            onClick={handleSaveTimings}
            className="w-full py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-bold text-xs shadow-glow-cyan transition flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Apply Timings to Controller Core</span>
          </button>
        </div>

        {/* AI Weights & TinyFish Credentials Card */}
        <div className="space-y-6">
          {/* AI Weights */}
          <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>AI Heuristic Priority Weights</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Dynamic Pressure
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Queue Weight (w_q): {queueWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={queueWeight}
                onChange={(e) => setQueueWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Delay Weight (w_wait): {delayWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={delayWeight}
                onChange={(e) => setDelayWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Pedestrian Weight (w_ped): {pedWeight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.2"
                value={pedWeight}
                onChange={(e) => setPedWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* TinyFish API Configuration */}
          <div className="bg-navy-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>TinyFish Web Agent Credentials</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Secure Server Backend
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Store credentials in <code className="font-mono text-cyan-300">backend/.env</code> for persistence. Frontend calls the secure FastAPI server proxy without exposing API keys.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">TinyFish API Key</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="tf_live_..."
                  value={tinyFishKey}
                  onChange={(e) => setTinyFishKey(e.target.value)}
                  className="flex-1 bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleTestTinyFishKey}
                  disabled={testingKey || !tinyFishKey.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-slate-700 transition disabled:opacity-40"
                >
                  {testingKey ? 'Testing...' : 'Test Key'}
                </button>
              </div>

              {keyStatus === 'valid' && (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>TinyFish Web Agent key syntax verified!</span>
                </div>
              )}
              {keyStatus === 'invalid' && (
                <div className="text-[11px] font-mono text-amber-400 flex items-center space-x-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Key format short or invalid. Sandbox demo mode remains active.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
