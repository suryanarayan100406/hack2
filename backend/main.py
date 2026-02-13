from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import os
import json
import csv
import io
from datetime import datetime, timedelta
import random
import base64

from image_processing import read_image_from_bytes, compute_difference
from report_generator import generate_pdf_report

app = FastAPI(
    title="LandWatch - Land Monitoring System API",
    description="Automated monitoring and compliance system for industrial land allotments (CSIDC)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores
analyses_store = {}
alerts_store = []

# ─── COMPREHENSIVE DEMO DATA ───────────────────────────────────────────

INDUSTRIAL_AREAS = [
    {"id": "IA-01", "name": "Siltara Industrial Area", "center": [21.2857, 81.5885], "total_plots": 45},
    {"id": "IA-02", "name": "Urla Industrial Area", "center": [21.2235, 81.5645], "total_plots": 38},
    {"id": "IA-03", "name": "Borai Industrial Area", "center": [21.3015, 81.6205], "total_plots": 32},
    {"id": "IA-04", "name": "Bhanpuri Industrial Area", "center": [21.2680, 81.5510], "total_plots": 28},
    {"id": "IA-05", "name": "Rawabhata Industrial Area", "center": [21.2100, 81.6100], "total_plots": 22},
]

DEMO_PLOTS = [
    # Siltara
    {"id": "PLOT-001", "name": "Siltara Industrial Area - Plot A1", "status": "Compliant", "area_sqm": 4500, "lessee": "ABC Industries Pvt Ltd", "allotment_date": "2019-03-15", "last_inspection": "2025-11-20", "lease_status": "Active", "lease_amount": 125000, "water_charges": 8500, "dues_pending": 0, "compliance_score": 95, "coordinates": [21.2854, 81.5880], "industrial_area": "Siltara Industrial Area", "land_use": "Manufacturing", "constructed_area_pct": 72},
    {"id": "PLOT-002", "name": "Siltara Industrial Area - Plot A2", "status": "Encroachment Detected", "area_sqm": 3200, "lessee": "XYZ Manufacturing", "allotment_date": "2020-06-01", "last_inspection": "2025-10-15", "lease_status": "Active", "lease_amount": 98000, "water_charges": 6200, "dues_pending": 15000, "compliance_score": 35, "coordinates": [21.2860, 81.5890], "industrial_area": "Siltara Industrial Area", "land_use": "Manufacturing", "constructed_area_pct": 95},
    {"id": "PLOT-003", "name": "Siltara Industrial Area - Plot A3", "status": "Compliant", "area_sqm": 5800, "lessee": "Reliable Auto Parts", "allotment_date": "2018-09-12", "last_inspection": "2025-12-05", "lease_status": "Active", "lease_amount": 155000, "water_charges": 9800, "dues_pending": 0, "compliance_score": 88, "coordinates": [21.2848, 81.5872], "industrial_area": "Siltara Industrial Area", "land_use": "Automobile", "constructed_area_pct": 65},
    # Urla
    {"id": "PLOT-004", "name": "Urla Industrial Area - Plot B5", "status": "Vacant/Unused", "area_sqm": 6000, "lessee": "PQR Steels", "allotment_date": "2018-01-10", "last_inspection": "2025-09-05", "lease_status": "Dues Pending", "lease_amount": 175000, "water_charges": 0, "dues_pending": 350000, "compliance_score": 20, "coordinates": [21.2230, 81.5640], "industrial_area": "Urla Industrial Area", "land_use": "Steel/Metal", "constructed_area_pct": 0},
    {"id": "PLOT-005", "name": "Urla Industrial Area - Plot B6", "status": "Boundary Deviation", "area_sqm": 5100, "lessee": "LMN Chemicals", "allotment_date": "2017-08-22", "last_inspection": "2025-12-01", "lease_status": "Active", "lease_amount": 142000, "water_charges": 7800, "dues_pending": 0, "compliance_score": 52, "coordinates": [21.2240, 81.5650], "industrial_area": "Urla Industrial Area", "land_use": "Chemical", "constructed_area_pct": 58},
    {"id": "PLOT-006", "name": "Urla Industrial Area - Plot B7", "status": "Non-Compliant Construction", "area_sqm": 4200, "lessee": "RST Enterprises", "allotment_date": "2020-04-18", "last_inspection": "2025-11-10", "lease_status": "Active", "lease_amount": 112000, "water_charges": 5500, "dues_pending": 22000, "compliance_score": 40, "coordinates": [21.2225, 81.5660], "industrial_area": "Urla Industrial Area", "land_use": "General", "constructed_area_pct": 82},
    # Borai
    {"id": "PLOT-007", "name": "Borai Industrial Area - Plot C1", "status": "Unauthorized Construction", "area_sqm": 7500, "lessee": "DEF Pharma Ltd", "allotment_date": "2021-02-14", "last_inspection": "2025-08-18", "lease_status": "Active", "lease_amount": 210000, "water_charges": 12000, "dues_pending": 0, "compliance_score": 28, "coordinates": [21.3010, 81.6200], "industrial_area": "Borai Industrial Area", "land_use": "Pharmaceutical", "constructed_area_pct": 110},
    {"id": "PLOT-008", "name": "Borai Industrial Area - Plot C2", "status": "Compliant", "area_sqm": 4000, "lessee": "GHI Textiles", "allotment_date": "2019-11-30", "last_inspection": "2025-07-25", "lease_status": "Active", "lease_amount": 105000, "water_charges": 6800, "dues_pending": 0, "compliance_score": 92, "coordinates": [21.3020, 81.6210], "industrial_area": "Borai Industrial Area", "land_use": "Textile", "constructed_area_pct": 60},
    {"id": "PLOT-009", "name": "Borai Industrial Area - Plot C3", "status": "Partial Construction", "area_sqm": 3800, "lessee": "JKL Foods Processing", "allotment_date": "2022-05-20", "last_inspection": "2025-10-30", "lease_status": "Active", "lease_amount": 95000, "water_charges": 4200, "dues_pending": 0, "compliance_score": 65, "coordinates": [21.3005, 81.6195], "industrial_area": "Borai Industrial Area", "land_use": "Food Processing", "constructed_area_pct": 35},
    # Bhanpuri
    {"id": "PLOT-010", "name": "Bhanpuri Industrial Area - Plot D1", "status": "Compliant", "area_sqm": 5500, "lessee": "MNO Engineering Works", "allotment_date": "2016-07-08", "last_inspection": "2025-12-12", "lease_status": "Active", "lease_amount": 148000, "water_charges": 8200, "dues_pending": 0, "compliance_score": 90, "coordinates": [21.2685, 81.5515], "industrial_area": "Bhanpuri Industrial Area", "land_use": "Engineering", "constructed_area_pct": 68},
    {"id": "PLOT-011", "name": "Bhanpuri Industrial Area - Plot D2", "status": "Encroachment Detected", "area_sqm": 4800, "lessee": "OPQ Plastics", "allotment_date": "2019-02-28", "last_inspection": "2025-09-22", "lease_status": "Dues Pending", "lease_amount": 130000, "water_charges": 7100, "dues_pending": 260000, "compliance_score": 22, "coordinates": [21.2675, 81.5505], "industrial_area": "Bhanpuri Industrial Area", "land_use": "Plastics", "constructed_area_pct": 105},
    {"id": "PLOT-012", "name": "Bhanpuri Industrial Area - Plot D3", "status": "Vacant/Unused", "area_sqm": 6200, "lessee": "STU Ceramics Ltd", "allotment_date": "2021-10-05", "last_inspection": "2025-11-08", "lease_status": "Dues Pending", "lease_amount": 168000, "water_charges": 0, "dues_pending": 504000, "compliance_score": 15, "coordinates": [21.2690, 81.5520], "industrial_area": "Bhanpuri Industrial Area", "land_use": "Ceramics", "constructed_area_pct": 0},
    # Rawabhata
    {"id": "PLOT-013", "name": "Rawabhata Industrial Area - Plot E1", "status": "Compliant", "area_sqm": 3600, "lessee": "VWX Electronics", "allotment_date": "2020-08-14", "last_inspection": "2025-12-18", "lease_status": "Active", "lease_amount": 92000, "water_charges": 5600, "dues_pending": 0, "compliance_score": 87, "coordinates": [21.2105, 81.6105], "industrial_area": "Rawabhata Industrial Area", "land_use": "Electronics", "constructed_area_pct": 55},
    {"id": "PLOT-014", "name": "Rawabhata Industrial Area - Plot E2", "status": "Boundary Deviation", "area_sqm": 4900, "lessee": "YZA Fabrication", "allotment_date": "2018-12-01", "last_inspection": "2025-10-28", "lease_status": "Active", "lease_amount": 135000, "water_charges": 7400, "dues_pending": 0, "compliance_score": 48, "coordinates": [21.2095, 81.6095], "industrial_area": "Rawabhata Industrial Area", "land_use": "Fabrication", "constructed_area_pct": 73},
    {"id": "PLOT-015", "name": "Rawabhata Industrial Area - Plot E3", "status": "Unauthorized Construction", "area_sqm": 5200, "lessee": "BCD Packaging", "allotment_date": "2019-06-15", "last_inspection": "2025-08-02", "lease_status": "Active", "lease_amount": 140000, "water_charges": 8000, "dues_pending": 45000, "compliance_score": 30, "coordinates": [21.2110, 81.6110], "industrial_area": "Rawabhata Industrial Area", "land_use": "Packaging", "constructed_area_pct": 98},
]

# Generate alerts from plot data
def generate_alerts():
    alerts = []
    for plot in DEMO_PLOTS:
        if plot["status"] == "Encroachment Detected":
            alerts.append({
                "id": f"ALT-{len(alerts)+1:03d}",
                "type": "Encroachment",
                "severity": "Critical",
                "plot_id": plot["id"],
                "plot_name": plot["name"],
                "message": f"Encroachment detected beyond allotted boundary at {plot['name']}. Estimated overflow: {(plot.get('constructed_area_pct', 100) - 100) if plot.get('constructed_area_pct', 0) > 100 else random.randint(5,15)}% beyond boundary.",
                "timestamp": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                "action_required": "Issue notice for immediate ground-truthing and rectification",
                "status": "Open",
            })
        elif plot["status"] == "Unauthorized Construction":
            alerts.append({
                "id": f"ALT-{len(alerts)+1:03d}",
                "type": "Unauthorized Construction",
                "severity": "Critical",
                "plot_id": plot["id"],
                "plot_name": plot["name"],
                "message": f"Unauthorized construction detected at {plot['name']}. Construction observed outside approved plan.",
                "timestamp": (datetime.now() - timedelta(days=random.randint(1, 20))).isoformat(),
                "action_required": "Issue stop-work order and initiate legal proceedings",
                "status": "Open",
            })
        elif plot["status"] == "Vacant/Unused":
            alerts.append({
                "id": f"ALT-{len(alerts)+1:03d}",
                "type": "Vacant Plot",
                "severity": "High",
                "plot_id": plot["id"],
                "plot_name": plot["name"],
                "message": f"Plot {plot['id']} remains vacant despite allotment on {plot['allotment_date']}. No construction activity detected.",
                "timestamp": (datetime.now() - timedelta(days=random.randint(5, 60))).isoformat(),
                "action_required": "Review allotment conditions and issue show-cause notice",
                "status": "Open",
            })
        elif plot["status"] == "Boundary Deviation":
            alerts.append({
                "id": f"ALT-{len(alerts)+1:03d}",
                "type": "Boundary Deviation",
                "severity": "Medium",
                "plot_id": plot["id"],
                "plot_name": plot["name"],
                "message": f"Boundary mismatch detected at {plot['name']}. Current land-use boundary does not align with original allotment map.",
                "timestamp": (datetime.now() - timedelta(days=random.randint(10, 45))).isoformat(),
                "action_required": "Update base maps and verify on ground",
                "status": "Under Review",
            })
        if plot["dues_pending"] > 0:
            alerts.append({
                "id": f"ALT-{len(alerts)+1:03d}",
                "type": "Payment Due",
                "severity": "High" if plot["dues_pending"] > 100000 else "Medium",
                "plot_id": plot["id"],
                "plot_name": plot["name"],
                "message": f"Outstanding dues of ₹{plot['dues_pending']:,} for {plot['name']}. Includes lease payments and/or water charges.",
                "timestamp": (datetime.now() - timedelta(days=random.randint(1, 15))).isoformat(),
                "action_required": f"Issue demand notice for ₹{plot['dues_pending']:,}",
                "status": "Open",
            })
    return alerts

alerts_store = generate_alerts()

# ─── API ENDPOINTS ──────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "LandWatch - Land Monitoring System API", "version": "2.0.0"}


@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Comprehensive dashboard statistics."""
    statuses = [p["status"] for p in DEMO_PLOTS]
    total_dues = sum(p["dues_pending"] for p in DEMO_PLOTS)
    avg_compliance = sum(p["compliance_score"] for p in DEMO_PLOTS) / len(DEMO_PLOTS)
    total_area = sum(p["area_sqm"] for p in DEMO_PLOTS)

    return {
        "total_plots": len(DEMO_PLOTS),
        "compliant": len([s for s in statuses if s == "Compliant"]),
        "violations_detected": len([s for s in statuses if s != "Compliant"]),
        "encroachments": len([s for s in statuses if "Encroachment" in s]),
        "vacant_plots": len([s for s in statuses if "Vacant" in s]),
        "boundary_deviations": len([s for s in statuses if "Boundary" in s]),
        "unauthorized_construction": len([s for s in statuses if "Unauthorized" in s]),
        "non_compliant_construction": len([s for s in statuses if "Non-Compliant" in s or "Partial" in s]),
        "pending_dues": len([p for p in DEMO_PLOTS if p["dues_pending"] > 0]),
        "total_dues_amount": total_dues,
        "average_compliance_score": round(avg_compliance, 1),
        "total_monitored_area_sqm": total_area,
        "industrial_areas_count": len(INDUSTRIAL_AREAS),
        "active_alerts": len([a for a in alerts_store if a["status"] == "Open"]),
        "total_analyses": len(analyses_store),
        "last_updated": datetime.now().isoformat(),
        # Cost savings data
        "cost_comparison": {
            "drone_survey_cost_per_visit": 250000,
            "drone_surveys_per_year": 4,
            "annual_drone_cost": 1000000,
            "satellite_monitoring_annual": 120000,
            "annual_savings": 880000,
            "savings_percentage": 88,
        },
    }


@app.get("/api/industrial-areas")
async def get_industrial_areas():
    """Get all industrial areas."""
    areas = []
    for area in INDUSTRIAL_AREAS:
        area_plots = [p for p in DEMO_PLOTS if p["industrial_area"] == area["name"]]
        compliant = len([p for p in area_plots if p["status"] == "Compliant"])
        violations = len(area_plots) - compliant
        avg_score = sum(p["compliance_score"] for p in area_plots) / len(area_plots) if area_plots else 0
        areas.append({
            **area,
            "monitored_plots": len(area_plots),
            "compliant": compliant,
            "violations": violations,
            "avg_compliance_score": round(avg_score, 1),
        })
    return {"areas": areas}


@app.get("/api/plots")
async def get_plots():
    return {"plots": DEMO_PLOTS}


@app.get("/api/plots/{plot_id}")
async def get_plot(plot_id: str):
    for plot in DEMO_PLOTS:
        if plot["id"] == plot_id:
            return plot
    raise HTTPException(status_code=404, detail="Plot not found")


@app.get("/api/alerts")
async def get_alerts():
    """Get all alerts sorted by severity."""
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    sorted_alerts = sorted(alerts_store, key=lambda a: severity_order.get(a["severity"], 4))
    return {
        "alerts": sorted_alerts,
        "summary": {
            "total": len(sorted_alerts),
            "critical": len([a for a in sorted_alerts if a["severity"] == "Critical"]),
            "high": len([a for a in sorted_alerts if a["severity"] == "High"]),
            "medium": len([a for a in sorted_alerts if a["severity"] == "Medium"]),
            "open": len([a for a in sorted_alerts if a["status"] == "Open"]),
        }
    }


@app.post("/api/analyze")
async def analyze_images(
    reference: UploadFile = File(..., description="Reference/allotment map image (JPG/PNG)"),
    current: UploadFile = File(..., description="Current satellite/drone image (JPG/PNG)")
):
    allowed = ["image/jpeg", "image/png", "image/jpg"]
    if reference.content_type not in allowed or current.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images are supported (matching CSIDC GIS portal export formats)")

    try:
        ref_bytes = await reference.read()
        cur_bytes = await current.read()

        ref_img = read_image_from_bytes(ref_bytes)
        cur_img = read_image_from_bytes(cur_bytes)

        if ref_img is None or cur_img is None:
            raise HTTPException(status_code=400, detail="Could not decode one or both images")

        results = compute_difference(ref_img, cur_img)

        results["metadata"] = {
            "reference_filename": reference.filename,
            "current_filename": current.filename,
            "analyzed_at": datetime.now().isoformat(),
            "reference_dimensions": f"{ref_img.shape[1]}x{ref_img.shape[0]}",
            "current_dimensions": f"{cur_img.shape[1]}x{cur_img.shape[0]}",
        }

        # Generate recommendations based on results
        results["recommendations"] = generate_recommendations(results)

        analyses_store[results["result_id"]] = results
        return JSONResponse(content=results)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/analyses")
async def list_analyses():
    summaries = []
    for rid, data in analyses_store.items():
        summaries.append({
            "result_id": rid,
            "analyzed_at": data.get("metadata", {}).get("analyzed_at"),
            "summary": data.get("summary"),
            "reference_file": data.get("metadata", {}).get("reference_filename"),
            "current_file": data.get("metadata", {}).get("current_filename"),
        })
    return {"analyses": summaries}


@app.get("/api/analyses/{result_id}")
async def get_analysis(result_id: str):
    if result_id not in analyses_store:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analyses_store[result_id]


@app.get("/api/analyses/{result_id}/report")
async def download_report(result_id: str):
    """Generate and download a PDF compliance report for an analysis."""
    if result_id not in analyses_store:
        raise HTTPException(status_code=404, detail="Analysis not found")

    analysis = analyses_store[result_id]
    pdf_buffer = generate_pdf_report(analysis)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=LandWatch_Report_{result_id}.pdf"}
    )


@app.get("/api/export/plots")
async def export_plots_csv():
    """Export all plot data as CSV."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "name", "industrial_area", "status", "area_sqm", "lessee",
        "allotment_date", "last_inspection", "lease_status", "lease_amount",
        "water_charges", "dues_pending", "compliance_score", "land_use",
        "constructed_area_pct"
    ])
    writer.writeheader()
    for plot in DEMO_PLOTS:
        row = {k: plot.get(k, "") for k in writer.fieldnames}
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=CSIDC_Plot_Registry.csv"}
    )


