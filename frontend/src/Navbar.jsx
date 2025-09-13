import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">⚛️ Quantum Job Tracker</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/hiring">Hiring</Link></li>
        
      </ul>

      <style>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(90deg, #0f172a, #1e293b);
          padding: 16px 32px;
          color: white;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .logo {
          font-size: 22px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 1px;
        }
        .nav-links {
          list-style: none;
          display: flex;
          gap: 24px;
        }
        .nav-links a {
          text-decoration: none;
          color: white;
          font-weight: 500;
          font-size: 16px;
          transition: color 0.3s, transform 0.2s;
        }
        .nav-links a:hover {
          color: #38bdf8;
          transform: scale(1.1);
        }
      `}</style>
    </nav>
  );
}
