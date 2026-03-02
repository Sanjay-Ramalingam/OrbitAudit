const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());

let db;

(async () => {
    db = await open({ filename: './database.db', driver: sqlite3.Database });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS audits (
            ticker TEXT PRIMARY KEY,
            company TEXT,
            payload TEXT,
            lastScanned DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("📦 Local SQLite Database: READY & Auto-Saving");
})();

app.get('/api/audit', async (req, res) => {
    const { company, ticker, force_live } = req.query;
    if (!company || !ticker) return res.status(400).json({ error: "Missing parameters" });
    
    const normalizedTicker = ticker.toUpperCase();

    try {
        if (force_live !== 'true') {
            const cached = await db.get('SELECT * FROM audits WHERE ticker = ?', [normalizedTicker]);
            if (cached) {
                const payload = JSON.parse(cached.payload);
                if (payload.audit_assets?.heatmaps?.["2024"]?.startsWith("data:image/png")) {
                    console.log(`[⚡ SQLITE HIT] Serving fast cache for ${normalizedTicker}`);
                    return res.json(payload);
                }
            }
        }

        console.log(`[🛰️ LIVE SCAN] Extracting multi-gas telemetry for ${normalizedTicker}...`);
        const pythonResponse = await axios.get(`http://127.0.0.1:8000/audit`, {
            params: { company, ticker: normalizedTicker },
            timeout: 180000 
        });

        if (pythonResponse.data.error) throw new Error(pythonResponse.data.error);

        // ALWAYS STORE IN DATABASE AFTER LOAD
        const payloadString = JSON.stringify(pythonResponse.data);
        await db.run(
            `INSERT OR REPLACE INTO audits (ticker, company, payload, lastScanned) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [normalizedTicker, company, payloadString]
        );

        console.log(`[💾 SQLITE SAVED] Database updated for ${normalizedTicker}`);
        return res.json(pythonResponse.data);

    } catch (error) {
        console.error(`[❌ FAILED] ${error.message}`);
        res.status(503).json({ error: true, message: "Satellite Engine Timeout or Heavy Cloud Cover." });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Bridge live on http://127.0.0.1:${PORT}`));