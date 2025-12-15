/**
 * MetricsDashboard.jsx
 * 
 * Owner-only metrics dashboard for viewing demo engagement.
 * Uses main app authentication - accessed via /metrics route.
 * 
 * Features:
 * - View all demo sources with session counts
 * - Create new demo links
 * - Source comparison analytics
 * - Funnel visualization
 * - Device/browser breakdown
 * - Session timeline with duration
 * - Push notifications for demo completions
 * - Real-time updates from Firebase
 */

import { useState, useEffect } from 'react'
import { ref, onValue, set } from 'firebase/database'
import { database } from '../firebase/config'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import './MetricsDashboard.css'

const DEMO_BASE_URL = window.location.origin + '/demo?s='

function MetricsDashboard() {
    const { currentUser, logout } = useAuth()

    const [sources, setSources] = useState([])
    const [sessions, setSessions] = useState([])
    const [selectedSource, setSelectedSource] = useState(null)
    const [activeTab, setActiveTab] = useState('overview') // overview, comparison, funnel
    const [newLinkLabel, setNewLinkLabel] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedLink, setGeneratedLink] = useState(null)
    const [error, setError] = useState(null)
    const [copySuccess, setCopySuccess] = useState(false)


    // Load sources and sessions
    useEffect(() => {
        if (!currentUser) return

        const sourcesRef = ref(database, 'demo/sources')
        const sessionsRef = ref(database, 'demo/sessions')

        const unsubSources = onValue(sourcesRef, (snapshot) => {
            const data = snapshot.val() || {}
            const sourceList = Object.entries(data).map(([id, source]) => ({
                id,
                ...source
            }))
            setSources(sourceList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
        }, (error) => {
            console.error('Error loading sources:', error)
            setError('Failed to load sources: ' + error.message)
        })

        const unsubSessions = onValue(sessionsRef, (snapshot) => {
            const data = snapshot.val() || {}
            const sessionList = Object.entries(data).map(([id, session]) => ({
                id,
                ...session
            }))
            setSessions(sessionList.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)))
        }, (error) => {
            console.error('Error loading sessions:', error)
        })

        return () => {
            unsubSources()
            unsubSessions()
        }
    }, [currentUser])

    // Compute stats for a source
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

    // Get funnel data
    const getFunnelData = () => {
        const total = sessions.length
        if (total === 0) return []

        const stepCounts = [0, 0, 0, 0, 0] // Steps 0-4
        sessions.forEach(s => {
            const maxStep = s.completed ? 4 : (s.lastStep || s.exitStep || 0)
            for (let i = 0; i <= Math.min(maxStep, 4); i++) {
                stepCounts[i]++
            }
        })

        return [
            { step: 'Visit', count: total, pct: 100 },
            { step: 'Mark Attendance', count: stepCounts[1], pct: Math.round((stepCounts[1] / total) * 100) },
            { step: 'Notification', count: stepCounts[2], pct: Math.round((stepCounts[2] / total) * 100) },
            { step: 'MD Approves', count: stepCounts[3], pct: Math.round((stepCounts[3] / total) * 100) },
            { step: 'Completed', count: stepCounts[4], pct: Math.round((stepCounts[4] / total) * 100) },
        ]
    }

    // Get device breakdown
    const getDeviceBreakdown = () => {
        const breakdown = { mobile: 0, tablet: 0, desktop: 0 }
        sessions.forEach(s => {
            const device = s.deviceCategory || s.deviceType || 'desktop'
            if (breakdown[device] !== undefined) breakdown[device]++
        })
        return breakdown
    }

    // Get browser breakdown
    const getBrowserBreakdown = () => {
        const breakdown = { chrome: 0, safari: 0, firefox: 0, edge: 0, other: 0 }
        sessions.forEach(s => {
            const browser = s.browserCategory || 'other'
            if (breakdown[browser] !== undefined) breakdown[browser]++
            else breakdown.other++
        })
        return breakdown
    }

    // Overall stats
    const totalSessions = sessions.length
    const totalCompleted = sessions.filter(s => s.completed).length
    const overallRate = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0
    const avgDuration = totalSessions > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / totalSessions / 1000)
        : 0


    // Generate new link
    const handleGenerateLink = async () => {
        if (!newLinkLabel.trim()) return

        setIsGenerating(true)
        setError(null)

        try {
            const sourceId = generateSourceId(newLinkLabel)
            const sourceRef = ref(database, `demo/sources/${sourceId}`)
            await set(sourceRef, {
                label: newLinkLabel.trim(),
                createdAt: Date.now(),
                active: true
            })
            setGeneratedLink(`${DEMO_BASE_URL}${sourceId}`)
            setNewLinkLabel('')
        } catch (err) {
            console.error('Link generation failed:', err)
            setError(`Failed to generate link: ${err.message}`)
        } finally {
            setIsGenerating(false)
        }
    }

    const generateSourceId = (label) => {
        const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)
        const suffix = Date.now().toString().slice(-4)
        return `${base}_${suffix}`
    }

    // Copy to clipboard
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            const textArea = document.createElement('textarea')
            textArea.value = text
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        }
    }

    // Format duration
    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    const funnelData = getFunnelData()
    const deviceBreakdown = getDeviceBreakdown()
    const browserBreakdown = getBrowserBreakdown()

    return (
        <div className="metrics-dashboard">
            {/* Header */}
            <header className="metrics-header">
                <div className="header-left">
                    <h1>📊 ATLAS Metrics</h1>
                </div>
                <div className="header-right">
                    <span className="user-email">{currentUser?.email}</span>
                    <button className="logout-btn" onClick={logout}>Logout</button>
                </div>
            </header>

            {/* Error Display */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-card">
                    <div className="stat-value">{totalSessions}</div>
                    <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalCompleted}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{overallRate}%</div>
                    <div className="stat-label">Completion Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{formatDuration(avgDuration)}</div>
                    <div className="stat-label">Avg Duration</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-nav">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={activeTab === 'comparison' ? 'active' : ''}
                    onClick={() => setActiveTab('comparison')}
                >
                    Source Comparison
                </button>
                <button
                    className={activeTab === 'funnel' ? 'active' : ''}
                    onClick={() => setActiveTab('funnel')}
                >
                    Funnel & Devices
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Link Generator */}
                    <div className="section">
                        <h2>🔗 Generate New Link</h2>
                        <div className="link-generator">
                            <input
                                type="text"
                                placeholder="e.g., ABC Company – Backend Role"
                                value={newLinkLabel}
                                onChange={(e) => setNewLinkLabel(e.target.value)}
                                disabled={isGenerating}
                                onKeyPress={(e) => e.key === 'Enter' && handleGenerateLink()}
                            />
                            <button
                                onClick={handleGenerateLink}
                                disabled={!newLinkLabel.trim() || isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>

                        {generatedLink && (
                            <div className="generated-link">
                                <span>✅ Link created:</span>
                                <code>{generatedLink}</code>
                                <button
                                    className={copySuccess ? 'copied' : ''}
                                    onClick={() => copyToClipboard(generatedLink)}
                                >
                                    {copySuccess ? '✓ Copied!' : 'Copy'}
                                </button>
                                <button onClick={() => setGeneratedLink(null)}>Dismiss</button>
                            </div>
                        )}
                    </div>

                    {/* Sources List */}
                    <div className="section">
                        <h2>📋 Demo Links</h2>
                        {sources.length === 0 ? (
                            <div className="empty-state">
                                <p>No links created yet. Generate one above!</p>
                            </div>
                        ) : (
                            <div className="sources-list">
                                {sources.map(source => {
                                    const stats = getSourceStats(source.id)
                                    return (
                                        <div
                                            key={source.id}
                                            className={`source-card ${selectedSource === source.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedSource(selectedSource === source.id ? null : source.id)}
                                        >
                                            <div className="source-info">
                                                <h3>{source.label}</h3>
                                                <span className="source-date">
                                                    Created {source.createdAt ? format(new Date(source.createdAt), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="source-stats">
                                                <span className="stat">{stats.total} sessions</span>
                                                <span className="stat">{stats.rate}% complete</span>
                                            </div>
                                            <button
                                                className="copy-link-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    copyToClipboard(`${DEMO_BASE_URL}${source.id}`)
                                                }}
                                            >
                                                📋
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selected Source Sessions */}
                    {selectedSource && (
                        <div className="section">
                            <h2>📅 Session Timeline</h2>
                            <div className="sessions-list">
                                {sessions.filter(s => s.sourceId === selectedSource).length === 0 ? (
                                    <div className="empty-state">
                                        <p>No sessions yet for this link.</p>
                                    </div>
                                ) : (
                                    sessions
                                        .filter(s => s.sourceId === selectedSource)
                                        .map(session => (
                                            <div key={session.id} className="session-card">
                                                <span className="device-icon">
                                                    {(session.deviceCategory || session.deviceType) === 'mobile' ? '📱' :
                                                        (session.deviceCategory || session.deviceType) === 'tablet' ? '📱' : '💻'}
                                                </span>
                                                <div className="session-info">
                                                    <span className="session-time">
                                                        {session.startedAt ? format(new Date(session.startedAt), 'dd MMM, h:mm a') : 'N/A'}
                                                    </span>
                                                    <span className="session-meta">
                                                        {session.browserCategory || 'browser'} • {session.osCategory || 'OS'}
                                                        {session.sessionDuration && ` • ${formatDuration(Math.round(session.sessionDuration / 1000))}`}
                                                    </span>
                                                </div>
                                                <div className="session-progress">
                                                    <span className="step-badge">Step {session.lastStep || session.exitStep || 0}</span>
                                                </div>
                                                <span className={`completion-badge ${session.completed ? 'completed' : ''}`}>
                                                    {session.completed ? '✓' : '—'}
                                                </span>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Comparison Tab */}
            {activeTab === 'comparison' && (
                <div className="section">
                    <h2>📊 Source Comparison</h2>
                    {sources.length === 0 ? (
                        <div className="empty-state">
                            <p>No sources to compare yet.</p>
                        </div>
                    ) : (
                        <div className="comparison-table-wrapper">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Source</th>
                                        <th>Sessions</th>
                                        <th>Completed</th>
                                        <th>Rate</th>
                                        <th>Avg Duration</th>
                                        <th>Avg Step</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sources.map(source => {
                                        const stats = getSourceStats(source.id)
                                        return (
                                            <tr key={source.id}>
                                                <td className="source-name">{source.label}</td>
                                                <td>{stats.total}</td>
                                                <td>{stats.completed}</td>
                                                <td>
                                                    <span className={`rate-badge ${stats.rate >= 50 ? 'good' : stats.rate >= 25 ? 'ok' : 'low'}`}>
                                                        {stats.rate}%
                                                    </span>
                                                </td>
                                                <td>{formatDuration(stats.avgDuration)}</td>
                                                <td>{stats.avgStep}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Funnel Tab */}
            {activeTab === 'funnel' && (
                <>
                    {/* Conversion Funnel */}
                    <div className="section">
                        <h2>📉 Conversion Funnel</h2>
                        {totalSessions === 0 ? (
                            <div className="empty-state">
                                <p>No session data yet.</p>
                            </div>
                        ) : (
                            <div className="funnel-container">
                                {funnelData.map((step, i) => (
                                    <div key={step.step} className="funnel-step">
                                        <div className="funnel-bar-container">
                                            <div
                                                className="funnel-bar"
                                                style={{ width: `${step.pct}%` }}
                                            />
                                        </div>
                                        <div className="funnel-info">
                                            <span className="funnel-label">{step.step}</span>
                                            <span className="funnel-stats">{step.count} ({step.pct}%)</span>
                                        </div>
                                        {i < funnelData.length - 1 && funnelData[i + 1].pct < step.pct && (
                                            <span className="drop-indicator">
                                                ↓ {step.pct - funnelData[i + 1].pct}% drop
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Device Breakdown */}
                    <div className="section">
                        <h2>📱 Device Breakdown</h2>
                        <div className="breakdown-grid">
                            <div className="breakdown-card">
                                <span className="breakdown-icon">💻</span>
                                <span className="breakdown-value">{deviceBreakdown.desktop}</span>
                                <span className="breakdown-label">Desktop</span>
                            </div>
                            <div className="breakdown-card">
                                <span className="breakdown-icon">📱</span>
                                <span className="breakdown-value">{deviceBreakdown.mobile}</span>
                                <span className="breakdown-label">Mobile</span>
                            </div>
                            <div className="breakdown-card">
                                <span className="breakdown-icon">📟</span>
                                <span className="breakdown-value">{deviceBreakdown.tablet}</span>
                                <span className="breakdown-label">Tablet</span>
                            </div>
                        </div>
                    </div>

                    {/* Browser Breakdown */}
                    <div className="section">
                        <h2>🌐 Browser Breakdown</h2>
                        <div className="breakdown-grid browser-grid">
                            {Object.entries(browserBreakdown).map(([browser, count]) => (
                                <div key={browser} className="breakdown-card small">
                                    <span className="breakdown-value">{count}</span>
                                    <span className="breakdown-label">{browser.charAt(0).toUpperCase() + browser.slice(1)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Copy Success Toast */}
            {copySuccess && (
                <div className="copy-toast">Link copied to clipboard!</div>
            )}
        </div>
    )
}

export default MetricsDashboard
