# OrbitAudit
Satellite-Powered Corporate ESG Forensic Tool

## Overview
OrbitAudit is a high-fidelity environmental auditing platform that cross-references corporate SEC filings with real-time satellite telemetry to detect potential greenwashing in industrial emissions. By combining computer vision, machine learning, and multispectral satellite data, OrbitAudit provides an evidence-backed, transparent view of corporate environmental performance for investors, auditors, and researchers.

The platform focuses on replacing self-reported sustainability claims with verifiable environmental signals derived directly from space-based observation.

## Problem Statement
Corporate ESG disclosures are largely self-reported, inconsistently standardized, and rarely verified against independent environmental data. This creates opportunities for greenwashing, misleading investors and regulators.

OrbitAudit addresses this gap by:
- Verifying ESG claims against satellite-derived pollution indicators
- Quantifying divergence between corporate narrative and environmental reality
- Producing auditable, repeatable sustainability assessments

## Key Features
- Satellite-based industrial emission verification
- Computer vision detection of pollution plumes
- AI-driven ESG sentiment analysis
- Predictive emissions forecasting (2026 trajectory)
- Claims-vs-reality greenwashing detection
- Cloud-native, scalable architecture

## System Architecture
OrbitAudit uses a three-tier architecture optimized for scalability and low latency.

### Frontend (Vercel)
- React-based dashboard
- Visualizes satellite heatmaps and pollution overlays
- Displays ESG audit results and emission forecasts

### Middleware Bridge (Render - Node.js)
- Acts as a caching and orchestration layer
- Uses ephemeral SQLite storage to reduce repeated audits
- Automatically rebuilds cache if cloud storage is wiped

### Audit Engine (Render - Python FastAPI)
- Core processing layer
- Interfaces with Google Earth Engine (GEE)
- Executes computer vision pipelines and ML models
- Generates ESG verification results and predictions

## Core Components

### Satellite Computer Vision Scan
- Uses Sentinel-2 (Multispectral) and Sentinel-5P (TROPOMI) datasets
- Measures tropospheric NO2 density
- Applies CLAHE enhancement and HSV masking
- Highlights pollution plumes near industrial coordinates

### Machine Learning Predictive Analytics
- Linear Regression model using Scikit-Learn
- Trained on historical emissions datasets
- Blends corporate history with 2024 satellite observations
- Forecasts a 2026 emissions trajectory

### ESG Normalizer (Claims vs Reality)
- Automated ESG auditor
- Uses Gemini 2.0 Flash for sentiment analysis of SEC 10-K filings
- Compares corporate sentiment score with satellite-derived NDVI
- Flags potential greenwashing when divergence exceeds thresholds

## Tech Stack

### Languages
- Python (FastAPI)
- JavaScript (Node.js, React)
- SQL (SQLite)

### AI / Machine Learning
- Scikit-Learn (Linear Regression)
- Google Gemini API
- YOLO-inspired computer vision concepts

### Satellite Telemetry
- Google Earth Engine (GEE) API
- Sentinel-2
- Sentinel-5P (TROPOMI)

### DevOps & Cloud
- GitHub (CI/CD)
- Render
- Vercel
- Google Cloud Service Accounts

## Project Structure
```
OrbitAudit/
├── Audit_Engine/
│   ├── main.py            # Satellite CV and ML logic
│   ├── requirements.txt   # Headless cloud dependencies
│   └── data/              # Consolidated emissions CSV
│
├── Server/
│   ├── index.js           # Node.js middleware and SQLite cache
│   ├── database.db        # Ephemeral cache storage
│   └── package.json
│
└── Client/
    ├── src/               # React UI components
    └── package.json
```

## Setup and Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google Earth Engine account
- Google Cloud service account credentials

### Environment Variables

#### Audit Engine (Python)
```
EE_SERVICE_ACCOUNT_JSON=<service_account_json>
RENDER=true
```

#### Middleware (Node.js)
```
PYTHON_URL=<audit_engine_url>
```

#### Frontend (React)
```
REACT_APP_API_URL=<middleware_url>
```

### Running Locally
1. Start the Audit Engine:
   - Install Python dependencies
   - Run FastAPI server

2. Start the Middleware Bridge:
   - Install Node.js dependencies
   - Start Express server

3. Start the Frontend:
   - Install React dependencies
   - Run development server

## Deployment
- Python Audit Engine hosted on Render (Singapore / Frankfurt regions)
- Node.js Middleware hosted on Render
- React frontend hosted on Vercel
- Services communicate via environment-configured URLs

## Intended Use Cases
- ESG due diligence for institutional investors
- Regulatory and compliance auditing
- Environmental risk assessment
- Academic research and policy analysis
- Detection of corporate greenwashing

## Limitations
- Satellite resolution limits fine-grained attribution
- Predictive models rely on historical data quality
- ESG sentiment analysis is probabilistic, not deterministic

## Future Enhancements
- Multi-pollutant analysis (SO2, CO, PM2.5)
- Deep learning plume segmentation
- Global exchange support beyond SEC filings
- Real-time monitoring alerts
- Expanded ESG scoring framework

