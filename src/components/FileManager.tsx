import { motion, AnimatePresence } from 'motion/react';
import { File, Trash2, DownloadCloud, MoreVertical, ExternalLink } from 'lucide-react';
import { FileInfo } from '../types';
import { formatBytes } from '../utils';

interface FileManagerProps {
  files: FileInfo[];
  onDelete: (name: string) => void;
  onDownload: (name: string) => void;
}

export function FileManager({ files, onDelete, onDownload }: FileManagerProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Server Registry</h3>
        <span className="text-[10px] font-mono text-slate-600">{files.length} Entries</span>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[1fr,100px,120px,100px] p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
          <span>Resource Name</span>
          <span>Size</span>
          <span>Archived At</span>
          <span className="text-right">Operations</span>
        </div>

        <div className="divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {files.length === 0 ? (
              <div className="p-12 text-center text-slate-600 font-medium text-sm">
                No archived resources detected.
              </div>
            ) : (
              files.map((file) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-[1fr,100px,120px,100px] items-center p-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                      <File size={14} />
                    </div>
                    <span className="text-sm text-slate-200 truncate font-medium" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  
                  <span className="text-xs text-slate-400 tabular-nums">
                    {formatBytes(file.size)}
                  </span>
                  
                  <span className="text-xs text-slate-500 tabular-nums">
                    {new Date(file.mtime).toLocaleDateString()}
                  </span>

                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => onDownload(file.name)}
                      className="p-2 hover:bg-blue-600/10 text-slate-400 hover:text-blue-400 rounded-lg transition-all"
                      title="Download"
                    >
                      <DownloadCloud size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(file.name)}
                      className="p-2 hover:bg-red-600/10 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                      title="Purge"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
