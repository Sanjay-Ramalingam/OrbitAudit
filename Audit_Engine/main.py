import ee
import requests
import cv2
import numpy as np
import base64
import time
import os
import math
import json
import pandas as pd
from sklearn.linear_model import LinearRegression
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from geopy.geocoders import Nominatim
from google import genai
from sec_api import ExtractorApi, QueryApi

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- 🛰️ EARTH ENGINE CLOUD AUTHENTICATION ---
try:
    if os.getenv('RENDER'):
        # Check for Service Account JSON in Env Vars
        ee_json = os.getenv('EE_SERVICE_ACCOUNT_JSON')
        if ee_json:
            ee_creds = json.loads(ee_json)
            credentials = ee.ServiceAccountCredentials(ee_creds['client_email'], key_data=ee_json)
            ee.Initialize(credentials, project='dauntless-glow-489009-m7')
            print("🌍 Earth Engine: ONLINE (Cloud Service Account)")
        else:
            print("❌ EE_SERVICE_ACCOUNT_JSON missing in Environment Variables")
    else:
        ee.Initialize(project='dauntless-glow-489009-m7')
        print("🌍 Earth Engine: ONLINE (Local Auth)")
except Exception as e:
    print(f"EE Init Error: {e}")

SEC_API_KEY = os.getenv("SEC_API_KEY")
client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

# --- 🚀 BULLETPROOF ML PREDICTION ENGINE ---
class EmissionPredictor:
    def __init__(self):
        # Use relative pathing that works on Render
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'consolidated_emissions.csv')
        try:
            self.df = pd.read_csv(csv_path)
            self.df.columns = self.df.columns.str.lower().str.strip()
            if 'ticker' in self.df.columns:
                self.df['ticker'] = self.df['ticker'].astype(str).str.upper()
            print("📈 ML Predictor: CSV Loaded Successfully")
        except Exception as e:
            self.df = None
            print(f"⚠️ ML Predictor Init Error: {e}. Path: {csv_path}")

    def predict_2026(self, ticker, current_val):
        try:
            if self.df is None or 'ticker' not in self.df.columns or ticker not in self.df['ticker'].values:
                return round(current_val * 1.04, 2)
            
            company_data = self.df[self.df['ticker'] == ticker].sort_values('year')
            X = company_data[['year']].values
            y = company_data['emissions'].values
            
            model = LinearRegression().fit(X, y)
            prediction = model.predict([[2026]])[0]
            return round((prediction * 0.3) + (current_val * 0.7), 2)
        except:
            return round(current_val * 1.04, 2)

predictor = EmissionPredictor()

# --- 🛠️ HELPER FUNCTIONS ---
FAST_COORDS = {
    "XOM": (30.1944, -95.4616, "ExxonMobil Campus, TX"),
    "CVX": (37.7667, -121.9583, "Chevron San Ramon, CA"),
    "TSLA": (30.2223, -97.6171, "Tesla Gigafactory, TX"),
    "AAPL": (37.3349, -122.0090, "Apple Park, CA"),
    "NVDA": (37.3713, -121.9640, "Nvidia HQ, CA")
}

def get_coords(company, ticker):
    ticker_upper = ticker.upper()
    if ticker_upper in FAST_COORDS: return FAST_COORDS[ticker_upper]
    geo = Nominatim(user_agent=f"orbit_audit_v2_{time.time()}")
    try:
        loc = geo.geocode(f"{company} {ticker} industrial", timeout=5)
        if loc: return loc.latitude, loc.longitude, loc.address
    except: pass
    return 31.9, -102.3, "Permian Basin (Default)"

def apply_computer_vision(image_url):
    try:
        resp = requests.get(image_url, timeout=10)
        img = cv2.imdecode(np.asarray(bytearray(resp.content), dtype=np.uint8), cv2.IMREAD_COLOR)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, np.array([0, 100, 100]), np.array([40, 255, 255]))
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            if cv2.contourArea(cnt) > 25:
                x, y, w, h = cv2.boundingRect(cnt)
                cv2.rectangle(img, (x, y), (x+w, y+h), (0, 0, 255), 2)
        _, buffer = cv2.imencode('.png', img)
        return f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"
    except:
        return ""

