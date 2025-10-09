import React, { useEffect, useMemo, useState } from 'react';
import BackendCard from './components/BackendCard.jsx';
import BusiestChart from './components/BusiestChart.jsx';
import HistoryChart from './components/HistoryChart.jsx';
import { getBackends, getSummary, getTop, getRecommendation } from './api.js';
import Navbar from './Navbar.jsx';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [backends, setBackends] = useState([]);
  const [top, setTop] = useState([]);
  const [error, setError] = useState(null);
  const [minQubits, setMinQubits] = useState(0);
  const [maxQueue, setMaxQueue] = useState('');
  const [selectedBackend, setSelectedBackend] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [randomData, setRandomData] = useState({});
  const [isLive, setIsLive] = useState(true); // New state for on/off functionality
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const generateRandomData = () => {
    setRandomData({
      total_backends: Math.floor(Math.random() * 50) + 10,
      operational_backends: Math.floor(Math.random() * 40) + 5,
      simulators: Math.floor(Math.random() * 10) + 1,
      total_pending_jobs: Math.floor(Math.random() * 1000) + 100,
    });
  };

  async function refresh() {
    setLoading(true);
    setInitialLoad(false);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const [s, b, t] = await Promise.all([getSummary(), getBackends(), getTop(8)]);
      if (!s.ok) throw new Error(s.error || 'summary failed');
      if (!b.ok) throw new Error(b.error || 'backends failed');
      setSummary(s.data || null);
      setBackends(b.data || []);
      setTop(t.data || []);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    generateRandomData();
    refresh();
    let es;
    if (isLive) {
      const url = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/stream";
      es = new EventSource(url);
      es.onmessage = (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.type === 'snapshot') {
            const items = d.items || [];
            setBackends(items);
            const total = items.length;
            const operational = items.filter(x => x.operational).length;
            const sims = items.filter(x => x.is_simulator).length;
            const total_pending = items.reduce((acc, x) => acc + (x.queue_length || 0), 0);
            setSummary({ total_backends: total, operational_backends: operational, simulators: sims, total_pending_jobs: total_pending });
            const busy = [...items].sort((a, b) => (b.queue_length || 0) - (a.queue_length || 0)).slice(0, 8);
            setTop(busy);
          } else if (d.type === 'error') {
            console.error('stream error', d.error);
          }
        } catch (e) { console.error(e) }
      };
      es.onerror = (e) => { console.error("SSE error", e) };
    }
    return () => {
      if (es) {
        es.close();
      }
    };
  }, [isLive]);

  const recommendedText = useMemo(() => {
    return async () => {
      const mq = Number.isNaN(parseInt(maxQueue)) ? null : parseInt(maxQueue);
      const res = await getRecommendation(parseInt(minQubits || 0), mq);
      if (!res.ok || !res.data) return 'No recommendation available';
      const r = res.data;
      return `${r.name} — ${r.queue_length ?? '-'} in queue, ${r.num_qubits ?? '-'} qubits`;
    };
  }, [minQubits, maxQueue]);

  const [rec, setRec] = useState('');
  useEffect(() => {
    recommendedText().then(setRec);
  }, [recommendedText]);

  const chartData = (top || []).map(d => ({ name: d.name, queue: d.queue_length || 0 }));

  async function fetchHistory(name) {
    if (!name) return setHistory([]);
    try {
      const res = await fetch(`${API_BASE}/api/history?backend_name=${encodeURIComponent(name)}&limit=200`);
      const j = await res.json();
      if (j.ok) setHistory(j.data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function predictWait() {
    if (!selectedBackend) return alert('Select a backend first');
    try {
      const res = await fetch(`${API_BASE}/api/predict_wait?backend_name=${encodeURIComponent(selectedBackend)}`);
      const j = await res.json();
      if (j.ok) {
        const mins = Math.round((j.estimate_seconds || 0) / 60);
        alert(`Estimated wait ~ ${mins} minutes (median queue ${j.median_queue_length})`);
      } else {
        alert('No prediction available: ' + (j.error || 'unknown'));
      }
    } catch (e) { alert(String(e)) }
  }

  const exportCSV = () => {
    if (!selectedBackend) {
      alert('Select a backend first to export history data.');
      return;
    }
    const rows = history || [];
    if (!rows.length) {
      alert('No history data to export for the selected backend.');
      return;
    }
    const keys = Object.keys(rows[0]);
    const csvContent = [
      keys.join(','),
      ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedBackend + '-history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('CSV file downloaded successfully!');
  };

  const exportJSON = () => {
    const dashboardData = {
      summary: summary,
      backends: backends,
      topBackends: top,
      selectedBackendHistory: history,
      currentBackend: selectedBackend
    };

    const jsonContent = JSON.stringify(dashboardData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-dashboard-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('JSON file downloaded successfully!');
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return (
    <>
      <div className="background-container">
        <div className="bg-overlay" style={{
          background: 'linear-gradient(135deg, rgba(25, 5, 45, 0.9), rgba(10, 0, 20, 0.95)), radial-gradient(circle at center, rgba(125, 23, 184, 0.2), rgba(0, 147, 217, 0.1))',
        }}>
          <div className="particles-container">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}vw`,
                top: `${Math.random() * 100}vh`,
                animationDuration: `${Math.random() * 10 + 5}s`,
                animationDelay: `-${Math.random() * 10}s`,
                '--x-end': `${(Math.random() * 200 - 100)}vw`,
                '--y-end': `${(Math.random() * 200 - 100)}vh`,
                '--s-end': `${Math.random() * 1.5 + 0.5}`,
              }}></div>
            ))}
          </div>
          <div className="bg-glow top-left"></div>
          <div className="bg-glow bottom-right"></div>
          <div className="bg-glow center-top"></div>
          <div className="bg-glow center-bottom"></div>
          <div className="bg-glow left-middle"></div>
          <div className="bg-glow right-middle"></div>
        </div>
      </div>

      <div className="dashboard-container" id="dashboard-container">
        <h1 className="main-title">QUANTUM DASHBOARD</h1>
        <div className="title-bar">
          <div className="muted subtitle">Live IBM Quantum backend queues — with history &amp; simple wait-time prediction</div>
          <div className="button-group">
            <button onClick={toggleLive} className={`live-button ${isLive ? 'live-on' : 'live-off'}`}>
              <span className="live-dot"></span>
              <span className="live-text">{isLive ? 'LIVE' : 'PAUSED'}</span>
            </button>
            <button onClick={refresh} disabled={loading} className="refresh-btn" value="refresh_data">
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner-ring ring1"></div>
              <div className="spinner-ring ring2"></div>
              <div className="spinner-ring ring3"></div>
            </div>
            <div className="loading-text">Fetching live quantum data...</div>
            <div className="loading-subtext">Preparing the qubits for optimal performance</div>
          </div>
        )}

        {error && <div className="error-card">Error: {error}</div>}

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="muted">Total Backends</div>
            <div className="stat-value">{initialLoad ? (randomData.total_backends ?? '-') : (summary?.total_backends ?? '-')}</div>
          </div>
          <div className="card stat-card">
            <div className="muted">Operational</div>
            <div className="stat-value">{initialLoad ? (randomData.operational_backends ?? '-') : (summary?.operational_backends ?? '-')}</div>
          </div>
          <div className="card stat-card">
            <div className="muted">Simulators</div>
            <div className="stat-value">{initialLoad ? (randomData.simulators ?? '-') : (summary?.simulators ?? '-')}</div>
          </div>
          <div className="card stat-card">
            <div className="muted">Total Pending Jobs</div>
            <div className="stat-value">{initialLoad ? (randomData.total_pending_jobs ?? '-') : (summary?.total_pending_jobs ?? '-')}</div>
          </div>
        </div>

        <div className="main-grid">
          <div className="card graph-card">
            <BusiestChart data={chartData} barColor="#3b82f6" />
          </div>
          <div className="card recommendation-card">
            <div className="card-title">Recommendation</div>
            <div className="form-grid">
              <label>Min qubits: <input type="number" value={minQubits} onChange={e => setMinQubits(e.target.value)} /></label>
              <label>Max queue length (optional): <input type="number" value={maxQueue} onChange={e => setMaxQueue(e.target.value)} /></label>
            </div>
            <div className="muted" style={{ marginTop: '8px' }}>{rec}</div>
          </div>
        </div>

        <h2 className="section-title">All Backends</h2>
        <div className="backends-grid">
          {(backends || []).map(b => (
            <div key={b.name} onClick={() => { setSelectedBackend(b.name); fetchHistory(b.name) }} className="backend-card-wrapper">
              <BackendCard b={b} />
            </div>
          ))}
        </div>

        <div className="history-grid">
          <div className="card history-chart-card">
            <div className="history-header">
              <div className="card-title">History / Prediction</div>
              <div>
                <select value={selectedBackend} onChange={e => { setSelectedBackend(e.target.value); fetchHistory(e.target.value) }}>
                  <option value=''>-- select backend --</option>
                  {(backends || []).map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
                </select>
                <button onClick={predictWait} className="predict-btn">Predict Wait</button>
              </div>
            </div>
            <div className="chart-container">
              {history && history.length > 0 ? <HistoryChart data={history} /> : <div className="muted chart-placeholder">Click a backend above to load history (saved snapshots)</div>}
            </div>
          </div>

          <div className="card export-card">
            <div className="card-title">Export</div>
            <div className="export-text">Export data for the currently selected backend.</div>
            <div className="export-button-container">
              <button className="export-btn" onClick={exportCSV}>Export CSV</button>
              <button className="export-btn" onClick={exportJSON}>Export JSON</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* --- General Styling for all themes --- */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        body {
          font-family: 'Poppins', sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
          margin: 0;
          overflow-x: hidden;
        }

        /* Container for the glowing background effects with enhanced mesmerizing gradients */
        .background-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          overflow: hidden;
        }

        .bg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          background-size: cover;
          background-position: center;
        }

        .dashboard-container {
          padding: 32px;
          max-width: 1600px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }

        .dashboard-container.loaded {
            opacity: 1;
            transform: translateY(0);
        }

        .main-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          color: var(--text-color-primary);
          margin: 0 ;
          text-align: center;
          letter-spacing: 2px;
          text-shadow: var(--neon-glow);
        }

        .title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .subtitle {
          margin-bottom: 3 px;
        }

        .button-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .live-button {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 20px;
          border: 2px solid;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease-in-out;
          background-color: transparent;
        }

        .live-button.live-on {
          border-color: #ff4d4d;
        }

        .live-button.live-off {
          border-color: #ffffff;
        }

        .live-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .live-button.live-on .live-dot {
          background-color: #ff4d4d;
          box-shadow: 0 0 5px #ff4d4d, 0 0 10px #ff4d4d, 0 0 15px #ff4d4d;
          animation: liveDotPulse 1.5s infinite ease-in-out;
        }

        .live-button.live-off .live-dot {
          background-color: #ffffff;
        }

        .live-text {
          font-size: 14px;
        }

        .live-button.live-on .live-text {
          color: #ff4d4d;
          animation: liveTextPulse 1.5s infinite ease-in-out;
        }

        .live-button.live-off .live-text {
          color: #6b7280;
        }

        @keyframes liveDotPulse {
          0% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 5px #ff4d4d;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
            box-shadow: 0 0 15px #ff4d4d, 0 0 20px #ff4d4d;
          }
          100% {
            transform: scale(1);
            opacity: 1;
            box-shadow: 0 0 5px #ff4d4d;
          }
        }

        @keyframes liveTextPulse {
          0%, 100% {
            text-shadow: 0 0 5px #ff4d4d;
          }
          50% {
            text-shadow: 0 0 15px #ff4d4d;
          }
        }

        .refresh-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #5deb25ff);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .refresh-btn:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
        }

        .refresh-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
          box-shadow: none;
        }

        .card {
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease, opacity 0.3s ease;
          position: relative;
          overflow: hidden;
          animation: fadeIn 1s ease-out;
        }

        .card:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 1.1em;
        }

        .stat-value {
          font-size: 30px;
          font-weight: 700;
          color: #3b82f6;
          transition: color 0.3s ease, transform 0.3s ease;
        }

        .stat-card:hover .stat-value {
          color: #25e8ebff;
          transform: scale(1.05);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 28px;
          margin-bottom: 28px;
        }

        .graph-card, .history-chart-card {
            padding: 16px;
        }

        .recommendation-card label {
            display: block;
            margin-bottom: 7px;
        }

        .recommendation-card input, .history-grid select {
            width: 100%;
            padding:6px;
            border-radius: 10px;
            border: 1px solid #d1d5db;
            background: #ffffff;
            font-size: 14px;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .recommendation-card input:focus, .history-grid select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
        }

        .section-title {
          font-size: 28px;
          font-weight: 700;
          margin-top: 36px;
          margin-bottom: 18px;
          text-align: center;
          position: relative;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 3px;
          background: linear-gradient(90deg, #7d17b8, #0093d9);
          border-radius: 2px;
        }

        .backends-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 18px;
        }

        .backend-card-wrapper {
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .backend-card-wrapper:hover {
          transform: translateY(-5px) scale(1.03);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
        }

        .history-grid {
          margin-top: 36px;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 28px;
        }

        .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .predict-btn, .export-btn {
          margin-left: 12px;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .predict-btn:hover, .export-btn:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
        }

        .chart-container {
            min-height: 260px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }

        .chart-placeholder {
            text-align: center;
            padding: 20px;
        }

        .export-text {
            margin-bottom: 12px;
        }

        .export-button-container {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        /* --- Enhanced Mesmerizing Loader --- */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(26, 19, 32, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          transition: background-color 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .loading-spinner {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .spinner-ring {
          position: absolute;
          border-radius: 50%;
          animation: spin 2s linear infinite, glow 1.5s ease-in-out infinite alternate;
        }

        .ring1 {
          width: 80px;
          height: 80px;
          border: 6px solid transparent;
          border-top: 8px solid #42a5f5;
          border-bottom: 6px solid #42a5f5;
          animation-delay: 0s;
        }

        .ring2 {
          width: 60px;
          height: 60px;
          top: 10px;
          left: 10px;
          border: 5px solid transparent;
          border-left: 5px solid #7d17b8;
          border-right: 5px solid #7d17b8;
          animation-delay: 0.5s;
          animation-direction: reverse;
        }

        .ring3 {
          width: 40px;
          height: 40px;
          top: 20px;
          left: 20px;
          border: 4px solid transparent;
          border-top: 4px solid #d91d90;
          border-bottom: 4px solid #d91d90;
          animation-delay: 1s;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 10px rgba(66, 165, 245, 0.5); }
          100% { box-shadow: 0 0 20px rgba(66, 165, 245, 0.5); }
        }

        .loading-text {
          margin-top: 30px;
          color: white;
          font-size: 1.4em;
          font-weight: 600;
          text-shadow: 0 0 10px rgba(240, 230, 230, 1);
          animation: textPulse 1s ease-in-out infinite;
        }

        .loading-subtext {
          margin-top: 10px;
          color: #FFFFFF;
          font-size: 1em;
          animation: textFade 3s ease-in-out infinite;
        }

        @keyframes textPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes textFade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .dashboard-container {
          transition: opacity 0.5s ease;
          opacity: ${loading ? '0.3' : '1'};
          pointer-events: ${loading ? 'none' : 'auto'};
        }

        /* --- Dark Mode Specific Styling (Enhanced with More Glows and Animations) --- */
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #0d0615;
            color: #FFFFFF;
          }

          /* Enhanced Dynamic Background Glows with more positions and color variations */
          .bg-glow {
            position: absolute;
            border-radius: 50%;
            filter: blur(180px);
            opacity: 0.4;
            pointer-events: none;
            z-index: 0;
            animation: bg-move 20s infinite alternate ease-in-out, color-shift 20s infinite linear;
          }

        

          @keyframes bg-move {
            0% { transform: translate(0, 0); }
            50% { transform: translate(30px, -30px); }
            100% { transform: translate(0, 0); }
          }

          @keyframes color-shift {
            0% { background: #7d17b8; }
            33% { background: #0093d9; }
            66% { background: #d91d90; }
            100% { background: #7d17b8; }
          }

          /* Enhanced pulse animation for stat cards with glow */
          .stats-grid .card {
              animation: pulse-glow 3s infinite alternate ease-in-out;
          }
          .stats-grid .card:nth-child(2) { animation-delay: 0.75s; }
          .stats-grid .card:nth-child(3) { animation-delay: 1.5s; }
          .stats-grid .card:nth-child(4) { animation-delay: 2.25s; }

          @keyframes pulse-glow {
              0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
              100% { transform: scale(1.03); box-shadow: 0 8px 24px rgba(66, 165, 245, 0.3); }
          }

          .main-title {
              color: white;
              text-shadow: 0 0 15px rgba(255, 255, 255, 0.3), 0 0 30px rgba(66, 165, 245, 0.2);
              animation: title-glow 5s infinite alternate;
          }

          @keyframes title-glow {
            0% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.3), 0 0 30px rgba(66, 165, 245, 0.2); }
            100% { text-shadow: 0 0 25px rgba(255, 255, 255, 0.5), 0 0 40px rgba(66, 165, 245, 0.4); }
          }

          /* Enhanced Glassmorphism Effect for cards with Dynamic Border Glow */
          .card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            isolation: isolate;
          }

          .card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #7d17b8, #0093d9, #d91d90);
            z-index: -1;
            filter: blur(20px);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .card:hover::before {
            opacity: 0.5;
          }

          .card:hover {
              box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
              border-color: rgba(100, 200, 255, 0.3);
          }

          .muted {
            color: #b0b0b0;
          }

          .stat-value {
            color: #42a5f5;
            text-shadow: 0 0 10px rgba(66, 165, 245, 0.5);
          }

          .error-card {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
            color: #fca5a5;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
          }

          .recommendation-card input {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
            color: #e0e0e0;
          }

          /* New dropdown styling */
          .history-grid select {
            appearance: none; /* removes default browser styling */
            background: linear-gradient(135deg, #7d17b8, #d91d90);
            color: white;
            font-weight: 600;
            border: 2px solid transparent;
            box-shadow: 0 4px 15px rgba(125, 23, 184, 0.4);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .history-grid select:hover {
            box-shadow: 0 6px 20px rgba(125, 23, 184, 0.6);
            transform: translateY(-2px);
          }

          .history-grid select:focus {
            outline: none;
            border-color: #ffd93d;
            box-shadow: 0 0 15px #ffd93d;
          }

          .history-grid select option {
            background-color: #0d0615;
            color: #e0e0e0;
          }

          .predict-btn, .export-btn {
            background: linear-gradient(135deg, #42a5f5, #2196f3);
            box-shadow: 0 4px 15px rgba(66, 165, 245, 0.4);
          }

          .predict-btn:hover, .export-btn:hover {
            background: linear-gradient(135deg, #2196f3, #1d4ed8);
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.6);
            transform: translateY(-2px);
          }

          /* New particles styling and animation */
          .particles-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 1;
          }

          .particle {
            position: absolute;
            border-radius: 50%;
            opacity: 0;
            animation: particle-move linear infinite;
          }

          @keyframes particle-move {
            0% {
              transform: translate(0, 0) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 0.8;
              transform: scale(var(--s-start, 1));
            }
            100% {
              opacity: 0;
              transform: translate(var(--x-end), var(--y-end)) scale(var(--s-end, 0));
            }
          }

          /* Define particle sizes and colors for a vibrant mix */
          .particle:nth-child(5n) { background: #7d17b8; width: 6px; height: 6px; } /* Medium Purple */
          .particle:nth-child(5n+1) { background: #0093d9; width: 8px; height: 8px; } /* Medium Blue */
          .particle:nth-child(5n+2) { background: #d91d90; width: 5px; height: 5px; } /* Medium Pink */
          .particle:nth-child(5n+3) { background: #ffd93d; width: 7px; height: 7px; } /* Medium Yellow */
          .particle:nth-child(5n+4) { background: #ff6b6b; width: 7px; height: 7px; } /* Medium Red */

          /* Adjustments for responsiveness on smaller screens */
          @media (min-width: 1600px) {
            .dashboard-container {
              max-width: 1800px;
              padding: 40px;
            }
          }

          @media (max-width: 1024px) {
            .main-grid {
              grid-template-columns: 1fr;
            }
            .history-grid {
              grid-template-columns: 1fr;
            }
            .dashboard-container {
              padding: 24px;
            }
          }

          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            .backends-grid {
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
            .main-title {
              font-size: 32px;
            }
            .section-title {
              font-size: 24px;
            }
          }
          @media (max-width: 480px) {
            .main-title {
              font-size: 28px;
            }
            .subtitle {
              font-size: 14px;
            }
            .predict-btn, .export-btn {
              margin-left: 0;
              margin-top: 10px;
              width: 100%;
            }
            .history-header {
              flex-direction: column;
              align-items: flex-start;
            }
            .export-button-container {
                flex-direction: column;
            }
          }
        }
      `}</style>
    </>
  );
}
