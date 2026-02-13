import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, Shield, Filter, Download, CheckCircle } from 'lucide-react'

const API = 'http://localhost:8000'

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([])
    const [summary, setSummary] = useState({})
    const [filter, setFilter] = useState('all')

    useEffect(() => { fetchAlerts() }, [])

    const fetchAlerts = async () => {
        try {
            const res = await fetch(`${API}/api/alerts`)
            const data = await res.json()
            setAlerts(data.alerts || [])
            setSummary(data.summary || {})
        } catch {
            setAlerts([])
        }
    }

    const exportAlerts = () => {
        window.open(`${API}/api/export/alerts`, '_blank')
    }

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'all') return true
        return a.severity === filter
    })

    const severityColors = {
        Critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', dot: 'var(--accent-red)' },
        High: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: 'var(--accent-amber)' },
        Medium: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', dot: 'var(--accent-purple)' },
        Low: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', dot: 'var(--accent-green)' },
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Alerts & Notifications</h2>
                    <p>Real-time compliance alerts and violation notifications</p>
                </div>
                <button className="btn btn-secondary" onClick={exportAlerts}>
                    <Download size={16} /> Export CSV
                </button>
            </header>

            <div className="page-body">
                {/* Summary Stats */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
                    <div className="stat-card animate-in">
                        <div className="stat-icon red"><Bell size={18} /></div>
                        <div className="stat-value">{summary.total || 0}</div>
                        <div className="stat-label">Total Alerts</div>
                    </div>
                    <div className="stat-card animate-in" style={{ cursor: 'pointer' }} onClick={() => setFilter('Critical')}>
                        <div className="stat-icon red"><AlertTriangle size={18} /></div>
                        <div className="stat-value">{summary.critical || 0}</div>
                        <div className="stat-label">Critical</div>
                    </div>
                    <div className="stat-card animate-in" style={{ cursor: 'pointer' }} onClick={() => setFilter('High')}>
                        <div className="stat-icon amber"><AlertTriangle size={18} /></div>
                        <div className="stat-value">{summary.high || 0}</div>
                        <div className="stat-label">High</div>
                    </div>
                    <div className="stat-card animate-in" style={{ cursor: 'pointer' }} onClick={() => setFilter('Medium')}>
                        <div className="stat-icon purple"><Shield size={18} /></div>
                        <div className="stat-value">{summary.medium || 0}</div>
                        <div className="stat-label">Medium</div>
                    </div>
                    <div className="stat-card animate-in" style={{ cursor: 'pointer' }} onClick={() => setFilter('all')}>
                        <div className="stat-icon green"><CheckCircle size={18} /></div>
                        <div className="stat-value">{summary.open || 0}</div>
                        <div className="stat-label">Open</div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {['all', 'Critical', 'High', 'Medium'].map(f => (
                        <button key={f} className={`tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                            style={{ flex: 'none', padding: '8px 16px', borderRadius: 8, background: filter === f ? 'var(--accent-blue)' : 'var(--bg-card)', border: '1px solid var(--border-color)', color: filter === f ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                            {f === 'all' ? 'All Alerts' : f}
                        </button>
                    ))}
                </div>

                {/* Alerts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredAlerts.map(alert => {
                        const colors = severityColors[alert.severity] || severityColors.Low
                        return (
                            <div key={alert.id} className="card animate-in" style={{
                                background: colors.bg, borderColor: colors.border,
                            }}>
                                <div className="card-body" style={{ padding: '18px 22px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors.dot, flexShrink: 0 }} />
                                            <div>
                                                <span style={{ fontWeight: 700, fontSize: 15 }}>{alert.type}</span>
                                                <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
                                                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{alert.plot_name}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                                            <span className={`badge ${alert.status === 'Open' ? 'badge-warning' : 'badge-info'}`}>{alert.status}</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 12px 20px' }}>
                                        {alert.message}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={12} /> {new Date(alert.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plot: {alert.plot_id}</span>
                                        </div>
                                        <div style={{
                                            fontSize: 12, padding: '6px 12px', borderRadius: 6,
                                            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                            color: 'var(--text-primary)', fontWeight: 500
                                        }}>
                                            <strong>Action:</strong> {alert.action_required}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
