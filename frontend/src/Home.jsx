import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  // animated counters
  const [stats, setStats] = useState({ backends: 0, jobs: 0, uptime: 0 });
  const target = useRef({ backends: 42, jobs: 1280, uptime: 99.9 });

  const particleContainer = useRef(null);

  useEffect(() => {
    const duration = 1800; // Slower duration for a smoother count
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

    // Create qubit particles for universe-like background
    const container = particleContainer.current;
    if (!container) return;

    const numParticles = 100; // More particles for a starry universe feel
    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'qubit-particle';

      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;

      // Random size for variety (like distant stars/qubits)
      // INCREASED PARTICLE SIZE
      const size = Math.random() * 8 + 4; // New size range: 4px to 12px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // Random color from extended palette for different colors
      const colors = ['#00f7ff', '#ff00cc', '#33ff99', '#ff3366', '#66ccff', '#ffcc00', '#9900ff', '#00ff99'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = color;
      particle.style.boxShadow = `0 0 ${size * 2}px ${color}`; // Glow effect for qubit/star feel

      // Random base opacity
      particle.style.opacity = Math.random() * 0.4 + 0.3;

      // Animations: REVOLVE like stars in universe + twinkle
      const revolveDuration = Math.random() * 60 + 40; // 40-100s for a slow revolve
      const twinkleDuration = Math.random() * 3 + 1; // 1-4s for twinkling
      const revolveDelay = Math.random() * -revolveDuration; // Start at random point in animation
      const twinkleDelay = Math.random() * -twinkleDuration;
      particle.style.animation = `revolve ${revolveDuration}s linear ${revolveDelay}s infinite, twinkle ${twinkleDuration}s ease-in-out ${twinkleDelay}s infinite alternate`;

      // Random initial rotation for different paths
      const initialRotation = Math.random() * 360;
      particle.style.transform = `rotate(${initialRotation}deg)`;

      container.appendChild(particle);
    }
  }, []);

  return (
    <div className="home dark-theme">
      {/* 3D Background with uploaded image */}
      <div className="background-3d"></div>

      {/* Floating gradient blobs */}
      <div className="gradient-blob one"></div>
      
      <div className="gradient-blob three"></div>
      

      {/* Qubit particles layer (replacing old particle-layer) */}
      <div className="qubit-particles" ref={particleContainer}></div>

      {/* hero */}
      <section className="hero">
        <h1 className="title">
          Quantum <span className="accent">Job Tracker</span>
        </h1>
        <p className="subtitle">
          Live IBM Quantum queues, predictions & history — beautifully visualized.
        </p>

        <div className="spinner-row">
          <div className="spinner ring" />
          <div className="spinner dots">
            <span /><span /><span /><span />
          </div>
          <div className="spinner pulse" />
        </div>

        <div className="cta">
          <Link to="/dashboard" className="btn primary">Open Dashboard</Link>
          <a href="#features" className="btn ghost">Explore Features</a>
        </div>

        {/* glowing line */}
        <div className="glowing-line"></div>
      </section>

      {/* slider / carousel */}
      <section className="slider" aria-label="Highlights">
        <div className="slides">
          <Slide icon="📊" title="Live Queues" text="Real-time backend load with SSE updates." />
          <Slide icon="⏳" title="Wait Predictions" text="Quick estimates based on historical queues." />
          <Slide icon="📜" title="History" text="Trends over time for smarter scheduling." />
          <Slide icon="🤖" title="Recommendations" text="Best backend for your qubit needs." />
        </div>
      </section>

      {/* stats cards */}
      <section id="features" className="stats">
        <Card label="Active Backends" value={stats.backends} />
        <Card label="Tracked Jobs" value={stats.jobs} />
        <Card label="Uptime" value={`${stats.uptime}%`} />
      </section>

      {/* feature tiles */}
      <section className="tiles">
        <Tile icon="⚡" title="Realtime SSE" text="Instant snapshots streamed from the server." />
        <Tile icon="🧠" title="Smart Picks" text="Min qubits + Max queue filter for best choice." />
        <Tile icon="💾" title="CSV Export" text="Download history for any backend in one click." />
        <Tile icon="🌙" title="Dark-Mode" text="Looks great in both light and dark." />
      </section>

      {/* bottom ticker */}
      <section className="ticker">
        <div className="ticker-inner">
          <span>ibmq_lima: queue 7</span>
          <span>ibmq_belem: queue 14</span>
          <span>simulator: queue 0</span>
          <span>ibmq_quito: queue 5</span>
          <span>ibmq_manila: queue 9</span>
        </div>
      </section>

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
          --bg: #02020a;
          --text: #e6e6ff;
          --card: #0a0a1a;
          --border: #1c1c30;
          --shadow: rgba(0,0,0,0.7);
          --glow-light: rgba(255, 255, 255, 0.1);
        }

        body {
          margin: 0;
          padding: 0;
        }

        .home {
          position: relative;
          min-height: 100vh;
          padding: 72px 24px 48px;
          background: var(--bg);
          color: var(--text);
          font-family: 'Space Grotesk', sans-serif;
          overflow: hidden;
          transition: background 0.5s ease;
        }

        /* 3D Background with uploaded image */
        .background-3d {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwkHBgoJCAkLCwoMDxkQCg8N...') no-repeat center center; /* Replace with actual base64 image data */
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

        /* Dynamic Grid Background */
        .glowing-grid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            linear-gradient(to right, rgba(0,247,255,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,247,255,0.15) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-move 15s linear infinite, grid-glow 6s ease-in-out infinite alternate;
          opacity: 0.2;
          z-index: 1;
          pointer-events: none;
        }

        @keyframes grid-move {
          from { background-position: 0 0; }
          to { background-position: 60px 60px; }
        }

        @keyframes grid-glow {
          0% { background-image: 
            linear-gradient(to right, rgba(0,247,255,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,247,255,0.15) 1px, transparent 1px); }
          50% { background-image: 
            linear-gradient(to right, rgba(255,0,204,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,0,204,0.15) 1px, transparent 1px); }
          100% { background-image: 
            linear-gradient(to right, rgba(51,255,153,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51,255,153,0.15) 1px, transparent 1px); }
        }

        /* Gradient Blobs */
        .gradient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.1;
          animation: blob-float 20s ease-in-out infinite alternate, blob-glow 10s ease-in-out infinite;
          z-index: 2;
        }

        .gradient-blob.one { 
          background: cyan; 
          width: 600px; 
          height: 600px; 
          top: -150px; 
          left: -150px; 
          animation-delay: 0s; 
        }
        .gradient-blob.two { 
          background: linear-gradient(45deg, var(--c2), var(--c4)); 
          width: 650px; 
          height: 650px; 
          bottom: -200px; 
          right: -200px; 
          animation-delay: 5s; 
        }
        .gradient-blob.three { 
          background: linear-gradient(90deg, var(--c3), var(--c2)); 
          width: 500px; 
          height: 500px; 
          top: 10%; 
          right: 5%; 
          animation-delay: 10s; 
        }
        .gradient-blob.four { 
          background: linear-gradient(-45deg, var(--c4), var(--c1)); 
          width: 550px; 
          height: 550px; 
          bottom: 5%; 
          left: 5%; 
          animation-delay: 15s; 
        }

        @keyframes blob-float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(80px, -80px) scale(1.15); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes blob-glow {
          0% { opacity: 0.5; filter: blur(120px); }
          50% { opacity: 0.7; filter: blur(140px); }
          100% { opacity: 0.5; filter: blur(120px); }
        }

        /* Qubit Particles (stars in universe) */
        .qubit-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          pointer-events: none;
        }

        .qubit-particle {
          position: absolute;
          border-radius: 50%;
          will-change: transform, opacity;
        }

        /* NEW KEYFRAMES FOR REVOLVING EFFECT */
        @keyframes revolve {
          0% { transform: rotate(0deg) translateX(50vh) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(50vh) rotate(-360deg); }
        }
        /* END NEW KEYFRAMES */

        @keyframes twinkle {
          from { opacity: 0.3; }
          to { opacity: 0.8; }
        }

        /* Hero */
        .hero { text-align: center; position: relative; z-index: 4; padding-top: 50px; }
        .title {
          font-size: clamp(52px, 9vw, 80px);
          font-weight: 700;
          letter-spacing: -0.04em;
          margin: 0 0 12px;
          animation: fadeDown 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
        .accent { 
          background: linear-gradient(90deg, var(--c1), var(--c2), var(--c3), var(--c4), var(--c5));
          -webkit-background-clip: text; 
          background-clip: text; 
          color: transparent; 
        }
        .subtitle {
          font-size: clamp(20px, 2.8vw, 24px);
          opacity: 0.8;
          margin: 0 auto 40px;
          max-width: 900px;
          animation: fadeUp 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both 0.2s;
        }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-30px) } to { opacity: 1; transform: none } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: none } }

        /* Spinners */
        .spinner-row { display: flex; gap: 36px; justify-content: center; align-items: center; margin: 30px 0 50px; }
        .spinner { width: 70px; height: 70px; position: relative; }
        .ring { border: 10px solid #1a1a30; border-top-color: var(--c1); border-radius: 50%; animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite; }
        @keyframes spin { to { transform: rotate(360deg) } }

        .dots { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .dots span { width: 14px; height: 14px; background: var(--c3); border-radius: 999px; opacity: 0.7; animation: bounce 1.5s infinite; }
        .dots span:nth-child(2) { animation-delay: 0.15s }
        .dots span:nth-child(3) { animation-delay: 0.3s }
        .dots span:nth-child(4) { animation-delay: 0.45s }
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.7 } 50% { transform: translateY(-10px); opacity: 1 } }

        .pulse::before, .pulse::after {
          content: ""; position: absolute; inset: 0; border-radius: 50%; border: 5px solid rgba(0,247,255,0.6);
          animation: ripple 2.5s ease-out infinite;
        }
        .pulse::after { animation-delay: 1.25s; }
        @keyframes ripple { from { transform: scale(0.1); opacity: 0.8 } to { transform: scale(1); opacity: 0 } }

        /* Buttons */
        .cta { display: flex; gap: 24px; justify-content: center; margin-top: 12px; }
        .btn {
          padding: 16px 30px; border-radius: 16px; text-decoration: none; font-weight: 700; letter-spacing: 1px;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.3s ease, color 0.3s ease;
          border: 1px solid var(--border);
          display: inline-flex; align-items: center; gap: 12px;
        }
        .btn.primary {
          background: linear-gradient(90deg, var(--c1), var(--c2));
          color: #fff; border: none; box-shadow: 0 15px 30px rgba(0,0,0,0.5);
        }
        .btn.primary:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .btn.ghost { color: var(--text); background: #15151e; }
        .btn.ghost:hover { background: #20202a; transform: translateY(-6px); }

        /* Glowing Line */
        .glowing-line {
          width: 80%;
          height: 4px;
          background: linear-gradient(90deg, transparent, var(--c3), var(--c4), var(--c5), transparent);
          margin: 70px auto 0;
          filter: blur(5px);
          opacity: 0.8;
          animation: glow-line 5s ease-in-out infinite alternate;
        }
        @keyframes glow-line {
          from { transform: scaleX(0.1); opacity: 0.5; }
          to { transform: scaleX(1); opacity: 1; }
        }

        /* Slider */
        .slider {
          position: relative; margin: 60px auto 30px; width: min(1200px, 94vw);
          overflow: hidden; border-radius: 30px;
          border: 1px solid var(--border);
          background: var(--card);
          box-shadow: 0 20px 50px var(--shadow);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .slides { display: flex; width: 400%; animation: slide 25s infinite; }
        @keyframes slide {
          0%, 18% { transform: translateX(0%) }
          23%, 41% { transform: translateX(-100%) }
          46%, 64% { transform: translateX(-200%) }
          69%, 87% { transform: translateX(-300%) }
          92%, 100% { transform: translateX(0%) }
        }
        .slide {
          flex: 1 0 100%; padding: 45px 36px; display: grid; grid-template-columns: 80px 1fr; gap: 20px; align-items: center;
        }
        .slide:not(:last-child) { border-right: 1px solid var(--border); }
        .slide .ic {
          width: 70px; height: 70px; border-radius: 20px; display: flex; justify-content: center; align-items: center; font-size: 36px;
          background: var(--glow-light);
          border: 1px solid var(--border);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          color: var(--c1);
          transform: scale(1);
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .slide:hover .ic { transform: scale(1.05); }
        .slide h3 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
        .slide p { margin: 6px 0 0; opacity: 0.7; font-size: 18px; line-height: 1.5; }

        /* Stats Cards */
        .stats {
          margin: 40px auto; width: min(1300px, 94vw);
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 24px;
        }
        .card {
          background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 30px 32px;
          box-shadow: 0 15px 30px var(--shadow);
          transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .card::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 24px;
          background: linear-gradient(45deg, var(--c1), var(--c2), var(--c3));
          opacity: 0;
          z-index: -1;
          transition: opacity 0.4s ease;
          animation: rotate-border 4s linear infinite;
        }
        .card:hover::before { opacity: 1; }
        .card:hover { transform: translateY(-8px); box-shadow: 0 25px 40px rgba(0,0,0,0.7); }
        .label { font-size: 14px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.5; margin-bottom: 8px; }
        .value { font-size: 36px; font-weight: 700; letter-spacing: 1px; color: var(--c1); text-shadow: 0 0 5px rgba(0,247,255,0.5); }

        /* Feature Tiles */
        .tiles {
          margin: 20px auto 50px; width: min(1300px, 94vw);
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;
        }
        .tile {
          background: var(--card);
          border: 1px solid var(--border); border-radius: 26px; padding: 25px;
          display: grid; grid-template-columns: 60px 1fr; gap: 20px; align-items: flex-start;
          transition: transform 0.4s ease, background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
          box-shadow: 0 10px 25px var(--shadow);
          position: relative;
          overflow: hidden;
        }
        .tile::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 26px;
          background: linear-gradient(45deg, var(--c2), var(--c3), var(--c4));
          opacity: 0;
          z-index: -1;
          transition: opacity 0.4s ease;
          animation: rotate-border 4s linear infinite;
        }
        .tile:hover::before { opacity: 1; }
        .tile:hover { 
          transform: translateY(-7px); 
          border-color: var(--c2); 
          background: rgba(255,0,204,0.1); 
          box-shadow: 0 15px 30px rgba(0,0,0,0.7);
        }
        .tile .ico { 
          width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px;
          background: var(--glow-light);
          border: 1px solid var(--border);
          color: var(--c2);
          transform: scale(1);
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .tile:hover .ico { transform: scale(1.05); }
        .tile h4 { margin: 0; font-size: 22px; font-weight: 700; }
        .tile p { margin: 8px 0 0; opacity: 0.65; font-size: 16px; line-height: 1.5; }

        @keyframes rotate-border {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Bottom Ticker */
        .ticker { 
          overflow: hidden; width: 100%; margin-top: 30px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); 
          background: var(--card);
          box-shadow: 0 -8px 20px var(--shadow);
        }
        .ticker-inner { 
          display: inline-flex; gap: 40px; padding: 15px 0; min-width: 200%;
          animation: marquee 30s linear infinite;
          font-size: 16px;
          font-weight: 500;
          color: var(--text);
          opacity: 0.8;
          animation: marquee 30s linear infinite, ticker-pulse 2s ease-in-out infinite alternate;
        }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes ticker-pulse {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }

        @media (max-width: 720px) {
          .slide { grid-template-columns: 50px 1fr; padding: 30px 24px; }
          .slide .ic { width: 50px; height: 50px; font-size: 28px; }
          .stats { grid-template-columns: 1fr; }
          .tiles { grid-template-columns: 1fr; }
          .glowing-line { width: 90%; }
        }
      `}</style>
    </div>
  );
}

/* ---------- tiny sub components ---------- */

function Slide({ icon, title, text }) {
  return (
    <div className="slide">
      <div className="ic">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function Tile({ icon, title, text }) {
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