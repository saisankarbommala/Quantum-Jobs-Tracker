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
        <div className="bg-glow top-left"></div>
        <div className="bg-glow bottom-right"></div>
        <div className="bg-glow center-top"></div>
        <div className="bg-glow center-bottom"></div>
        <div className="bg-glow left-middle"></div>
        <div className="bg-glow right-middle"></div>
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
          background: radial-gradient(circle at center, rgba(13, 6, 21, 0.8), rgba(0, 0, 0, 1));
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
          margin-bottom: 8px;
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
          margin-bottom: 0;
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
          border-color: #6b7280;
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
          background-color: #6b7280;
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
          background: linear-gradient(135deg, #3b82f6, #2563eb);
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
          color: #2563eb;
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
            margin-bottom: 8px;
        }

        .recommendation-card input, .history-grid select {
            width: 100%;
            padding: 10px;
            border-radius: 10px;
            border: 1px so
