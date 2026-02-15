# LandWatch 🛰️
### Automated Industrial Land Monitoring System for CSIDC, Chhattisgarh

**A satellite-imagery-based compliance monitoring platform that detects encroachments, unauthorized construction, vacant plots, and boundary deviations across industrial land allotments — reducing dependency on costly drone surveys by 88%.**

---

## Problem Statement

CSIDC (Chhattisgarh State Industrial Development Corporation) manages thousands of industrial plots across the state. Currently, ensuring compliance (detecting encroachments, unauthorized construction, vacant plots) relies on expensive periodic drone surveys (₹2.5L per visit × 4/year = ₹10L/year). LandWatch automates this using satellite imagery and image processing.
Hosted - https://hackathon.suryaxtony.in/
## Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Change Detection** | Compare reference allotment maps with current satellite/drone images to detect differences |
| 🗺️ **Interactive Map** | Leaflet map showing all monitored plots with color-coded compliance status |
| ⚠️ **Alert System** | Real-time alerts for encroachments, unauthorized construction, vacant plots, and payment dues |
| 📊 **Compliance Scoring** | Per-plot compliance score (0-100%) with visual gauges |
| 📋 **PDF Reports** | Generate professional compliance reports for CSIDC authorities |
| 💰 **Cost Savings** | 88% reduction in monitoring costs (₹1.2L/yr satellite vs ₹10L/yr drone) |
| 📤 **Data Export** | CSV export for plot registry and alerts for offline analysis |
| 🔎 **Before/After Slider** | Interactive comparison slider to visually compare reference vs current images |
| 🎯 **Actionable Recommendations** | Priority-based recommended actions for each detected deviation |

## Tech Stack

- **Backend**: Python, FastAPI, OpenCV, NumPy, ReportLab (PDF)
- **Frontend**: React, Vite, Leaflet, Recharts, Lucide React
- **Analysis**: Change detection, morphological filtering, deviation classification

## Project Structure

```
hack1/
├── backend/
│   ├── main.py                 # FastAPI server with all endpoints
│   ├── image_processing.py     # OpenCV change detection engine
│   ├── report_generator.py     # PDF report generation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css           # Dark theme design system
│   │   └── components/
│   │       ├── Dashboard.jsx    # Stats, map, charts, alerts
│   │       ├── AnalyzePage.jsx  # Image upload & analysis
│   │       ├── PlotsPage.jsx    # Plot registry with details
│   │       ├── AlertsPage.jsx   # Alerts & notifications
│   │       ├── ReportsPage.jsx  # Reports & data export
│   │       └── MapView.jsx      # Interactive Leaflet map
│   └── package.json
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Dashboard statistics with cost analysis |
| GET | `/api/plots` | All monitored plots |
| GET | `/api/plots/{id}` | Specific plot details |
| GET | `/api/alerts` | Alerts & notifications |
| GET | `/api/industrial-areas` | Industrial area summaries |
| POST | `/api/analyze` | Upload & analyze images |
| GET | `/api/analyses` | Analysis history |
| GET | `/api/analyses/{id}/report` | Download PDF report |
| GET | `/api/export/plots` | Export plots as CSV |
| GET | `/api/export/alerts` | Export alerts as CSV |

## Demo Data

The system includes demo data for **15 industrial plots** across **5 industrial areas** in Raipur:
- Siltara Industrial Area
- Urla Industrial Area
- Borai Industrial Area
- Bhanpuri Industrial Area
- Rawabhata Industrial Area

## How Analysis Works

1. **Upload** a reference map (allotment/base map from CSIDC GIS portal as JPG/PNG)
2. **Upload** a current satellite or drone image
3. **LandWatch** automatically:
   - Aligns and compares the two images
   - Detects changed regions using pixel-level difference analysis
   - Classifies deviations (encroachment, unauthorized construction, land use change, etc.)
   - Assigns severity levels (Critical/High/Medium/Low)
   - Generates visual outputs (overlay, heatmap, binary diff, annotated images)
   - Provides actionable recommendations for each finding
4. **Download** a professional PDF compliance report

## Cost Savings

| Method | Cost/Visit | Frequency | Annual Cost |
|--------|-----------|-----------|-------------|
| Drone Surveys | ₹2,50,000 | 4x/year | ₹10,00,000 |
| **LandWatch (Satellite)** | — | **Continuous** | **₹1,20,000** |
| **Annual Savings** | | | **₹8,80,000 (88%)** |

---

**Built for the CSIDC Hackathon** | LandWatch v2.0
