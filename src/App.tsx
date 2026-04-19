/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CloudDownload, 
  Terminal, 
  Activity, 
  Cpu, 
  Database, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ActiveDownloads } from './components/ActiveDownloads';
import { FileManager } from './components/FileManager';
import { FileInfo, ActiveDownload, SystemStats } from './types';
import { formatBytes } from './utils';

export default function App() {
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownload[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data);
    } catch (err) {
      console.error('Failed to fetch files', err);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await axios.get('/api/downloads/active');
      setActiveDownloads(response.data);
    } catch (err) {
      console.error('Failed to fetch downloads', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchDownloads();
      fetchStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Sync files when a download completes
  useEffect(() => {
    if (activeDownloads.some(d => d.status === 'completed')) {
      fetchFiles();
    }
  }, [activeDownloads]);

  const handleDownloadInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/download', { url });
      setUrl('');
      fetchDownloads();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start download');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await axios.delete(`/api/files/${name}`);
      fetchFiles();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleLocalDownload = (name: string) => {
    window.open(`/api/files/download/${name}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-app-bg text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-[260px] bg-sidebar-bg border-r border-border-subtle flex flex-col p-6 shrink-0 z-50">
        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-transform">
            <CloudDownload size={18} />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">CloudVault</span>
        </div>

        <nav className="space-y-1 flex-1">
          <div className="px-3 py-2 bg-blue-600/10 text-blue-400 rounded-lg font-medium text-sm flex items-center gap-3 cursor-pointer">
            <Server size={14} />
            Dashboard
          </div>
          <div className="px-3 py-2 hover:bg-white/5 text-slate-400 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-3">
            <Activity size={14} />
            Active Transfers
          </div>
          <div className="px-3 py-2 hover:bg-white/5 text-slate-400 rounded-lg text-sm transition-colors cursor-pointer flex items-center gap-3">
            <Database size={14} />
            Archive Manager
          </div>
        </nav>

        {/* Node Status in Sidebar */}
        <div className="mt-auto p-4 glass-card bg-blue-900/10 border-blue-500/20">
          <div className="text-[10px] text-blue-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Node-01 Online
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-slate-400 flex justify-between mb-1 uppercase font-semibold">
                <span>CPU Load</span>
                <span className="text-white">{Math.round((stats?.cpu.loadAvg || 0) * 100)}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (stats?.cpu.loadAvg || 0) * 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 flex justify-between mb-1 uppercase font-semibold">
                <span>RAM Usage</span>
                <span className="text-white">{stats?.memory.usagePercent || 0}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${stats?.memory.usagePercent || 0}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">VPS Cloud Downloader</h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mt-1">High Performance Transfer Node</p>
          </div>
          
          <div className="flex gap-3">
            <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/5 text-[10px] font-bold text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>SF-01 ACTIVE</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Uptime: {Math.floor((stats?.uptime || 0) / 3600)}H {Math.floor(((stats?.uptime || 0) % 3600) / 60)}M
            </div>
          </div>
        </header>

        {/* Action Panel */}
        <div className="mb-8 shrink-0">
          <div className="flex gap-2 p-2 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md shadow-inner">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Terminal size={14} className="text-slate-600" />
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste remote resource URL, S3 object, or HTTP reference..." 
                className="bg-transparent border-none outline-none flex-1 text-sm text-slate-200 placeholder:text-slate-600 font-mono"
              />
            </div>
            <button 
              onClick={handleDownloadInitiate}
              disabled={loading || !url}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
            >
              {loading ? 'Initializing...' : 'Queue Download'}
              <ArrowRight size={14} />
            </button>
          </div>
          {error && (
            <div className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 animate-shake">
              <ShieldAlert size={12} />
              {error}
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <FileManager 
              files={files} 
              onDelete={handleDelete} 
              onDownload={handleLocalDownload} 
            />
          </div>

          <aside className="space-y-8">
            <StatsCard 
              title="CPU Load Avg" 
              value={`${Math.round((stats?.cpu.loadAvg || 0) * 100)}%`} 
              subValue={stats?.cpu.model}
              icon={Cpu} 
            />
            <ActiveDownloads downloads={activeDownloads} />
            
            <div className="glass-card p-5">
              <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Node Metadata</h3>
              <div className="space-y-4">
                <div className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                  <div>
                    <p className="text-slate-300 font-medium">Memory Architecture</p>
                    <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">{formatBytes(stats?.memory.total || 0)} L3-Cache Aware</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                  <div>
                    <p className="text-slate-300 font-medium">Runtime Environment</p>
                    <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">{stats?.platform.toUpperCase()} V0.1-ALPHA</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-auto pt-8 flex justify-between text-[10px] text-slate-500 font-mono font-semibold uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 bg-blue-500 rounded-full" />
              CONNECTED: 172.16.0.42
            </div>
            <span>LOC: ASIA-SOUTH-1</span>
          </div>
          <div>ESTABLISHED: 2026-04-19</div>
        </footer>
      </main>
    </div>
  );
}
