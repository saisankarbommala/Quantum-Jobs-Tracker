import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar__logo">⚛️ Quantum Job Tracker</div>

      <div className={`navbar__toggle ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <ul className={`navbar__links ${isOpen ? "open" : ""}`}>
        <li>
          <Link to="/" className="navbar__link" onClick={() => setIsOpen(false)}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/dashboard" className="navbar__link" onClick={() => setIsOpen(false)}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/hiring" className="navbar__link" onClick={() => setIsOpen(false)}>
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
          transition: all 0.3s ease;
        }

        .navbar__logo {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05rem;
          text-transform: uppercase;
          color: #60a5fa;
          z-index: 1001;
        }

        /* --- Navigation Links (Desktop) --- */
        .navbar__links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          gap: 1.5rem;
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
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

        /* --- Mobile Toggle Button --- */
        .navbar__toggle {
          display: none;
          cursor: pointer;
          flex-direction: column;
          gap: 5px;
          z-index: 1001;
        }

        .bar {
          width: 25px;
          height: 3px;
          background-color: #60a5fa;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        /* --- Mobile Styles --- */
        @media (max-width: 768px) {
          .navbar {
            flex-wrap: nowrap;
            justify-content: space-between;
          }

          .navbar__links {
            flex-direction: column;
            width: 50%;
            max-width: 220px;
            text-align: center;
            position: absolute;
            top: 100%;
            right: 0;
            padding: 1rem 0;
            border-top: none;
            transform: translateY(-100%) scaleY(0);
            transform-origin: top;
            opacity: 0;
            pointer-events: none;
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            
            /* Modern Glassmorphism */
            background: transparent; /* Absolutely no background color */
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 0 0 15px 15px;
            
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

            /* Animated Border Effect */
            border: 3px solid transparent;
            border-image: linear-gradient(to right, #00C6FF, #0072FF, #43C6AC) 1;
            animation: moveBorder 6s linear infinite;
          }

          .navbar__links.open {
            transform: translateY(0) scaleY(1);
            opacity: 1;
            pointer-events: all;
          }
          
          .navbar__links li {
            padding: 0.5rem 0;
          }

          .navbar__link {
            display: block;
            width: 80%;
            margin: 0 auto;
            padding: 0.8rem 1rem;
            color: #fff;
            
            /* Glassy Buttons */
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            transition: background 0.3s ease, transform 0.2s ease;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .navbar__link:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-2px);
          }

          .navbar__toggle {
            display: flex;
          }

          /* Hamburger to X transition */
          .navbar__toggle.open .bar:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
          }
          .navbar__toggle.open .bar:nth-child(2) {
            opacity: 0;
          }
          .navbar__toggle.open .bar:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
          }
        }

        /* Keyframes for the moving border animation */
        @keyframes moveBorder {
          0% {
            border-image-source: linear-gradient(0deg, #00C6FF, #0072FF, #43C6AC);
          }
          25% {
            border-image-source: linear-gradient(90deg, #00C6FF, #0072FF, #43C6AC);
          }
          50% {
            border-image-source: linear-gradient(180deg, #00C6FF, #0072FF, #43C6AC);
          }
          75% {
            border-image-source: linear-gradient(270deg, #00C6FF, #0072FF, #43C6AC);
          }
          100% {
            border-image-source: linear-gradient(360deg, #00C6FF, #0072FF, #43C6AC);
          }
        }
      `}</style>
    </nav>
  );
}