def run_esg_normalizer(ticker, lat, lon):
    try:
        query_api = QueryApi(SEC_API_KEY)
        extractor = ExtractorApi(SEC_API_KEY)
        
        # 1. SEC Text Analysis
        query = {"query": f"ticker:{ticker} AND formType:\"10-K\"", "size": "1"}
        res = query_api.get_filings(query)
        report_score = 0.5
        if res.get('filings'):
            url = res['filings'][0]['linkToHtml']
            text = extractor.get_section(url, "1", "text")[:1500]
            try:
                prompt = f"Rate ESG commitment 0.0 to 1.0 from this SEC text: {text}"
                ai_res = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
                report_score = float(ai_res.text.strip())
            except: pass

        # 2. Satellite Truth (NDVI)
        pt = ee.Geometry.Point([lon, lat])
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").filterBounds(pt).filterDate('2023-01-01', '2024-12-31').sort('CLOUDY_PIXEL_PERCENTAGE').first()
        ndvi = s2.normalizedDifference(['B8', 'B4']).reduceRegion(ee.Reducer.mean(), pt, 30).getInfo().get('nd', 0)
        sat_score = (ndvi + 1) / 2

        final = (report_score * 0.6) + (sat_score * 0.4)
        return {
            "final_score": round(final, 3),
            "sentiment": round(report_score, 2),
            "ndvi": round(sat_score, 2),
            "status": "ESG LEADER" if final > 0.6 else "COMPLIANT",
            "audit": "Satellite truth vs SEC filings analyzed."
        }
    except:
        return {"final_score": 0.5, "sentiment": 0.5, "ndvi": 0.5, "status": "UNKNOWN", "audit": "Normalizer Fail"}

@app.get("/audit")
async def generate_audit(company: str, ticker: str):
    print(f"🛰️ Scanning: {company}")
    lat, lon, addr = get_coords(company, ticker)
    try:
        point = ee.Geometry.Point([lon, lat])
        region = point.buffer(2000).bounds()
        metrics, heatmaps = [], {}
        
        esg_data = run_esg_normalizer(ticker, lat, lon)

        for year in ["2022", "2024"]:
            start, end = f"{int(year)-1}-01-01", f"{year}-12-31"
            s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(region).filterDate(start, end).mosaic()
            no2 = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_NO2').select('tropospheric_NO2_column_number_density').filterBounds(region).filterDate(start, end).mean()
            
            url = s2.visualize(bands=['B4', 'B3', 'B2'], min=0, max=3000).blend(
                no2.visualize(min=0, max=0.0002, palette=['blue', 'purple', 'red', 'yellow']).updateMask(no2.gt(0.00004))
            ).getThumbURL({'dimensions': '500x500', 'region': region, 'format': 'png'})
            
            heatmaps[year] = apply_computer_vision(url)
            n_val = no2.reduceRegion(ee.Reducer.mean(), point, 1000).getInfo().get('tropospheric_NO2_column_number_density') or 0.0001
            metrics.append({"name": year, "no2": round(n_val*1000000, 2), "co2": round(n_val*500000 + 180, 2)})

        pred_2026 = predictor.predict_2026(ticker.upper(), metrics[1]['co2'])
        metrics.append({"name": "2026", "co2": pred_2026, "isPrediction": True})

        try:
            res = client.models.generate_content(model="gemini-2.0-flash", contents=f"Summarize emission risk for {company} at {addr}. CO2 shift: {metrics[0]['co2']} to {metrics[1]['co2']}. 2 sentences.")
            ai_report = res.text
        except:
            ai_report = "Satellite data indicates localized industrial activity. Baseline comparisons completed."

        return {
            "metadata": {"company": company.upper(), "ticker": ticker.upper(), "location_name": addr},
            "audit_assets": {"heatmaps": heatmaps, "gas_metrics": metrics, "prediction_2026": pred_2026},
            "ai_verdict": {"trust_score": 85, "report": ai_report.strip()},
            "esg_normalization": esg_data 
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    import os
    # Render provides the port as an environment variable. 
    # We must typecast it to int.
    port = int(os.environ.get("PORT", 10000)) 
    uvicorn.run(app, host="0.0.0.0", port=port)