import { useState, useEffect } from 'react'
import { Map, Search, ExternalLink, Download, Building, Target } from 'lucide-react'

const API = 'http://localhost:8000'

export default function PlotsPage() {
    const [plots, setPlots] = useState([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [areaFilter, setAreaFilter] = useState('all')
    const [selectedPlot, setSelectedPlot] = useState(null)

    useEffect(() => { fetchPlots() }, [])

    const fetchPlots = async () => {
        try {
            const res = await fetch(`${API}/api/plots`)
            setPlots((await res.json()).plots || [])
        } catch {
            // fallback handled in render
        }
    }

    const exportCSV = () => {
        window.open(`${API}/api/export/plots`, '_blank')
    }

    const getStatusBadge = (status) => {
        if (status === 'Compliant') return 'badge-compliant'
        if (status.includes('Encroachment')) return 'badge-critical'
        if (status.includes('Vacant')) return 'badge-warning'
        if (status.includes('Boundary')) return 'badge-high'
        if (status.includes('Unauthorized')) return 'badge-critical'
        return 'badge-info'
    }

    const areas = [...new Set(plots.map(p => p.industrial_area))].filter(Boolean)

    const filtered = plots.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.id.toLowerCase().includes(search.toLowerCase()) ||
            (p.lessee || '').toLowerCase().includes(search.toLowerCase())
        const matchStatus = filter === 'all' ||
            (filter === 'compliant' && p.status === 'Compliant') ||
            (filter === 'violations' && p.status !== 'Compliant') ||
            (filter === 'dues' && p.dues_pending > 0)
        const matchArea = areaFilter === 'all' || p.industrial_area === areaFilter
        return matchSearch && matchStatus && matchArea
    })

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Plot Registry</h2>
                    <p>Complete inventory of {plots.length} monitored industrial land parcels</p>
                </div>
                <div className="header-actions">
                    <a href="https://cggis.cgstate.gov.in/csidc/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        <ExternalLink size={16} /> CSIDC GIS Portal
                    </a>
                    <button className="btn btn-primary" onClick={exportCSV}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </header>

            <div className="page-body">
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, position: 'relative', minWidth: 250 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search by Plot ID, name, or lessee..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter', outline: 'none' }} />
                    </div>
                    <select value={filter} onChange={e => setFilter(e.target.value)}
                        style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All Status</option>
                        <option value="compliant">Compliant</option>
                        <option value="violations">Violations</option>
                        <option value="dues">Dues Pending</option>
                    </select>
                    <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}
                        style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'Inter', outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All Areas</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="card animate-in">
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="plots-table">
                            <thead>
                                <tr>
                                    <th>Plot ID</th>
                                    <th>Industrial Area / Plot</th>
                                    <th>Lessee</th>
                                    <th>Area</th>
                                    <th>Land Use</th>
                                    <th>Compliance</th>
                                    <th>Lease (₹)</th>
                                    <th>Dues (₹)</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(plot => (
                                    <tr key={plot.id} onClick={() => setSelectedPlot(selectedPlot?.id === plot.id ? null : plot)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: 600 }}>{plot.id}</td>
                                        <td style={{ fontSize: 12 }}>{plot.name}</td>
                                        <td>{plot.lessee}</td>
                                        <td>{plot.area_sqm?.toLocaleString()} sqm</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{plot.land_use || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
                                                    <div style={{ width: `${plot.compliance_score}%`, height: '100%', borderRadius: 3, background: plot.compliance_score >= 70 ? 'var(--accent-green)' : plot.compliance_score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)' }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{plot.compliance_score}%</span>
                                            </div>
                                        </td>
                                        <td>₹{(plot.lease_amount || 0).toLocaleString()}</td>
                                        <td style={{ color: plot.dues_pending > 0 ? 'var(--accent-red)' : 'var(--text-muted)', fontWeight: plot.dues_pending > 0 ? 600 : 400 }}>
                                            {plot.dues_pending > 0 ? `₹${plot.dues_pending.toLocaleString()}` : '—'}
                                        </td>
                                        <td><span className={`badge ${getStatusBadge(plot.status)}`}>{plot.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedPlot && (
                    <div className="card animate-in" style={{ marginTop: 20 }}>
                        <div className="card-header">
                            <h3><Building size={16} /> Plot Details — {selectedPlot.id}</h3>
                            <button className="btn btn-secondary" onClick={() => setSelectedPlot(null)} style={{ padding: '6px 12px', fontSize: 12 }}>Close</button>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                <div className="summary-box" style={{ padding: 14 }}>
                                    <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>General</h4>
                                    <div className="summary-row"><span className="label">Plot Name</span><span className="value" style={{ fontSize: 12 }}>{selectedPlot.name}</span></div>
                                    <div className="summary-row"><span className="label">Lessee</span><span className="value">{selectedPlot.lessee}</span></div>
                                    <div className="summary-row"><span className="label">Land Use</span><span className="value">{selectedPlot.land_use}</span></div>
                                    <div className="summary-row"><span className="label">Area</span><span className="value">{selectedPlot.area_sqm?.toLocaleString()} sqm</span></div>
                                </div>
                                <div className="summary-box" style={{ padding: 14 }}>
                                    <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Dates</h4>
                                    <div className="summary-row"><span className="label">Allotment</span><span className="value">{selectedPlot.allotment_date}</span></div>
                                    <div className="summary-row"><span className="label">Last Inspection</span><span className="value">{selectedPlot.last_inspection}</span></div>
                                    <div className="summary-row"><span className="label">Coordinates</span><span className="value" style={{ fontSize: 11 }}>{selectedPlot.coordinates?.join(', ')}</span></div>
                                </div>
                                <div className="summary-box" style={{ padding: 14 }}>
                                    <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Financials</h4>
                                    <div className="summary-row"><span className="label">Lease Amount</span><span className="value">₹{(selectedPlot.lease_amount || 0).toLocaleString()}</span></div>
                                    <div className="summary-row"><span className="label">Water Charges</span><span className="value">₹{(selectedPlot.water_charges || 0).toLocaleString()}</span></div>
                                    <div className="summary-row"><span className="label">Dues Pending</span><span className="value" style={{ color: selectedPlot.dues_pending > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>₹{(selectedPlot.dues_pending || 0).toLocaleString()}</span></div>
                                    <div className="summary-row"><span className="label">Lease Status</span><span className="value">{selectedPlot.lease_status}</span></div>
                                </div>
                                <div className="summary-box" style={{ padding: 14 }}>
                                    <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>Compliance</h4>
                                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                                        <div style={{
                                            width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
                                            background: `conic-gradient(${selectedPlot.compliance_score >= 70 ? 'var(--accent-green)' : selectedPlot.compliance_score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)'} ${selectedPlot.compliance_score * 3.6}deg, var(--bg-primary) 0deg)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                                                {selectedPlot.compliance_score}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="summary-row"><span className="label">Status</span><span className={`badge ${getStatusBadge(selectedPlot.status)}`}>{selectedPlot.status}</span></div>
                                    <div className="summary-row"><span className="label">Built Area</span><span className="value">{selectedPlot.constructed_area_pct}%</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
