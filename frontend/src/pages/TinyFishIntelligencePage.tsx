import React, { useState, useEffect } from 'react';
import {
  Fish,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info,
  Flame,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
} from 'lucide-react';
import { TinyFishAdvisory, TinyFishStatus } from '../types/traffic';
import { trafficApi } from '../services/api';

interface Props {
  onAdvisoryInjected?: () => void;
}

export const TinyFishIntelligencePage: React.FC<Props> = ({ onAdvisoryInjected }) => {
  const [advisories, setAdvisories] = useState<TinyFishAdvisory[]>([]);
  const [status, setStatus] = useState<TinyFishStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [injectedIds, setInjectedIds] = useState<Set<string>>(new Set());

  const loadAdvisories = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const stat = await trafficApi.getTinyFishStatus();
      setStatus(stat);

      const res = await trafficApi.getTinyFishAdvisories();
      if (res.success) {
        setAdvisories(res.advisories);
        setLastRefreshed(res.last_refreshed || new Date().toLocaleTimeString());
      } else {
        setErrorMsg('Unable to retrieve advisories from web agent service.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network communication error with TinyFish agent endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, []);

  const handleToggleInjection = async (adv: TinyFishAdvisory) => {
    const isCurrentlyInjected = injectedIds.has(adv.id);
    const nextState = !isCurrentlyInjected;

    try {
      await trafficApi.toggleIncidentImpact(adv.id, nextState);
      const nextSet = new Set(injectedIds);
      if (nextState) {
        nextSet.add(adv.id);
      } else {
        nextSet.delete(adv.id);
      }
      setInjectedIds(nextSet);
      if (onAdvisoryInjected) onAdvisoryInjected();
    } catch (e) {
      // ignore
    }
  };

  const filteredAdvisories = advisories.filter((a) => {
    if (categoryFilter === 'all') return true;
    return a.category === categoryFilter;
  });

  const getSeverityBadge = (sev: string) => {
    if (sev === 'critical') return 'bg-red-500/20 text-red-300 border-red-500/40';
    if (sev === 'high') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (sev === 'moderate') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    return 'bg-slate-700/60 text-slate-300 border-slate-600';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Web Agent Connection Card */}
      <div className="bg-gradient-to-r from-teal-950/60 via-navy-900 to-navy-900 border border-teal-500/30 rounded-3xl p-5 shadow-glow-teal/5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase flex items-center space-x-1">
                <Fish className="w-3.5 h-3.5" />
                <span>TinyFish Web Agent Engine</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {status?.is_demo_mode ? 'Sandbox Demo Mode (Verified Datasets)' : 'Live Agent API Active'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Autonomous Public Traffic Advisory & Incident Extraction
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              TinyFish navigates public Department of Transportation (DOT) portals, highway patrol CAD dispatch logs, and municipal road closure bulletins to dynamically extract structured incidents and adjust intersection capacity.
            </p>
          </div>

          <button
            onClick={loadAdvisories}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-glow-teal transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Crawling Advisories...' : 'Fetch Latest Advisories'}</span>
          </button>
        </div>

        {/* Status Meta Info */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div>
            <span>Endpoint: </span>
            <span className="text-slate-200">{status?.api_endpoint || 'TinyFish Web Agent Sandbox'}</span>
          </div>
          <div>
            <span>Last Successful Refresh: </span>
            <span className="text-teal-400 font-bold">{lastRefreshed || 'Just now'}</span>
          </div>
          <div>
            <span>Active Simulation Injections: </span>
            <span className="text-amber-400 font-bold">{injectedIds.size}</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Educational Notice */}
      {status?.is_demo_mode && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 flex items-start space-x-3">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white font-semibold">Hackathon Transparency Notice:</strong>{' '}
            No TinyFish API key was detected in <code className="font-mono text-cyan-300">backend/.env</code>. FlowSync AI is operating in validated demo mode with authentic DOT traffic advisories. Add your <code className="font-mono text-cyan-300">TINYFISH_API_KEY</code> in settings to crawl arbitrary live domains.
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Category:</span>
          {[
            { id: 'all', label: 'All Feeds' },
            { id: 'closure', label: 'Road Closures' },
            { id: 'incident', label: 'Accidents / Stalls' },
            { id: 'advisory', label: 'Pedestrian / Special Events' },
            { id: 'weather', label: 'Weather Watches' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition ${
                categoryFilter === cat.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-glow-teal font-bold'
                  : 'bg-navy-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filteredAdvisories.length} records
        </span>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-xs text-red-200 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Advisories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAdvisories.map((adv) => {
          const isInjected = injectedIds.has(adv.id);
          return (
            <div
              key={adv.id}
              className={`p-5 rounded-3xl bg-navy-900/90 border transition-all duration-200 flex flex-col justify-between ${
                isInjected
                  ? 'border-amber-500/60 shadow-glow-amber/10 bg-gradient-to-br from-amber-950/20 via-navy-900 to-navy-900'
                  : 'border-slate-800 hover:border-slate-700 shadow-xl'
              }`}
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${getSeverityBadge(
                        adv.severity
                      )}`}
                    >
                      {adv.severity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {adv.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{adv.published_at}</span>
                  </span>
                </div>

                {/* Title & Location */}
                <div>
                  <h4 className="font-bold text-sm text-white leading-snug">{adv.title}</h4>
                  <div className="text-xs text-cyan-400 font-mono mt-1">
                    📍 {adv.location}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{adv.description}</p>
              </div>

              {/* Footer with Impact Injection & Source URL */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                {/* Clickable Source Link */}
                <a
                  href={adv.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center space-x-1 transition truncate max-w-[180px]"
                  title={`Source: ${adv.source_name}`}
                >
                  <span className="truncate">{adv.source_name}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 text-cyan-400" />
                </a>

                {/* Inject into Simulation Button */}
                <button
                  onClick={() => handleToggleInjection(adv)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isInjected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-amber'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                  title="Applies capacity restriction to intersection model"
                >
                  <Flame className={`w-3.5 h-3.5 ${isInjected ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{isInjected ? 'Impact Active (-45%)' : 'Inject Impact'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
