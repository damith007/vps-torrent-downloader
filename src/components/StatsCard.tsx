import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color?: string;
}

export function StatsCard({ title, value, subValue, icon: Icon, color = 'bg-zinc-900' }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex flex-col gap-3 group hover:border-slate-700 transition-all pointer-cursor shadow-lg"
    >
      <div className="flex justify-between items-start">
        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</span>
        <Icon size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{value}</span>
        {subValue && <span className="text-[10px] text-slate-500 mt-1 uppercase transition-colors">{subValue}</span>}
      </div>
    </motion.div>
  );
}
