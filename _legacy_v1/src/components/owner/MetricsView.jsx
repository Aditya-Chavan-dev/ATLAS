import { useState, useEffect } from 'react'
import { ref, onValue, set, serverTimestamp, query, orderByChild, limitToLast } from 'firebase/database'
import { database } from '@/firebase/config'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Link as LinkIcon, Copy, ExternalLink, Clock, Activity,
    CheckCircle, BarChart2, Smartphone, Monitor, Tablet,
    ArrowRight, TrendingUp, Users, MousePointer
} from 'lucide-react'
import '../../pages/MetricsDashboard.css'

const DEMO_BASE_URL = window.location.origin + '/demo?s='

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function MetricsView({ currentUser }) {
    const [sources, setSources] = useState([])
    const [sessions, setSessions] = useState([])
    const [selectedSource, setSelectedSource] = useState(null)
    const [activeTab, setActiveTab] = useState('overview') // overview, comparison, funnel
    const [newLinkLabel, setNewLinkLabel] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedLink, setGeneratedLink] = useState(null)
    const [error, setError] = useState(null)
    const [copySuccess, setCopySuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load sources and sessions (Limiting to last 500 sessions)
    useEffect(() => {
        if (!currentUser) return

        setIsLoading(true)
        const sourcesRef = ref(database, 'demo/sources')
        const sessionsRef = ref(database, 'demo/sessions')

        const unsubSources = onValue(sourcesRef, (snapshot) => {
            const data = snapshot.val() || {}
            const sourceList = Object.entries(data).map(([id, source]) => ({ id, ...source }))
            setSources(sourceList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
        })

        const sessionsQuery = query(sessionsRef, orderByChild('startedAt'), limitToLast(500))
        const unsubSessions = onValue(sessionsQuery, (snapshot) => {
            const data = snapshot.val() || {}
            const sessionList = Object.entries(data).map(([id, session]) => ({ id, ...session }))
            setSessions(sessionList.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)))
            setIsLoading(false)
        })

        return () => {
            unsubSources()
            unsubSessions()
        }
    }, [currentUser])

    // stats helpers (Existing Logic Preserved)
    const getSourceStats = (sourceId) => {
        const sourceSessions = sessions.filter(s => s.sourceId === sourceId)
        const completed = sourceSessions.filter(s => s.completed).length
        const avgDuration = sourceSessions.length > 0
            ? Math.round(sourceSessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / sourceSessions.length / 1000)
            : 0
        const avgStep = sourceSessions.length > 0
            ? (sourceSessions.reduce((sum, s) => sum + (s.lastStep || s.exitStep || 0), 0) / sourceSessions.length).toFixed(1)
            : 0

        return {
            total: sourceSessions.length,
            completed,
            rate: sourceSessions.length > 0 ? Math.round((completed / sourceSessions.length) * 100) : 0,
            avgDuration,
            avgStep
        }
    }

    const getFunnelData = () => {
        const total = sessions.length
        if (total === 0) return []
        const stepCounts = [0, 0, 0, 0, 0]
        sessions.forEach(s => {
            const maxStep = s.completed ? 4 : (s.lastStep || s.exitStep || 0)
            for (let i = 0; i <= Math.min(maxStep, 4); i++) {
                stepCounts[i]++
            }
        })
        return [
            { step: 'Visit', count: total, pct: 100, color: 'from-blue-500 to-indigo-500' },
            { step: 'Mark', count: stepCounts[1], pct: Math.round((stepCounts[1] / total) * 100), color: 'from-indigo-500 to-violet-500' },
            { step: 'Notify', count: stepCounts[2], pct: Math.round((stepCounts[2] / total) * 100), color: 'from-violet-500 to-purple-500' },
            { step: 'Approve', count: stepCounts[3], pct: Math.round((stepCounts[3] / total) * 100), color: 'from-purple-500 to-fuchsia-500' },
            { step: 'Complete', count: stepCounts[4], pct: Math.round((stepCounts[4] / total) * 100), color: 'from-fuchsia-500 to-pink-500' },
        ]
    }

    const handleGenerateLink = async () => {
        if (!newLinkLabel.trim()) return
        setIsGenerating(true)
        setError(null)
        try {
            const sourceId = newLinkLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30) + '_' + Date.now().toString().slice(-4)
            await set(ref(database, `demo/sources/${sourceId}`), {
                label: newLinkLabel.trim(),
                createdAt: serverTimestamp(),
                active: true
            })
            setGeneratedLink(`${DEMO_BASE_URL}${sourceId}`)
            setNewLinkLabel('')
        } catch (err) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            console.error('Failed to copy', err)
        }
    }

    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    }

    // Overall stats
    const totalSessions = sessions.length
    const totalCompleted = sessions.filter(s => s.completed).length
    const overallRate = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0
    const avgDuration = totalSessions > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / totalSessions / 1000)
        : 0

    const DeviceIcon = ({ type }) => {
        if (type === 'mobile') return <Smartphone size={16} />
        if (type === 'tablet') return <Tablet size={16} />
        return <Monitor size={16} />
    }

    return (
        <div className="metrics-view space-y-8">
            {/* Bento Grid High-Level Stats */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {[
                    { label: 'Total Sessions', value: totalSessions, icon: Users, color: 'bg-blue-500' },
                    { label: 'Completion Rate', value: `${overallRate}%`, icon: Activity, color: 'bg-green-500' },
                    { label: 'Completed Flows', value: totalCompleted, icon: CheckCircle, color: 'bg-purple-500' },
                    { label: 'Avg Duration', value: formatDuration(avgDuration), icon: Clock, color: 'bg-orange-500' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-800/50 backdrop-blur-xl border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between group"
                    >
                        <div>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
                        </div>
                        <div className={`p-4 rounded-xl ${stat.color}/10 text-${stat.color.split('-')[1]}-400 group-hover:${stat.color} group-hover:text-white transition-all duration-300`}>
                            <stat.icon size={24} />
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Dashboard Tabs */}
            <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-1 inline-flex backdrop-blur-md">
                {['overview', 'comparison', 'funnel'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Activity className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                    <p className="text-sm font-medium">Synced with live database...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Generator & Sources */}
                                <div className="space-y-8 lg:col-span-2">
                                    {/* Link Generator */}
                                    <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><LinkIcon size={20} /></div>
                                            <h2 className="text-lg font-semibold text-white">Generate Tracking Link</h2>
                                        </div>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={newLinkLabel}
                                                onChange={(e) => setNewLinkLabel(e.target.value)}
                                                placeholder="e.g. 'Senior Recruiter - LinkedIn'"
                                                className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <button
                                                onClick={handleGenerateLink}
                                                disabled={!newLinkLabel.trim() || isGenerating}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                            >
                                                {isGenerating ? 'Creating...' : 'Create Link'}
                                            </button>
                                        </div>
                                        {generatedLink && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between"
                                            >
                                                <code className="text-emerald-400 text-sm font-mono">{generatedLink}</code>
                                                <button
                                                    onClick={() => copyToClipboard(generatedLink)}
                                                    className="text-emerald-400 hover:text-emerald-300 font-medium text-sm flex items-center gap-2"
                                                >
                                                    {copySuccess ? <CheckCircle size={16} /> : <Copy size={16} />}
                                                    {copySuccess ? 'Copied' : 'Copy'}
                                                </button>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Active Links List */}
                                    <div className="space-y-4">
                                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider px-2">Active Campaigns</h3>
                                        {sources.map(source => {
                                            const stats = getSourceStats(source.id)
                                            return (
                                                <motion.div
                                                    key={source.id}
                                                    layout
                                                    onClick={() => setSelectedSource(selectedSource === source.id ? null : source.id)}
                                                    className={`group cursor-pointer border rounded-2xl p-5 transition-all duration-300 ${selectedSource === source.id
                                                        ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10'
                                                        : 'bg-slate-800/30 border-white/5 hover:border-white/10'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedSource === source.id ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                                                                }`}>
                                                                <BarChart2 size={20} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-white font-semibold">{source.label}</h4>
                                                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                                                    <span>{source.createdAt ? format(new Date(source.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                                                                    <span>•</span>
                                                                    <span>{stats.total} visits</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <div className="text-lg font-bold text-white">{stats.rate}%</div>
                                                                <div className="text-xs text-slate-500 uppercase">Conversion</div>
                                                            </div>
                                                            <ArrowRight size={20} className={`text-slate-600 transition-transform ${selectedSource === source.id ? 'rotate-90 text-indigo-500' : ''}`} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: Timeline / Source Detail */}
                                <div className="lg:col-span-1">
                                    <div className="bg-slate-800/30 border border-white/5 rounded-2xl p-6 h-full min-h-[500px]">
                                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                                            <Activity size={18} className="text-indigo-400" />
                                            Live Activity Feed
                                        </h3>

                                        <div className="space-y-6 relative pl-4 border-l-2 border-slate-700/50">
                                            {(selectedSource
                                                ? sessions.filter(s => s.sourceId === selectedSource)
                                                : sessions.slice(0, 10) // Show last 10 global if none selected
                                            ).map((session, i) => (
                                                <motion.div
                                                    key={session.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="relative pl-6"
                                                >
                                                    <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-slate-900 ${session.completed ? 'bg-green-500' : 'bg-slate-600'
                                                        }`} />

                                                    <div className="bg-slate-800 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                                                                <Clock size={12} />
                                                                {session.startedAt ? format(new Date(session.startedAt), 'h:mm a') : 'N/A'}
                                                            </div>
                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${session.completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                                                                }`}>
                                                                {session.completed ? 'Completed' : 'Dropoff'}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-white font-medium mb-1">
                                                            <DeviceIcon type={session.deviceType || session.deviceCategory} />
                                                            <span className="capitalize">{session.deviceType || 'Desktop'} User</span>
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {session.osCategory || 'OS'} • {formatDuration(Math.round((session.sessionDuration || 0) / 1000))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}

                                            {sessions.length === 0 && (
                                                <div className="text-slate-500 text-sm italic pl-6">No activity recorded yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'comparison' && (
                            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/50 border-b border-white/5">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Source</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sessions</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Duration</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Completion</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sources.map(source => {
                                            const stats = getSourceStats(source.id)
                                            return (
                                                <tr key={source.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-medium text-white">{source.label}</div>
                                                        <div className="text-xs text-slate-500">{source.id}</div>
                                                    </td>
                                                    <td className="p-4 text-slate-300">{stats.total}</td>
                                                    <td className="p-4 text-slate-300">{formatDuration(stats.avgDuration)}</td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full max-w-[100px]">
                                                                <div
                                                                    className={`h-full rounded-full ${stats.rate > 50 ? 'bg-green-500' : 'bg-orange-500'}`}
                                                                    style={{ width: `${stats.rate}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-slate-400">{stats.rate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'funnel' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Animated Funnel */}
                                <div className="bg-slate-800/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8">
                                    <h3 className="text-white font-semibold mb-8 flex items-center gap-2">
                                        <TrendingUp size={20} className="text-indigo-400" />
                                        Conversion Funnel
                                    </h3>
                                    <div className="space-y-6">
                                        {getFunnelData().map((step, i, arr) => (
                                            <motion.div
                                                key={step.step}
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                                className="relative"
                                            >
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-white font-medium">{step.step}</span>
                                                    <span className="text-slate-400">{step.count} users ({step.pct}%)</span>
                                                </div>
                                                <div className="h-4 bg-slate-700/30 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${step.pct}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className={`h-full rounded-full bg-gradient-to-r ${step.color}`}
                                                    />
                                                </div>
                                                {i < arr.length - 1 && (
                                                    <div className="absolute right-0 -bottom-5 text-xs text-red-400 font-medium">
                                                        -{step.pct - arr[i + 1].pct}% drop
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Device Stats as Bento Cards */}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}
