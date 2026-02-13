import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import {
    Upload,
    Image,
    Zap,
    AlertTriangle,
    CheckCircle,
    Layers,
    Flame,
    Eye,
    X,
    Download,
    FileText,
    ArrowRight,
    Shield,
} from 'lucide-react'

const API = 'http://localhost:8000'

export default function AnalyzePage() {
    const [referenceFile, setReferenceFile] = useState(null)
    const [currentFile, setCurrentFile] = useState(null)
    const [referencePreview, setReferencePreview] = useState(null)
    const [currentPreview, setCurrentPreview] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [results, setResults] = useState(null)
    const [activeTab, setActiveTab] = useState('overlay')
    const [error, setError] = useState(null)
    const [sliderPos, setSliderPos] = useState(50)
    const sliderRef = useRef(null)

    const onDropReference = useCallback((files) => {
        if (files[0]) {
            setReferenceFile(files[0])
            setReferencePreview(URL.createObjectURL(files[0]))
            setResults(null); setError(null)
        }
    }, [])

    const onDropCurrent = useCallback((files) => {
        if (files[0]) {
            setCurrentFile(files[0])
            setCurrentPreview(URL.createObjectURL(files[0]))
            setResults(null); setError(null)
        }
    }, [])

    const refDropzone = useDropzone({ onDrop: onDropReference, accept: { 'image/jpeg': [], 'image/png': [] }, multiple: false })
    const curDropzone = useDropzone({ onDrop: onDropCurrent, accept: { 'image/jpeg': [], 'image/png': [] }, multiple: false })

    const runAnalysis = async () => {
        if (!referenceFile || !currentFile) return
        setAnalyzing(true); setError(null)
        try {
            const formData = new FormData()
            formData.append('reference', referenceFile)
            formData.append('current', currentFile)
            const res = await fetch(`${API}/api/analyze`, { method: 'POST', body: formData })
            if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Analysis failed') }
            setResults(await res.json())
        } catch (err) {
            setError(err.message || 'Failed to connect. Make sure backend is running on port 8000.')
        } finally { setAnalyzing(false) }
    }

    const downloadReport = async () => {
        if (!results?.result_id) return
        try {
            const res = await fetch(`${API}/api/analyses/${results.result_id}/report`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `LandWatch_Report_${results.result_id}.pdf`
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
        } catch { alert('Failed to download report') }
    }

    const resetAll = () => {
        setReferenceFile(null); setCurrentFile(null); setReferencePreview(null)
        setCurrentPreview(null); setResults(null); setError(null)
    }

    const riskColors = { Critical: 'var(--accent-red)', High: 'var(--accent-amber)', Medium: 'var(--accent-purple)', Low: 'var(--accent-green)' }
    const priorityColors = { Immediate: '#e53e3e', High: '#dd6b20', Medium: '#805ad5', Low: '#38a169' }

    const handleSliderMove = (e) => {
        if (!sliderRef.current) return
        const rect = sliderRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
        setSliderPos((x / rect.width) * 100)
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h2>Image Analysis</h2>
                    <p>Compare reference allotment maps with current satellite/drone imagery</p>
                </div>
                <div className="header-actions">
                    {results && (
                        <>
                            <button className="btn btn-primary" onClick={downloadReport}>
                                <Download size={16} /> Download PDF Report
                            </button>
                            <button className="btn btn-secondary" onClick={resetAll}>
                                <X size={16} /> New Analysis
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="page-body">
                {!results ? (
                    <>
                        {/* Info Banner */}
                        <div style={{
                            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                            borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12
                        }}>
                            <Shield size={20} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>How it works</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    Upload a <strong>Reference Map</strong> (allotment/base map from CSIDC GIS portal as JPG/PNG)
                                    and a <strong>Current Image</strong> (satellite/drone). The system will automatically detect boundary deviations,
                                    encroachments, unauthorized construction, and vacant plots.
                                </div>
                            </div>
                        </div>

                        {/* Upload */}
                        <div className="upload-row">
                            <div className="card animate-in">
                                <div className="card-header"><h3><Image size={16} /> Step 1: Reference Map</h3></div>
                                <div className="card-body">
                                    <div {...refDropzone.getRootProps()} className={`upload-zone ${refDropzone.isDragActive ? 'active' : ''}`}>
                                        <input {...refDropzone.getInputProps()} />
                                        <div className="upload-icon"><Upload size={28} /></div>
                                        <h4>Upload Reference/Allotment Map</h4>
                                        <p>JPG/PNG exported from CSIDC GIS portal or scanned map</p>
                                    </div>
                                    {referencePreview && (
                                        <div className="upload-preview">
                                            <img src={referencePreview} alt="Reference" />
                                            <div className="file-info"><span>{referenceFile.name}</span><span>{(referenceFile.size / 1024).toFixed(1)} KB</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="card animate-in">
                                <div className="card-header"><h3><Layers size={16} /> Step 2: Current Image</h3></div>
                                <div className="card-body">
                                    <div {...curDropzone.getRootProps()} className={`upload-zone ${curDropzone.isDragActive ? 'active' : ''}`}>
                                        <input {...curDropzone.getInputProps()} />
                                        <div className="upload-icon"><Upload size={28} /></div>
                                        <h4>Upload Current Satellite/Drone Image</h4>
                                        <p>Recent satellite or drone survey image (JPG/PNG)</p>
                                    </div>
                                    {currentPreview && (
                                        <div className="upload-preview">
                                            <img src={currentPreview} alt="Current" />
                                            <div className="file-info"><span>{currentFile.name}</span><span>{(currentFile.size / 1024).toFixed(1)} KB</span></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="risk-meter critical" style={{ marginBottom: 20 }}>
                                <AlertTriangle size={20} style={{ color: 'var(--accent-red)' }} />
                                <div><div className="risk-label" style={{ color: 'var(--accent-red)' }}>Error</div><div className="risk-desc">{error}</div></div>
                            </div>
                        )}

                        <div style={{ textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={runAnalysis} disabled={!referenceFile || !currentFile || analyzing}
                                style={{ padding: '14px 40px', fontSize: 15 }}>
                                {analyzing ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing...</>
                                    : <><Zap size={18} /> Run Change Detection Analysis</>}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Risk Level */}
                        <div className={`risk-meter ${results.summary.risk_level.toLowerCase()} animate-in`}>
                            <AlertTriangle size={22} style={{ color: riskColors[results.summary.risk_level] }} />
                            <div style={{ flex: 1 }}>
                                <div className="risk-label" style={{ color: riskColors[results.summary.risk_level] }}>
                                    Risk Level: {results.summary.risk_level}
                                </div>
                                <div className="risk-desc">
                                    {results.summary.total_deviations} deviation(s) detected · {results.summary.change_percentage}% area changed
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={downloadReport} style={{ padding: '8px 16px', fontSize: 13 }}>
                                <FileText size={14} /> PDF Report
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
                            <div className="stat-card animate-in">
                                <div className="stat-icon red"><AlertTriangle size={18} /></div>
                                <div className="stat-value">{results.summary.total_deviations}</div>
                                <div className="stat-label">Deviations Found</div>
                            </div>
                            <div className="stat-card animate-in">
                                <div className="stat-icon amber"><Flame size={18} /></div>
                                <div className="stat-value">{results.summary.change_percentage}%</div>
                                <div className="stat-label">Area Changed</div>
                            </div>
                            <div className="stat-card animate-in">
                                <div className="stat-icon blue"><Eye size={18} /></div>
                                <div className="stat-value">{results.summary.changed_area_pixels?.toLocaleString()}</div>
                                <div className="stat-label">Changed Pixels</div>
                            </div>
                            <div className="stat-card animate-in">
                                <div className="stat-icon green"><CheckCircle size={18} /></div>
                                <div className="stat-value">{(100 - results.summary.change_percentage).toFixed(1)}%</div>
                                <div className="stat-label">Unchanged Area</div>
                            </div>
                        </div>

                        {/* Before/After Slider */}
                        <div className="card animate-in" style={{ marginBottom: 24 }}>
                            <div className="card-header">
                                <h3><Layers size={16} /> Before / After Comparison</h3>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Drag the slider to compare</span>
                            </div>
                            <div className="card-body">
                                <div ref={sliderRef} onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)} onClick={handleSliderMove}
                                    style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 8, cursor: 'col-resize', userSelect: 'none', border: '1px solid var(--border-color)' }}>
                                    {/* Current (full background) */}
                                    <img src={`data:image/jpeg;base64,${results.images.annotated_current}`} alt="Current" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg-primary)' }} />
                                    {/* Reference (clipped) */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: `${sliderPos}%`, height: '100%', overflow: 'hidden' }}>
                                        <img src={`data:image/jpeg;base64,${results.images.annotated_reference}`} alt="Reference" style={{ position: 'absolute', top: 0, left: 0, width: `${100 / (sliderPos / 100)}%`, height: '100%', objectFit: 'contain', background: 'var(--bg-primary)' }} />
                                    </div>
                                    {/* Slider Line */}
                                    <div style={{ position: 'absolute', top: 0, left: `${sliderPos}%`, width: 3, height: '100%', background: 'var(--accent-blue)', transform: 'translateX(-1.5px)', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                            <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>⟷</span>
                                        </div>
                                    </div>
                                    {/* Labels */}
                                    <div style={{ position: 'absolute', top: 8, left: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Reference Map</div>
                                    <div style={{ position: 'absolute', top: 8, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Current Image</div>
                                </div>
                            </div>
                        </div>

                        {/* Results Tabs */}
                        <div className="card animate-in" style={{ marginBottom: 24 }}>
                            <div className="card-header"><h3><Layers size={16} /> Visual Analysis</h3></div>
                            <div className="card-body">
                                <div className="tabs">
                                    {['overlay', 'heatmap', 'difference', 'annotated'].map(tab => (
                                        <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                            {tab === 'overlay' && 'Change Overlay'}
                                            {tab === 'heatmap' && 'Heatmap'}
                                            {tab === 'difference' && 'Binary Diff'}
                                            {tab === 'annotated' && 'Side by Side'}
                                        </button>
                                    ))}
                                </div>
                                {activeTab === 'overlay' && (
                                    <div className="result-image-container">
                                        <img src={`data:image/jpeg;base64,${results.images.overlay}`} alt="Overlay" />
                                        <div className="result-image-label"><Eye size={14} /> Red regions show detected changes</div>
                                    </div>
                                )}
                                {activeTab === 'heatmap' && (
                                    <div className="result-image-container">
                                        <img src={`data:image/jpeg;base64,${results.images.heatmap}`} alt="Heatmap" />
                                        <div className="result-image-label"><Flame size={14} /> Heat intensity: blue=low, red=high magnitude of change</div>
                                    </div>
                                )}
                                {activeTab === 'difference' && (
                                    <div className="result-image-container">
                                        <img src={`data:image/jpeg;base64,${results.images.difference}`} alt="Diff" />
                                        <div className="result-image-label"><Layers size={14} /> Binary mask after noise filtering</div>
                                    </div>
                                )}
                                {activeTab === 'annotated' && (
                                    <div className="results-grid">
                                        <div className="result-image-container">
                                            <img src={`data:image/jpeg;base64,${results.images.annotated_reference}`} alt="Ref" />
                                            <div className="result-image-label"><Image size={14} /> Reference (deviation regions marked)</div>
                                        </div>
                                        <div className="result-image-container">
                                            <img src={`data:image/jpeg;base64,${results.images.annotated_current}`} alt="Cur" />
                                            <div className="result-image-label"><Image size={14} /> Current (deviation regions marked)</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deviations + Recommendations Side by Side */}
                        <div className="content-grid">
                            {results.deviations.length > 0 && (
                                <div className="card animate-in">
                                    <div className="card-header"><h3><AlertTriangle size={16} /> Detected Deviations</h3></div>
                                    <div className="card-body" style={{ padding: 0 }}>
                                        <table className="deviation-table">
                                            <thead><tr><th>ID</th><th>Type</th><th>Severity</th><th>Area (px)</th></tr></thead>
                                            <tbody>
                                                {results.deviations.map(dev => (
                                                    <tr key={dev.id}>
                                                        <td style={{ fontWeight: 600 }}>{dev.id}</td>
                                                        <td>{dev.type}</td>
                                                        <td><span className={`badge badge-${dev.severity.toLowerCase()}`}>{dev.severity}</span></td>
                                                        <td>{dev.area_pixels?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {results.recommendations?.length > 0 && (
                                <div className="card animate-in">
                                    <div className="card-header"><h3><Shield size={16} /> Recommended Actions</h3></div>
                                    <div className="card-body">
                                        {results.recommendations.map((rec, i) => (
                                            <div key={i} style={{
                                                padding: '12px 16px', marginBottom: 8, borderRadius: 8,
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                                        background: (priorityColors[rec.priority] || '#333') + '20',
                                                        color: priorityColors[rec.priority] || '#999',
                                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                                    }}>{rec.priority}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rec.action}</span>
                                                </div>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{rec.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
