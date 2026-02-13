import { useState, useEffect } from 'react'
import { FileText, Download, Clock, AlertTriangle, CheckCircle, BarChart3, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const API = 'http://localhost:8000'
const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
    const [analyses, setAnalyses] = useState([])
    const [stats, setStats] = useState(null)
    const [plots, setPlots] = useState([])

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const [aRes, sRes, pRes] = await Promise.all([
                fetch(`${API}/api/analyses`), fetch(`${API}/api/dashboard/stats`), fetch(`${API}/api/plots`)
            ])
            setAnalyses((await aRes.json()).analyses || [])
            setStats(await sRes.json())
            setPlots((await pRes.json()).plots || [])
        } catch { setAnalyses([]); }
    }

    const exportPlots = () => window.open(`${API}/api/export/plots`, '_blank')
    const exportAlerts = () => window.open(`${API}/api/export/alerts`, '_blank')

    const complianceDistribution = plots.length > 0 ? [
        { name: 'High (70-100)', value: plots.filter(p => p.compliance_score >= 70).length },
        { name: 'Medium (40-69)', value: plots.filter(p => p.compliance_score >= 40 && p.compliance_score < 70).length },
        { name: 'Low (0-39)', value: plots.filter(p => p.compliance_score < 40).length },
    ] : []

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Reports & Analytics</h2>
                    <p>Compliance reports, export data, and analysis history</p>
                </div>
            </header>

            <div className="page-body">
                {/* Quick Export Section */}
                <div className="content-grid" style={{ marginBottom: 24 }}>
                    <div className="card animate-in">
                        <div className="card-header"><h3><Download size={16} /> Data Exports</h3></div>
                        <div className="card-body">
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                Download compliance data for offline analysis or reporting to CSIDC authorities.
                            </p>
                            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                                <button className="btn btn-primary" onClick={exportPlots} style={{ justifyContent: 'center' }}>
                                    <Download size={16} /> Export Plot Registry (CSV)
                                </button>
                                <button className="btn btn-secondary" onClick={exportAlerts} style={{ justifyContent: 'center' }}>
                                    <Download size={16} /> Export Alerts (CSV)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card animate-in">
                        <div className="card-header"><h3><BarChart3 size={16} /> Compliance Score Distribution</h3></div>
                        <div className="card-body" style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={complianceDistribution} innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                                        {complianceDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                                {complianceDistribution.map((d, i) => (
                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                                        {d.name}: {d.value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monitoring Summary */}
                <div className="card animate-in" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3><TrendingUp size={16} /> Monitoring Summary</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                            <div className="summary-box" style={{ padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)' }}>{stats?.total_plots || 0}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Plots Monitored</div>
                            </div>
                            <div className="summary-box" style={{ padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>{stats?.average_compliance_score || 0}%</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Avg Compliance</div>
                            </div>
                            <div className="summary-box" style={{ padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-red)' }}>{stats?.violations_detected || 0}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Violations</div>
                            </div>
                            <div className="summary-box" style={{ padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-amber)' }}>₹{((stats?.total_dues_amount || 0) / 100000).toFixed(1)}L</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Dues Pending</div>
                            </div>
                            <div className="summary-box" style={{ padding: 16, textAlign: 'center' }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-cyan)' }}>{stats?.cost_comparison?.savings_percentage || 0}%</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Cost Savings</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analysis History */}
                <div className="card animate-in">
                    <div className="card-header"><h3><Clock size={16} /> Analysis History</h3></div>
                    {analyses.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={64} />
                            <h3>No Analysis Reports Yet</h3>
                            <p>Run your first image comparison on the "Analyze Images" page to generate reports here.</p>
                        </div>
                    ) : (
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="plots-table">
                                <thead><tr><th>Report ID</th><th>Reference</th><th>Current</th><th>Deviations</th><th>Change %</th><th>Risk</th><th>Date</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {analyses.map(a => (
                                        <tr key={a.result_id}>
                                            <td style={{ fontWeight: 600 }}>{a.result_id}</td>
                                            <td style={{ fontSize: 12 }}>{a.reference_file || '—'}</td>
                                            <td style={{ fontSize: 12 }}>{a.current_file || '—'}</td>
                                            <td>{a.summary?.total_deviations ?? '—'}</td>
                                            <td>{a.summary?.change_percentage ?? '—'}%</td>
                                            <td><span className={`badge badge-${(a.summary?.risk_level || 'low').toLowerCase()}`}>{a.summary?.risk_level || 'N/A'}</span></td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.analyzed_at ? new Date(a.analyzed_at).toLocaleString() : '—'}</td>
                                            <td>
                                                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
                                                    onClick={() => window.open(`${API}/api/analyses/${a.result_id}/report`, '_blank')}>
                                                    <Download size={12} /> PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
