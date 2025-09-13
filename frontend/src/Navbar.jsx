import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__logo">⚛️ Quantum Job Tracker</div>
      <ul className="navbar__links">
        <li>
          <Link to="/" className="navbar__link">
            Home
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className="navbar__link">
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/hiring" className="navbar__link">
            Hiring
          </Link>
        </li>
      </ul>

      <style jsx>{`
        /* --- Base Styles for All Screens --- */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          position: sticky;
          top: 0;
          z-index: 1000;
          color: #fff;
          background: linear-gradient(135deg, #1f2937 0%, #0c1521 100%);
        }

        .navbar__logo {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05rem;
          text-transform: uppercase;
          color: #60a5fa;
        }

        .navbar__links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          gap: 1.5rem;
        }

        .navbar__link {
          text-decoration: none;
          color: #e2e8f0;
          font-weight: 500;
          font-size: 1rem;
          transition: color 0.3s ease, transform 0.3s ease;
          position: relative;
          padding: 0.5rem 0;
        }

        .navbar__link:hover {
          color: #93c5fd;
          transform: translateY(-2px);
        }

        /* Animated underline on hover */
        .navbar__link::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background-color: #60a5fa;
          transform: scaleX(0);
          transition: transform 0.3s ease-out;
        }

        .navbar__link:hover::after {
          transform: scaleX(1);
        }

        /* --- Mobile Responsiveness --- */
        @media (max-width: 768px) {
          .navbar {
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
          }

          .navbar__logo {
            margin-bottom: 1rem;
          }

          .navbar__links {
            flex-direction: column;
            width: 100%;
            gap: 0.5rem;
          }

          .navbar__link {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 6px;
            background-color: rgba(255, 255, 255, 0.05);
          }

          .navbar__link:hover {
            background-color: rgba(255, 255, 255, 0.1);
            transform: none;
          }

          .navbar__link::after {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
