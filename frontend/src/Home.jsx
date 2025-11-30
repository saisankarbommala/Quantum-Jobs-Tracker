import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Small component for the stats cards
function Card({ label, value }) {
  // NOTE: The Card component structure is kept clean here. Styling controls the box effects.
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

// Small component for the feature tiles
function Tile({ icon, title, text }) {
  // NOTE: The Tile component structure is kept clean here. Styling controls the box effects.
  return (
    <div className="tile">
      <div className="ico">{icon}</div>
      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function Home() {
  // Animated counters state
  const [stats, setStats] = useState({ backends: 0, jobs: 0, uptime: 0 });
  const target = useRef({ backends: 3, jobs: 12390, uptime: 99.9 });

  const particleContainer = useRef(null);

  useEffect(() => {
    // Stat Counter Animation Logic
    const duration = 1800;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setStats({
        backends: Math.round(target.current.backends * p),
        jobs: Math.round(target.current.jobs * p),
        uptime: +(target.current.uptime * p).toFixed(1),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Qubit Particle Animation Logic (Universe-like background) - REMOVED
    // The code block that created and appended 'qubit-particle' elements has been removed.
    // The element remains in JSX but will be empty due to effect removal.
  }, []);

  return (
    <div className="home dark-theme">
      {/* 3D Background */}
      <div className="background-3d"></div>

      {/* Qubit particles layer (stars) - Logic removed, so this is now empty. */}
      <div className="qubit-particles" ref={particleContainer}></div>

      {/* Hero Section */}
      <section className="hero">
        <h1 className="title">
          Quantum <span className="accent">Job Tracker</span>
        </h1>
        <p className="subtitle">
          Live IBM Quantum queues, predictions & history — beautifully visualized.
        </p>

        {/* Animated Spinners - KEPT */}
        <div className="spinner-row">
          <div className="spinner ring" />
          <div className="spinner dots">
            <span /><span /><span /><span />
          </div>
          <div className="spinner pulse" />
        </div>

        {/* CTA Buttons */}
        <div className="cta">
          <Link to="/dashboard" className="btn primary">Open Dashboard</Link>
          <a href="#features" className="btn ghost">Explore Features</a>
        </div>

        {/* Glowing Divider Line */}
        <div className="glowing-line"></div>
      </section>

      {/* Stats Cards - Box "Sliders" (animated borders) removed via CSS */}
      <section id="features" className="stats">
        <Card label="Active Backends" value={stats.backends} />
        <Card label="Tracked Jobs" value={stats.jobs} />
        <Card label="Uptime" value={`${stats.uptime}%`} />
      </section>

      {/* Feature Tiles - Box "Sliders" (animated borders) removed via CSS */}
      <section className="tiles">
        <Tile icon="⚡" title="Realtime SSE" text="Instant snapshots streamed from the server." />
        <Tile icon="🧠" title="Smart Picks" text="Min qubits + Max queue filter for best choice." />
        <Tile icon="💾" title="CSV Export" text="Download history for any backend in one click." />
        <Tile icon="🌙" title="Dark-Mode" text="Looks great in both light and dark." />
      </section>

      {/* Bottom Ticker (Live Status) */}
      

      {/* FOOTER SECTION */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-col brand">
            <h4 className="footer-title">Quantum <span className="accent">Job Tracker</span></h4>
            <p>Visualizing the future of quantum queue times.</p>
            <div className="social-links">
                {/* Placeholder links with Q-theme icons */}
                <a href="#github" aria-label="GitHub">⚛️</a>
                <a href="#twitter" aria-label="Twitter">🐦</a>
                <a href="#linkedin" aria-label="LinkedIn">🔗</a>
            </div>
          </div>
          <div className="footer-col">
            <h5>Features</h5>
            <ul>
              <li><a href="#">Live Queues</a></li>
              <li><a href="#">Predictions</a></li>
              <li><a href="#">History</a></li>
              <li><a href="#">Smart Picks</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Resources</h5>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Status</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contact Support</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
              <li><a href="#">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} Quantum Job Tracker. Built for the Quantum Community.
        </div>
      </footer>


      {/* ========================================================================
          STYLES (CSS) - Updated (Subtle Indigo Gradient Hover Effect)
          ======================================================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');

        :root { 
          --c1: #00f7ff; /* Electric Blue */
          --c2: #ff00cc; /* Neon Pink */
          --c3: #33ff99; /* Lime Green */
          --c4: #ff3366; /* Coral Pink */
          --c5: #66ccff; /* Sky Blue */
        }

        .dark-theme {
          --bg: #100628; /* Dark Indigo Background */
          --text: #e6e6ff;
          --card: #180a3a; /* Darker Indigo Card */
          --border: #301850; /* Indigo Border */
          --shadow: rgba(0,0,0,0.7);
          --glow-light: rgba(255, 255, 255, 0.1);
          /* NEW SUBTLE INDIGO GRADIENT HOVER BG */
          --indigo-hover-bg: linear-gradient(135deg, #1f0b4d, #160738); 
        }

        body {
          margin: 0;
          padding: 0;
        }

        .home {
          position: relative;
          min-height: 100vh;
          /* REDUCED PADDING: 72px 24px 48px -> 40px 16px 20px */
          padding: 40px 16px 20px;
          background: var(--bg);
          color: var(--text);
          font-family: 'Space Grotesk', sans-serif;
          overflow: hidden;
          transition: background 0.5s ease;
        }

        /* 3D Background */
        .background-3d {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          /* NOTE: Placeholder for Base64 Image */
          /* background: url('data:image/jpeg;base64,...') no-repeat center center; */
          background-size: cover;
          transform-style: preserve-3d;
          transform: perspective(1000px) rotateX(10deg) rotateY(-10deg) scale(1.1);
          opacity: 0.5;
          z-index: 0;
          animation: rotate3d 20s infinite linear;
        }
        @keyframes rotate3d {
          0% { transform: perspective(1000px) rotateX(10deg) rotateY(-10deg) scale(1.1); }
          50% { transform: perspective(1000px) rotateX(-10deg) rotateY(10deg) scale(1.1); }
          100% { transform: perspective(1000px) rotateX(10deg) rotateY(-10deg) scale(1.1); }
        }

        /* Qubit Particles (stars in universe) - REMOVED CSS for particle animation */
        .qubit-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          pointer-events: none;
        }
        /* .qubit-particle, @keyframes revolve, @keyframes twinkle are removed */

        /* Hero */
        .hero { 
          text-align: center; 
          position: relative; 
          z-index: 4; 
          /* REDUCED PADDING: 50px -> 30px */
          padding-top: 30px; 
        }
        .title {
          font-size: clamp(52px, 9vw, 80px);
          font-weight: 700;
          letter-spacing: -0.04em;
          margin: 0 0 8px; /* Reduced margin */
          animation: fadeDown 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .accent { 
          background: linear-gradient(90deg);
          -webkit-background-clip: text; 
          background-clip: text; 
          color: cyan; 
        }
        .subtitle {
          font-size: clamp(20px, 2.8vw, 24px);
          opacity: 0.8;
          /* REDUCED MARGIN: 40px -> 25px */
          margin: 0 auto 25px;
          max-width: 900px;
          animation: fadeUp 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both 0.2s;
        }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-30px) } to { opacity: 1; transform: none } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: none } }

        /* Spinners - KEPT CSS */
        .spinner-row { display: flex; gap: 24px; justify-content: center; align-items: center; margin: 20px 0 30px; } /* Reduced gap and margin */
        .spinner { width: 60px; height: 60px; position: relative; } /* Slightly reduced size */
        .ring { border: 8px solid #1a1a30; border-top-color: var(--c1); border-radius: 50%; animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }

        .dots { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .dots span { width: 12px; height: 12px; background: var(--c3); border-radius: 999px; opacity: 0.7; animation: bounce 1.5s infinite; }
        .dots span:nth-child(2) { animation-delay: 0.15s }
        .dots span:nth-child(3) { animation-delay: 0.3s }
        .dots span:nth-child(4) { animation-delay: 0.45s }
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.7 } 50% { transform: translateY(-8px); opacity: 1 } }

        .pulse::before, .pulse::after {
          content: ""; position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgba(0,247,255,0.6);
          animation: ripple 2.5s ease-out infinite;
        }
        .pulse::after { animation-delay: 1.25s; }
        @keyframes ripple { from { transform: scale(0.1); opacity: 0.8 } to { transform: scale(1); opacity: 0 } }

        /* Buttons */
        .cta { display: flex; gap: 16px; justify-content: center; margin-top: 8px; } /* Reduced gap and margin */
        .btn {
          /* REDUCED PADDING: 16px 30px -> 14px 24px */
          padding: 14px 24px; 
          border-radius: 12px; 
          text-decoration: none; 
          font-weight: 700; 
          letter-spacing: 1px;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.3s ease, color 0.3s ease;
          border: 1px solid var(--border);
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn.primary {
          background: linear-gradient(90deg, var(--c1), var(--c2));
          color: #fff; border: none; box-shadow: 0 10px 20px rgba(0,0,0,0.5); /* Reduced shadow */
        }
        .btn.primary:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.6); }
        .btn.ghost { color: var(--text); background: #15151e; }
        .btn.ghost:hover { background: #20202a; transform: translateY(-4px); }

        /* Glowing Line */
        .glowing-line {
          width: 80%;
          height: 3px; /* Slightly reduced height */
          background: linear-gradient(90deg, transparent, var(--c1), var(--c2), var(--c5), transparent); /* Adjusted colors for better glow */
          /* REDUCED MARGIN: 70px auto 0 -> 40px auto 0 */
          margin: 40px auto 0;
          filter: blur(4px);
          opacity: 0.8;
          animation: glow-line 5s ease-in-out infinite alternate;
        }
        @keyframes glow-line {
          from { transform: scaleX(0.1); opacity: 0.5; }
          to { transform: scaleX(1); opacity: 1; }
        }

        /* Stats Cards - Subtle Indigo Gradient Hover Effect */
        .stats {
          /* REDUCED MARGIN: 40px auto -> 25px auto */
          margin: 25px auto; width: min(1300px, 94vw);
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); 
          gap: 16px; /* Reduced gap */
        }
        .card {
          background: var(--card); border: 1px solid var(--border); border-radius: 20px; 
          /* REDUCED PADDING: 30px 32px -> 20px 24px */
          padding: 20px 24px;
          box-shadow: 0 10px 20px var(--shadow); /* Reduced shadow */
          transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease, background 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        /* Custom Indigo Gradient Hover Effect for Cards */
        .card:hover { 
          transform: translateY(-4px); 
          /* APPLY SUBTLE INDIGO GRADIENT */
          border-color: var(--c5); /* Subtle Sky Blue border glow */
          background: var(--indigo-hover-bg); 
          box-shadow: 0 15px 30px rgba(0,0,0,0.6); 
          /* Removed backdrop-filter */
        }
        .card:hover .value {
          /* Subtle Text Glow Effect */
          color: var(--c1);
          text-shadow: 0 0 8px rgba(0, 247, 255, 0.8);
          background: none; 
          -webkit-background-clip: unset; 
          background-clip: unset; 
        }
        .label { font-size: 13px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.5; margin-bottom: 4px; } /* Reduced margin */
        .value { font-size: 32px; font-weight: 700; letter-spacing: 1px; color: var(--c1); text-shadow: 0 0 5px rgba(0,247,255,0.5); }

        /* Feature Tiles - Subtle Indigo Gradient Hover Effect */
        .tiles {
          /* REDUCED MARGIN: 20px auto 50px -> 15px auto 30px */
          margin: 15px auto 30px; 
          width: min(1300px, 94vw);
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
          gap: 16px; /* Reduced gap */
        }
        .tile {
          background: var(--card);
          border: 1px solid var(--border); 
          border-radius: 20px; /* Reduced border radius */
          /* REDUCED PADDING: 25px -> 18px */
          padding: 18px;
          display: grid; grid-template-columns: 50px 1fr; /* Slightly reduced icon column width */
          gap: 15px; /* Reduced gap */
          align-items: flex-start;
          transition: transform 0.4s ease, background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
          box-shadow: 0 8px 20px var(--shadow); /* Reduced shadow */
          position: relative;
          overflow: hidden;
        }
        /* Custom Indigo Gradient Hover Effect for Tiles */
        .tile:hover { 
          transform: translateY(-3px); /* Reduced hover lift */
          /* APPLY SUBTLE INDIGO GRADIENT */
          border-color: var(--c5); /* Subtle Sky Blue border glow */
          background: var(--indigo-hover-bg); 
          box-shadow: 0 10px 20px rgba(0,0,0,0.7);
          /* Removed backdrop-filter */
        }
        .tile .ico { 
          width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;
          background: var(--glow-light);
          border: 1px solid var(--border);
          color: var(--c2);
          transform: scale(1);
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .tile:hover .ico { 
          transform: scale(1.02); 
          /* Subtle Icon Hover Effect */
          background: var(--glow-light); 
          color: var(--c1); /* Use Electric Blue */
          border-color: var(--c1);
          box-shadow: 0 0 10px rgba(0, 247, 255, 0.5);
        }
        .tile h4 { margin: 0; font-size: 20px; font-weight: 700; }
        .tile p { margin: 4px 0 0; opacity: 0.65; font-size: 15px; line-height: 1.4; } /* Reduced margin and line-height */

        /* Bottom Ticker */
        .ticker { 
          overflow: hidden; width: 100%; 
          margin-top: 20px; /* Reduced margin */
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); 
          background: var(--card);
          box-shadow: 0 -6px 15px var(--shadow); /* Reduced shadow */
        }
        .ticker-inner { 
          display: inline-flex; 
          gap: 30px; /* Reduced gap */
          padding: 12px 0; /* Reduced padding */
          min-width: 200%;
          animation: marquee 30s linear infinite, ticker-pulse 2s ease-in-out infinite alternate;
          font-size: 15px;
          font-weight: 500;
          color: var(--text);
          opacity: 0.8;
        }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes ticker-pulse {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }

        /* FOOTER STYLES */
        .footer {
          width: 100%;
          /* REDUCED MARGIN: 80px -> 40px */
          margin-top: 40px;
          /* REDUCED PADDING: 40px 0 20px -> 30px 0 15px */
          padding: 30px 0 15px;
          background: var(--card); /* Darker background */
          border-top: 2px solid var(--border);
          box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.4); /* Reduced shadow */
          position: relative;
        }

        .footer::before {
          content: "";
          position: absolute;
          top: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--c1), transparent);
          filter: blur(1px);
        }

        .footer-content {
          width: min(1300px, 94vw);
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px; /* Reduced gap */
          padding-bottom: 30px; /* Reduced padding */
        }

        .footer-col {
          padding: 0 5px; /* Reduced padding */
        }

        .footer-title {
          font-size: 22px; /* Slightly reduced size */
          font-weight: 700;
          margin-bottom: 10px; /* Reduced margin */
        }

        .footer-col h5 {
          color: var(--c3); /* Lime Green for headings */
          font-size: 16px; /* Slightly reduced size */
          margin-bottom: 15px; /* Reduced margin */
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer-col p {
          font-size: 13px; /* Slightly reduced size */
          opacity: 0.7;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-col ul li {
          margin-bottom: 8px; /* Reduced margin */
        }

        .footer-col ul li a {
          color: var(--text);
          text-decoration: none;
          font-size: 15px; /* Slightly reduced size */
          opacity: 0.8;
          transition: color 0.3s, opacity 0.3s;
        }

        .footer-col ul li a:hover {
          color: var(--c1);
          opacity: 1;
          text-shadow: 0 0 5px var(--c1);
        }

        .social-links {
            margin-top: 15px; /* Reduced margin */
            display: flex;
            gap: 12px; /* Reduced gap */
        }

        .social-links a {
            font-size: 20px; /* Slightly reduced size */
            color: var(--c5);
            transition: transform 0.3s;
            text-decoration: none;
        }

        .social-links a:hover {
            transform: translateY(-2px) scale(1.1);
            color: var(--c1);
            text-shadow: 0 0 10px var(--c1);
        }

        .copyright {
          width: min(1300px, 94vw);
          margin: 0 auto;
          text-align: center;
          padding-top: 15px; /* Reduced padding */
          border-top: 1px solid var(--border);
          font-size: 11px; /* Slightly reduced size */
          opacity: 0.5;
        }

        /* MEDIA QUERIES (Responsiveness) */
        @media (max-width: 900px) {
          .footer-content {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 500px) {
          .footer-content {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .footer-col.brand {
            padding-bottom: 15px; /* Reduced padding */
            border-bottom: 1px solid var(--border);
            margin-bottom: 15px; /* Reduced margin */
          }
          .social-links {
            justify-content: center;
          }

          /* General Mobile Adjustments */
          .stats { grid-template-columns: 1fr; gap: 12px; margin: 15px auto; } /* Reduced gap/margin */
          .tiles { grid-template-columns: 1fr; gap: 12px; margin: 10px auto 20px; } /* Reduced gap/margin */
          .glowing-line { width: 90%; margin-top: 30px; }
        }
      `}</style>
    </div>
  );
}
