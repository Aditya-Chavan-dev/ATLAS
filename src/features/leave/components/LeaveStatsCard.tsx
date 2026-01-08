import { LeaveBalance } from '../types/types';
import { Archive, Gift, Award, AlertCircle } from 'lucide-react';

interface Props {
    balance: LeaveBalance;
}

export default function LeaveStatsCard({ balance }: Props) {
    const stats = [
        {
            label: 'PL',
            sub: 'Privilege',
            val: balance.pl,
            icon: Archive,
            color: 'bg-blue-500',
            light: 'bg-blue-50'
        },
        {
            label: 'OL',
            sub: 'Occasional',
            val: balance.ol,
            icon: Gift,
            color: 'bg-purple-500',
            light: 'bg-purple-50'
        },
        {
            label: 'EL',
            sub: 'Earned',
            val: balance.el,
            icon: Award,
            color: 'bg-emerald-500',
            light: 'bg-emerald-50'
        },
        {
            label: 'LWP',
            sub: 'Unpaid Taken',
            val: balance.lwp,
            icon: AlertCircle,
            color: 'bg-amber-500',
            light: 'bg-amber-50'
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
                <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${s.light} flex items-center justify-center`}>
                        <s.icon className={`w-6 h-6 ${s.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{s.val}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
