import { motion, AnimatePresence } from 'motion/react';
import { Download, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { ActiveDownload } from '../types';
import { formatBytes } from '../utils';

interface ActiveDownloadsProps {
  downloads: ActiveDownload[];
}

export function ActiveDownloads({ downloads }: ActiveDownloadsProps) {
  if (downloads.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Active Transfers</h3>
      <div className="grid gap-3">
        <AnimatePresence>
          {downloads.map((download) => (
            <motion.div
              key={download.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-4 flex flex-col gap-3 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono font-bold
                    ${download.status === 'downloading' ? 'bg-blue-500/20 text-blue-500' : 
                      download.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' : 
                      'bg-red-500/20 text-red-500'}`}>
                    {download.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-100 truncate max-w-[200px]" title={download.filename}>
                      {download.filename}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      {download.status} • {formatBytes(download.downloaded)} / {download.size ? formatBytes(download.size) : 'Unknown'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 tabular-nums">
                  {download.progress}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${download.progress}%` }}
                  className={`h-full transition-all duration-500 ease-out
                    ${download.status === 'completed' ? 'bg-emerald-500' : 
                      download.status === 'error' ? 'bg-red-500' : 
                      'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                />
              </div>

              {download.error && (
                <div className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle size={10} />
                  {download.error}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
