const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors());
app.use(express.json());

let db;

// 🚀 EPHEMERAL STORAGE FIX: This runs every time the server wakes up.
// If Render deleted the database.db file, this instantly rebuilds the structure!
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
    console.log("📦 Local SQLite Ephemeral Cache: READY & Auto-Saving");
})();

app.get('/api/audit', async (req, res) => {
    const { company, ticker, force_live } = req.query;
    if (!company || !ticker) return res.status(400).json({ error: "Missing parameters" });
    
    const normalizedTicker = ticker.toUpperCase();
    
    // Cloud URL routing: Uses Render's Python URL if deployed, otherwise falls back to localhost
    const pythonUrl = process.env.PYTHON_URL || 'http://127.0.0.1:8000';

    try {
        // 1. Check the Ephemeral Cache First
        if (force_live !== 'true') {
            const cached = await db.get('SELECT * FROM audits WHERE ticker = ?', [normalizedTicker]);
            if (cached) {
                const payload = JSON.parse(cached.payload);
                console.log(`[⚡ SQLITE HIT] Serving fast ephemeral cache for ${normalizedTicker}`);
                return res.json(payload);
            }
        }

        // 2. Cache Miss: Ask Python to calculate it
        console.log(`[🛰️ LIVE SCAN] Extracting multi-gas telemetry for ${normalizedTicker}...`);
        const pythonResponse = await axios.get(`${pythonUrl}/audit`, {
            params: { company, ticker: normalizedTicker },
            timeout: 180000 // 3 minute timeout for heavy satellite rendering
        });

        if (pythonResponse.data.error) throw new Error(pythonResponse.data.error);

        // 3. Save the new data into the Ephemeral Cache
        const payloadString = JSON.stringify(pythonResponse.data);
        await db.run(
            `INSERT OR REPLACE INTO audits (ticker, company, payload, lastScanned) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [normalizedTicker, company, payloadString]
        );

        console.log(`[💾 SQLITE SAVED] Ephemeral cache updated for ${normalizedTicker}`);
        return res.json(pythonResponse.data);

    } catch (error) {
        console.error(`[❌ FAILED] ${error.message}`);
        res.status(503).json({ error: true, message: "Satellite Engine Timeout or Heavy Cloud Cover." });
    }
});

// Render assigns dynamic ports via process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Bridge live on port ${PORT}`));