@app.get("/api/export/alerts")
async def export_alerts_csv():
    """Export alerts as CSV."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "type", "severity", "plot_id", "plot_name", "message",
        "action_required", "status", "timestamp"
    ])
    writer.writeheader()
    for alert in alerts_store:
        writer.writerow(alert)

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=CSIDC_Alerts.csv"}
    )


def generate_recommendations(results):
    """Generate actionable recommendations based on analysis results."""
    recs = []
    summary = results.get("summary", {})
    deviations = results.get("deviations", [])

    if summary.get("risk_level") == "Critical":
        recs.append({
            "priority": "Immediate",
            "action": "Schedule emergency field inspection within 48 hours",
            "reason": "Critical deviations detected that require immediate verification"
        })

    for dev in deviations:
        if "Encroachment" in dev.get("type", ""):
            recs.append({
                "priority": "High",
                "action": f"Issue encroachment notice for region {dev['id']}",
                "reason": f"{dev['type']} detected with {dev['severity']} severity"
            })
        elif "Unauthorized" in dev.get("type", ""):
            recs.append({
                "priority": "High",
                "action": f"Issue stop-work order for region {dev['id']}",
                "reason": f"Unauthorized development detected - area: {dev['area_pixels']} px"
            })
        elif "Vacant" in dev.get("type", "") or "Demolition" in dev.get("type", ""):
            recs.append({
                "priority": "Medium",
                "action": f"Verify land utilization status for region {dev['id']}",
                "reason": "Possible under-utilization or abandonment detected"
            })

    if summary.get("change_percentage", 0) > 5:
        recs.append({
            "priority": "Medium",
            "action": "Update reference base maps with current survey data",
            "reason": f"{summary['change_percentage']}% change detected — base map may be outdated"
        })

    recs.append({
        "priority": "Low",
        "action": "Schedule next satellite monitoring review in 30 days",
        "reason": "Continue periodic monitoring to track deviation trends"
    })

    return recs


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
