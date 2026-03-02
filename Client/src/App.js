import React, { useState } from 'react';
import axios from 'axios';
import { Search, Globe2, Activity, ShieldCheck, ArrowRight, AlertTriangle, Database, CloudRain, Wind, Factory, BookOpen, Leaf, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [company, setCompany] = useState('');
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forceLive, setForceLive] = useState(false); 

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!company || !ticker) return;
    
    setData(null); 
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/audit`, {
        params: { company, ticker: ticker.toUpperCase(), force_live: forceLive }
      });
      
      if (res.data.error) {
        setErrorMsg(res.data.message || "Unknown Telemetry Error.");
      } else {
        setData({ ...res.data }); 
      }
    } catch (err) {
      setErrorMsg("Connection to the Orbital Engine was lost. Verify backend servers are running.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06101e] flex flex-col items-center justify-center text-white font-sans px-4">
        <div className="relative">
          <Globe2 size={100} className="text-emerald-500 animate-[spin_4s_linear_infinite] opacity-20 absolute" />
          <Globe2 size={100} className="text-emerald-400 animate-pulse relative z-10" />
        </div>
        <h2 className="text-2xl font-black mt-8 tracking-[0.3em] uppercase text-emerald-50">Establishing Uplink</h2>
        <p className="text-emerald-400 font-mono tracking-widest mt-4 text-sm bg-emerald-900/30 px-4 py-2 rounded">
          {forceLive ? "BYPASSING DATABASE: FORCING LIVE RAW SCAN" : "QUERYING DATABASE & TELEMETRY"} // {ticker.toUpperCase()}
        </p>
        <div className="w-96 h-1 bg-slate-800 mt-10 overflow-hidden">
          <div className="h-full bg-emerald-500 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
        </div>
      </div>
    );
  }

  if (data) {
    const latestMetrics = data.audit_assets?.gas_metrics?.[1] || { no2: 0, ch4: 0, co2: 0 };
    const esg = data.esg_normalization; 
    const pred2026 = data.audit_assets?.prediction_2026;

    return (
      <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-800">
        
        {/* TOP HEADER */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-900 rounded-xl shadow-lg shadow-emerald-900/20">
              <Globe2 size={32} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-none mb-1 tracking-tighter">OrbitAudit</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {data.metadata?.company} • {data.metadata?.location_name}
              </p>
            </div>
          </div>
          <button onClick={() => {setData(null); setCompany(''); setTicker('');}} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">
            End Session
          </button>
        </div>

        {/* LAYOUT FIX: 
          1. "items-start" prevents the right column from stretching to the full height of the left column.
          2. "pb-24" ensures there is padding at the bottom so you can scroll smoothly. 
        */}
        <div key={data.metadata?.ticker} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-24">
          
          {/* LEFT COLUMN: SCROLLABLE CONTENT */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ROW 1: Integrity Score & AI Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <div className="col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-4">Integrity Score</h3>
                <div className="relative flex flex-col items-center justify-center w-full">
                  <svg viewBox="0 0 100 55" className="w-48 h-auto overflow-visible drop-shadow-sm">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" stroke="#059669" strokeWidth="10" strokeLinecap="round"
                      pathLength="100" strokeDasharray="100"
                      strokeDashoffset={100 - (data.ai_verdict?.trust_score || 0)}
                      className="transition-all duration-[1500ms] ease-out"
                    />
                  </svg>
                  <div className="absolute bottom-0 text-center -mb-2">
                    <div className="text-6xl font-black text-slate-900 tracking-tighter flex items-baseline justify-center">
                      {data.ai_verdict?.trust_score}
                      <span className="text-xl text-slate-300 ml-1 font-bold">/100</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex flex-col justify-center">
                <h3 className="text-slate-900 font-black text-lg mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" size={24}/> AI Forensic Verdict
                </h3>
                <div className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 text-[15px] font-medium shadow-inner">
                   {data.ai_verdict?.report}
                </div>
              </div>
            </div>

            {/* ROW 2: ESG NORMALIZATION (CLAIMS VS REALITY) */}
            {esg && (
              <div className="bg-slate-900 p-8 rounded-[2rem] shadow-lg border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Scale size={180}/></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h3 className="text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Scale size={14}/> 10-K Normalization Engine
                      </h3>
                      <p className="text-2xl font-black tracking-tighter">Claims vs. Reality</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p>
                      <div className={`px-4 py-2 rounded-full text-xs font-black tracking-widest ${esg.status === 'ESG LEADER' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                        {esg.status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="flex items-center gap-2 text-blue-400"><BookOpen size={16}/> SEC Filing Sentiment</span>
                        <span className="text-white">{esg.sentiment} / 1.0</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: `${esg.sentiment * 100}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="flex items-center gap-2 text-emerald-400"><Leaf size={16}/> Orbital NDVI Truth</span>
                        <span className="text-white">{esg.ndvi} / 1.0</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{width: `${esg.ndvi * 100}%`}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-3">
                    <AlertTriangle className={esg.status === 'ESG LEADER' ? 'text-emerald-400' : 'text-amber-400'} size={20} />
                    <p className="text-sm font-medium text-slate-300"><strong className="text-white">Auditor Note:</strong> {esg.audit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ROW 3: 3-GAS TELEMETRY COUNTERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="p-3 bg-red-50 text-red-600 rounded-full mb-4">
                  <CloudRain size={24} />
                </div>
                <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-1">NO2 Density</h3>
                <p className="text-3xl font-black text-slate-900">{latestMetrics.no2}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">µmol/m²</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full mb-4">
                  <Wind size={24} />
                </div>
                <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-1">CH4 (Methane)</h3>
                <p className="text-3xl font-black text-slate-900">{latestMetrics.ch4}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">ppb volume</p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-full mb-4">
                  <Factory size={24} />
                </div>
                <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-1">CO2 Estimate</h3>
                <p className="text-3xl font-black text-slate-900">{latestMetrics.co2}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">kg/hr flux</p>
              </div>
            </div>

            {/* ROW 4: CHARTS & CV IMAGES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider"><Activity className="text-emerald-600" size={18}/> Emission Trajectory</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.audit_assets?.gas_metrics}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} width={40}/>
                      <Tooltip cursor={{stroke: '#cbd5e1', strokeWidth: 2}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                      <Line 
                        type="monotone" 
                        dataKey="co2" 
                        stroke="#059669" 
                        strokeWidth={4} 
                        dot={(props) => {
                          const { payload, cx, cy } = props;
                          return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={6} fill={payload.isPrediction ? "#f59e0b" : "#059669"} stroke="white" strokeWidth={2} />
                        }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col">
                <h3 className="font-bold text-slate-900 mb-6 text-[10px] uppercase tracking-[0.2em]">Computer Vision Validation</h3>
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col items-center">
                    <img 
                      key={`base-${data.metadata.ticker}`}
                      className="w-full aspect-square rounded-2xl object-cover shadow-inner border border-slate-200 mb-3" 
                      src={data.audit_assets?.heatmaps["2022"]} 
                      alt="Baseline" 
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Baseline</span>
                  </div>
                  <div className="text-emerald-300">
                    <ArrowRight size={20} strokeWidth={3}/>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <img 
                      key={`detect-${data.metadata.ticker}`}
                      className="w-full aspect-square rounded-2xl object-cover shadow-lg border-2 border-emerald-500 mb-3" 
                      src={data.audit_assets?.heatmaps["2024"]} 
                      alt="CV Hotspots" 
                    />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">CV Scan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STATIC / STICKY SIDEBAR
            The "sticky" and "top-8" classes lock this perfectly in place as you scroll.
          */}
          <div className="lg:col-span-4 sticky top-8 flex flex-col gap-6">
            
            {/* Metadata Card */}
            <div className="bg-emerald-950 rounded-[2rem] p-8 text-emerald-50 shadow-xl border border-emerald-900">
              <h3 className="text-emerald-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-8">Metadata</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-emerald-500/80 text-[10px] uppercase tracking-widest mb-1">Entity</p>
                  <p className="text-xl font-black tracking-tight">{data.metadata?.company}</p>
                </div>
                <hr className="border-emerald-900/50" />
                <div>
                  <p className="text-emerald-500/80 text-[10px] uppercase tracking-widest mb-1">Ticker ID</p>
                  <p className="text-xl font-bold font-mono tracking-widest">{data.metadata?.ticker}</p>
                </div>
                <hr className="border-emerald-900/50" />
                <div>
                  <p className="text-emerald-500/80 text-[10px] uppercase tracking-widest mb-2">System Status</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-900/50 border border-emerald-800 rounded-full text-[10px] font-black tracking-widest text-emerald-400">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                    {forceLive ? "LIVE SCAN EXECUTED" : "LOADED FROM DB"}
                  </div>
                </div>
              </div>
            </div>

            {/* ML PREDICTION CARD */}
            {pred2026 && (
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5"><Activity size={150} /></div>
                <div className="relative z-10">
                  <h3 className="text-amber-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Activity size={14}/> ML Predictive Analytics
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">2026 Forecast (CO₂ Eq)</p>
                  
                  <div className="flex items-end gap-3 mb-5">
                    <span className="text-5xl font-black tracking-tighter text-white">{pred2026}</span>
                    <span className="text-sm text-slate-400 font-mono mb-1.5">kg/hr</span>
                  </div>
                  
                  {/* Dynamic Trend Indicator */}
                  {(() => {
                    const isUp = pred2026 > latestMetrics.co2;
                    const percentChange = (((pred2026 - latestMetrics.co2) / latestMetrics.co2) * 100).toFixed(1);
                    return (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${isUp ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isUp ? '+' : ''}{percentChange}% Projected vs 2024
                      </div>
                    );
                  })()}
                  
                  <p className="text-[10px] text-slate-500 mt-6 leading-relaxed border-t border-slate-800 pt-4">
                    Powered by Scikit-Learn Linear Regression. Forecast integrates historical SEC emissions data and localized atmospheric telemetry.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] font-sans text-gray-800 flex flex-col">
      <nav className="p-8 flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950 rounded-xl shadow-lg">
            <Globe2 size={24} className="text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">OrbitAudit</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16 text-center">
        <h1 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-[0.9]">
          Truth From <span className="text-emerald-700">Space.</span>
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto leading-relaxed mb-10">
          Cross-referencing SEC filings with real-time Copernicus satellite telemetry and computer vision.
        </p>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl w-full max-w-3xl text-sm font-bold text-left shadow-sm">
            <AlertTriangle size={20} className="text-red-500 shrink-0"/>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSearch} className="bg-white p-3 rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-slate-100 w-full max-w-3xl flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" required
                className="w-full pl-14 pr-6 py-4 rounded-full bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-600 font-medium transition-all" 
                placeholder="Target Entity (e.g. ExxonMobil)" 
                value={company} onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-36">
              <input 
                type="text" required
                className="w-full px-6 py-4 rounded-full bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-bold uppercase text-center" 
                placeholder="TICKER" 
                value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
              />
            </div>
            <button type="submit" className="px-10 py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black rounded-full transition-all uppercase tracking-widest text-sm">
              Scan
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-slate-50 rounded-full w-fit mx-auto border border-slate-200 cursor-pointer" onClick={() => setForceLive(!forceLive)}>
            <Database size={14} className={forceLive ? "text-slate-400" : "text-emerald-600"} />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              {forceLive ? "Bypassing Cache (Live Scan)" : "Using Cached Database (Fast)"}
            </span>
            <div className={`w-8 h-4 rounded-full transition-colors relative ml-2 ${forceLive ? "bg-emerald-500" : "bg-slate-300"}`}>
              <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${forceLive ? "translate-x-4" : "translate-x-0.5"}`}></div>
            </div>
          </div>
        </form>

        <div className="mt-10 flex flex-wrap justify-center items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span>Quick Targets:</span>
          {[['ExxonMobil', 'XOM'], ['Chevron', 'CVX'], ['Tesla', 'TSLA']].map(([c, t]) => (
            <button key={t} onClick={() => { setCompany(c); setTicker(t); }} className="px-4 py-2 bg-slate-200/50 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
              {c} ({t})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;