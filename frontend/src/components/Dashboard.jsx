import { useState, useEffect } from 'react'
import {
    MapPin,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Building,
    Eye,
    Satellite,
    DollarSign,
    Shield,
    Bell,
    BarChart3,
    ArrowDownRight,
    ArrowUpRight,
    Clock,
    Target,
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    RadialBarChart,
    RadialBar,
    Legend,
} from 'recharts'
import MapView from './MapView'

const API = 'http://localhost:8000'
const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

export default function Dashboard({ onNavigate }) {
    const [stats, setStats] = useState(null)
    const [plots, setPlots] = useState([])
    const [alerts, setAlerts] = useState([])
    const [areas, setAreas] = useState([])

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const [statsRes, plotsRes, alertsRes, areasRes] = await Promise.all([
                fetch(`${API}/api/dashboard/stats`),
                fetch(`${API}/api/plots`),
                fetch(`${API}/api/alerts`),
                fetch(`${API}/api/industrial-areas`),
            ])
            setStats(await statsRes.json())
            setPlots((await plotsRes.json()).plots || [])
            const alertsData = await alertsRes.json()
            setAlerts(alertsData.alerts || [])
            setAreas((await areasRes.json()).areas || [])
        } catch {
            setStats({
                total_plots: 15, compliant: 5, violations_detected: 10, encroachments: 2,
                vacant_plots: 2, boundary_deviations: 2, unauthorized_construction: 2,
                non_compliant_construction: 2, pending_dues: 4, total_dues_amount: 1196000,
                average_compliance_score: 54.5, total_monitored_area_sqm: 74300,
                industrial_areas_count: 5, active_alerts: 12,
                cost_comparison: { drone_survey_cost_per_visit: 250000, drone_surveys_per_year: 4, annual_drone_cost: 1000000, satellite_monitoring_annual: 120000, annual_savings: 880000, savings_percentage: 88 }
            })
        }
    }

    const pieData = stats ? [
        { name: 'Compliant', value: stats.compliant },
        { name: 'Encroachment', value: stats.encroachments },
        { name: 'Vacant', value: stats.vacant_plots },
        { name: 'Boundary Issues', value: stats.boundary_deviations },
        { name: 'Unauthorized', value: stats.unauthorized_construction },
        { name: 'Other Violations', value: stats.non_compliant_construction || 0 },
    ].filter(d => d.value > 0) : []

    const getStatusBadge = (status) => {
        if (status === 'Compliant') return 'badge-compliant'
        if (status.includes('Encroachment')) return 'badge-critical'
        if (status.includes('Vacant')) return 'badge-warning'
        if (status.includes('Boundary')) return 'badge-high'
        if (status.includes('Unauthorized')) return 'badge-critical'
        return 'badge-info'
    }

    const getSeverityBadge = (sev) => {
        if (sev === 'Critical') return 'badge-critical'
        if (sev === 'High') return 'badge-high'
        if (sev === 'Medium') return 'badge-medium'
        return 'badge-low'
    }

    const costData = stats?.cost_comparison

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>CSIDC Industrial Land Monitoring — Chhattisgarh</p>
                </div>
                <div className="header-actions">
                    <div className="header-badge">
                        <span className="pulse-dot"></span>
                        Satellite Monitoring Active
                    </div>
                    <button className="btn btn-primary" onClick={() => onNavigate('analyze')}>
                        <Satellite size={16} /> New Analysis
                    </button>
                </div>
            </header>

            <div className="page-body">
                {/* TOP STATS ROW */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                    <div className="stat-card animate-in">
                        <div className="stat-icon blue"><MapPin size={18} /></div>
                        <div className="stat-value">{stats?.total_plots || 0}</div>
                        <div className="stat-label">Total Plots</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon green"><CheckCircle size={18} /></div>
                        <div className="stat-value">{stats?.compliant || 0}</div>
                        <div className="stat-label">Compliant</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon red"><AlertTriangle size={18} /></div>
                        <div className="stat-value">{stats?.violations_detected || 0}</div>
                        <div className="stat-label">Violations</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon amber"><Bell size={18} /></div>
                        <div className="stat-value">{stats?.active_alerts || 0}</div>
                        <div className="stat-label">Active Alerts</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon purple"><Target size={18} /></div>
                        <div className="stat-value">{stats?.average_compliance_score || 0}%</div>
                        <div className="stat-label">Avg Compliance</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-icon cyan"><DollarSign size={18} /></div>
                        <div className="stat-value">₹{((stats?.total_dues_amount || 0) / 100000).toFixed(1)}L</div>
                        <div className="stat-label">Dues Pending</div>
                    </div>
                </div>

                {/* MAP & ALERTS */}
                <div className="content-grid">
                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><MapPin size={16} /> Industrial Areas — Raipur Region</h3>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stats?.industrial_areas_count || 0} areas monitored</span>
                        </div>
                        <div className="card-body">
                            <div className="map-container">
                                <MapView plots={plots} />
                            </div>
                        </div>
                    </div>

                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><Bell size={16} /> Recent Alerts</h3>
                            <button className="btn btn-secondary" onClick={() => onNavigate('alerts')} style={{ padding: '6px 12px', fontSize: 12 }}>
                                View All ({alerts.length})
                            </button>
                        </div>
                        <div className="card-body" style={{ padding: 0, maxHeight: 440, overflowY: 'auto' }}>
                            {alerts.slice(0, 8).map((alert, i) => (
                                <div key={alert.id} className="alert-item" style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'flex-start',
                                    transition: 'background 0.15s',
                                    cursor: 'pointer',
                                }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                                        background: alert.severity === 'Critical' ? 'var(--accent-red)' :
                                            alert.severity === 'High' ? 'var(--accent-amber)' :
                                                alert.severity === 'Medium' ? 'var(--accent-purple)' : 'var(--accent-green)',
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{alert.type}</span>
                                            <span className={`badge ${getSeverityBadge(alert.severity)}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                                            {alert.message.length > 120 ? alert.message.slice(0, 120) + '...' : alert.message}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{alert.plot_id}</span>
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                                                {new Date(alert.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CHARTS ROW */}
                <div className="content-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    {/* Pie Chart */}
                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><BarChart3 size={16} /> Status Distribution</h3>
                        </div>
                        <div className="card-body" style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="85%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                                {pieData.map((d, i) => (
                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                                        {d.name} ({d.value})
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Area Compliance Bar */}
                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><TrendingUp size={16} /> Compliance by Area</h3>
                        </div>
                        <div className="card-body" style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={areas.map(a => ({ name: a.name.replace(' Industrial Area', ''), score: a.avg_compliance_score, violations: a.violations }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9', fontSize: 12 }} />
                                    <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Compliance Score" />
                                    <Bar dataKey="violations" fill="#ef4444" radius={[4, 4, 0, 0]} name="Violations" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Cost Savings */}
                    <div className="card animate-in">
                        <div className="card-header">
                            <h3><DollarSign size={16} /> Cost Savings Analysis</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <div style={{ fontSize: 42, fontWeight: 800, background: 'var(--gradient-green)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                                    {costData?.savings_percentage || 0}%
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Annual Cost Reduction</div>
                            </div>
                            <div className="summary-box" style={{ padding: 14 }}>
                                <div className="summary-row">
                                    <span className="label">Drone Surveys (4/yr)</span>
                                    <span className="value" style={{ color: 'var(--accent-red)' }}>₹{((costData?.annual_drone_cost || 0) / 100000).toFixed(0)}L/yr</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">Satellite Monitoring</span>
                                    <span className="value" style={{ color: 'var(--accent-green)' }}>₹{((costData?.satellite_monitoring_annual || 0) / 100000).toFixed(1)}L/yr</span>
                                </div>
                                <div className="summary-row" style={{ borderBottom: 'none' }}>
                                    <span className="label" style={{ fontWeight: 600 }}>Annual Savings</span>
                                    <span className="value" style={{ color: 'var(--accent-green)', fontSize: 16 }}>
                                        <ArrowDownRight size={14} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                                        ₹{((costData?.annual_savings || 0) / 100000).toFixed(1)}L
                                    </span>
                                </div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                                Near real-time monitoring vs 4x annual drone visits
                            </div>
                        </div>
                    </div>
                </div>

                {/* PLOTS TABLE */}
                <div className="card animate-in">
                    <div className="card-header">
                        <h3><Eye size={16} /> Plot Registry ({plots.length} plots across {stats?.industrial_areas_count || 0} areas)</h3>
                        <button className="btn btn-secondary" onClick={() => onNavigate('plots')}>View All</button>
                    </div>
                    <div className="card-body" style={{ padding: 0, maxHeight: 400, overflowY: 'auto' }}>
                        <table className="plots-table">
                            <thead>
                                <tr>
                                    <th>Plot ID</th>
                                    <th>Industrial Area</th>
                                    <th>Lessee</th>
                                    <th>Area</th>
                                    <th>Compliance</th>
                                    <th>Dues</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plots.slice(0, 10).map(plot => (
                                    <tr key={plot.id}>
                                        <td style={{ fontWeight: 600 }}>{plot.id}</td>
                                        <td style={{ fontSize: 12 }}>{plot.name}</td>
                                        <td>{plot.lessee}</td>
                                        <td>{plot.area_sqm?.toLocaleString()} sqm</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${plot.compliance_score}%`, height: '100%', borderRadius: 3,
                                                        background: plot.compliance_score >= 70 ? 'var(--accent-green)' : plot.compliance_score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{plot.compliance_score}%</span>
                                            </div>
                                        </td>
                                        <td style={{ color: plot.dues_pending > 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: plot.dues_pending > 0 ? 600 : 400 }}>
                                            {plot.dues_pending > 0 ? `₹${(plot.dues_pending / 1000).toFixed(0)}K` : '—'}
                                        </td>
                                        <td><span className={`badge ${getStatusBadge(plot.status)}`}>{plot.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}
