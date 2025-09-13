import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import emailjs from 'emailjs-com';
import Navbar from './Navbar.jsx';
export default function App() {
  const [showDashboard, setShowDashboard] = useState(true);
  const [jobs, setJobs] = useState(() => {
    try {
      const savedJobs = localStorage.getItem('quantumJobs');
      return savedJobs ? JSON.parse(savedJobs) : [];
    } catch (error) {
      console.error('Failed to load jobs from localStorage:', error);
      return [];
    }
  });
  const [jobName, setJobName] = useState('');
  const [backend, setBackend] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const availableBackends = ['ibmq_qasm_simulator', 'ibmq_lima', 'ibmq_belem', 'ibmq_quito'];

  const statusColors = {
    Submitted: '#00ffff',
    'In Progress': '#ff00ff',
    Completed: '#00ff7f',
    Failed: '#ff4500',
  };

  const particlesInit = useCallback(async (main) => {
    await loadFull(main);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setJobs((prevJobs) =>
        prevJobs.map((job) => {
          if (job.status === 'Submitted') {
            return { ...job, status: 'In Progress' };
          }
          if (job.status === 'In Progress') {
            const random = Math.random();
            const newStatus = random > 0.5 ? 'Completed' : 'Failed';
            const templateParams = {
              jobName: job.name,
              backend: job.backend,
              date: job.date,
              status: newStatus,
              shots: job.shots,
              qubits: job.qubits,
            };
            emailjs
              .send(
                "service_2bnlwla",
                "template_rxnim69",
                templateParams,
                "2bld951XHtLm-xdEc"
              )
              .then((response) => {
                console.log(`✅ Status update email sent for ${newStatus}!`, response.status, response.text);
              })
              .catch((err) => {
                console.error(`❌ Failed to send status update email for ${newStatus}:`, err);
              });
            return { ...job, status: newStatus };
          }
          return job;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('quantumJobs', JSON.stringify(jobs));
  }, [jobs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobName || !backend) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const successRate = Math.floor(Math.random() * 101);
      const gateCounts = [
        { name: 'Hadamard', count: Math.floor(Math.random() * 50) + 10 },
        { name: 'CNOT', count: Math.floor(Math.random() * 30) + 5 },
        { name: 'Pauli-X', count: Math.floor(Math.random() * 40) + 8 },
        { name: 'T-Gate', count: (Math.random() * 20) + 2 },
      ];
      const newJob = {
        id: Date.now(),
        name: jobName,
        backend,
        shots: 1024,
        date: new Date().toLocaleString(),
        status: 'Submitted',
        successRate,
        gateCounts,
        qubits: 5,
        executionTime: `${(Math.random() * 2 + 1).toFixed(2)}s`,
      };
      setJobs((prev) => [newJob, ...prev]);

      const templateParams = {
        jobName: newJob.name,
        backend: newJob.backend,
        date: newJob.date,
        status: newJob.status,
        shots: newJob.shots,
        qubits: newJob.qubits,
      };

      emailjs
        .send(
          "service_2bnlwla",
          "template_rxnim69",
          templateParams,
          "2bld951XHtLm-xdEc"
        )
        .then((response) => {
          console.log("✅ Submission email sent successfully!", response.status, response.text);
        })
        .catch((err) => {
          console.error("❌ Failed to send submission email:", err);
        });

      setJobName('');
      setBackend('');
      setLoading(false);
    }, 1200);
  };

  const handleJobClick = (job) => {
    if (job.status === 'Completed' || job.status === 'Failed') {
      setSelectedJob(job);
      setShowStatusModal(true);
    } else {
      setSelectedJob(job);
    }
  };

  const handleViewDetails = () => {
    setShowStatusModal(false);
    setShowDashboard(false);
    setSelectedJob((prev) => ({ ...prev }));
  };

  const handleDownload = () => {
    const jobData = JSON.stringify(selectedJob, null, 2);
    const blob = new Blob([jobData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedJob.name}_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSelectedJob(null);
    setShowStatusModal(false);
  };

  const handleCancel = () => {
    setSelectedJob(null);
    setShowStatusModal(false);
  };

  const handleDelete = () => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== selectedJob.id));
    setSelectedJob(null);
    setShowStatusModal(false);
  };

  const handleBackToDashboard = () => {
    setSelectedJob(null);
    setShowStatusModal(false);
    setShowDashboard(true);
  };

  const getPieChartData = (successRate) => [
    { name: 'Success', value: successRate, color: '#00ff7f' },
    { name: 'Failure', value: 100 - successRate, color: '#ff4500' },
  ];

  const renderJobDetails = () => {
    if (!selectedJob) return null;
    const pieData = getPieChartData(selectedJob.successRate);
    return (
      <motion.div
        className="job-details-panel"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <div className="job-details-header">
          <div>
            <h2 className="job-title">Job: {selectedJob.name}</h2>
            <p className="job-subtitle">Submitted on {selectedJob.date} on {selectedJob.backend}</p>
          </div>
          <div className="header-buttons">
            <motion.button
              className="back-button"
              onClick={handleBackToDashboard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back to Dashboard
            </motion.button>
            <button className="close-button" onClick={() => setSelectedJob(null)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="job-details-grid">
          <div className="info-card">
            <h3 className="card-title">Job Status</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: statusColors[selectedJob.status] }}
                  >
                    {selectedJob.status}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Qubits</span>
                <span className="info-value">{selectedJob.qubits}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Shots</span>
                <span className="info-value">{selectedJob.shots.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Execution Time</span>
                <span className="info-value">{selectedJob.executionTime}</span>
              </div>
            </div>
          </div>
          <div className="info-card">
            <h3 className="card-title">Success Rate</h3>
            <div className="chart-container">
              <ResponsiveContainer width="95%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="info-card job-details-full-width">
            <h3 className="card-title">Gate Counts</h3>
            <div className="chart-container-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedJob.gateCounts} margin={{ top: 5, right: 30, left: 20, bottom: 5, }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c3445" />
                  <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} angle={-45} textAnchor="end" />
                  <YAxis stroke="#a8a29e" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(10, 3, 17, 0.9)',
                      border: '1px solid #00ffff',
                      borderRadius: '8px',
                      boxShadow: '0 0 10px rgba(0, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                    }}
                    itemStyle={{ color: '#00ffff' }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[10, 10, 0, 0]}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {selectedJob.gateCounts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#gradient-${entry.name.replace(/\s+/g, '')})`}
                      />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="gradient-Hadamard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00bcd4" />
                      <stop offset="100%" stopColor="#00838f" />
                    </linearGradient>
                    <linearGradient id="gradient-CNOT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e91e63" />
                      <stop offset="100%" stopColor="#ad1457" />
                    </linearGradient>
                    <linearGradient id="gradient-Pauli-X" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4caf50" />
                      <stop offset="100%" stopColor="#1b5e20" />
                    </linearGradient>
                    <linearGradient id="gradient-T-Gate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8a2be2" />
                      <stop offset="100%" stopColor="#4b0082" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStatusModal = () => {
    if (!selectedJob) return null;
    const isCompleted = selectedJob.status === 'Completed';
    const message = isCompleted
      ? "Job has been successfully completed."
      : "Job execution has failed. Review the logs for details.";

    return (
      <motion.div
        className="status-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <div className="status-icon">
          {isCompleted ? '✅' : '❌'}
        </div>
        <h2 className="status-title">Job {isCompleted ? 'Completed' : 'Failed'}</h2>
        <p className="status-message">{message}</p>
        <div className="status-actions">
          <motion.button
            className="action-button view-button"
            onClick={handleViewDetails}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Details
          </motion.button>
          <motion.button
            className="action-button download-button"
            onClick={handleDownload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Download Report
          </motion.button>
          <motion.button
            className="action-button cancel-button"
            onClick={handleCancel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            className="action-button delete-button"
            onClick={handleDelete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Delete
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const jobSummary = jobs.reduce(
    (acc, job) => {
      acc.total++;
      if (job.status === 'Submitted' || job.status === 'In Progress') acc.queued++;
      if (job.status === 'In Progress') acc.running++;
      if (job.status === 'Completed') acc.completed++;
      if (job.status === 'Failed') acc.failed++;
      return acc;
    },
    { total: 0, queued: 0, running: 0, completed: 0, failed: 0 }
  );

  const filteredJobs = jobs.filter(job =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.backend.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;700&display=swap');
        
        :root {
          --bg-color: #0d001a;
          --card-bg-light: rgba(18, 5, 30, 0.6);
          --card-bg-dark: rgba(10, 3, 17, 0.8);
          --border-color: rgba(66, 73, 90, 0.4);
          --text-color-primary: #e0e0e0;
          --text-color-secondary: #a8a29e;
          --accent-color-gold: #e6be8a;
          --accent-color-blue: #00ffff;
          --accent-color-green: #00ff7f;
          --accent-color-red: #ff4500;
          --accent-color-purple: #ff00ff;
          --neon-glow: 0 0 15px rgba(0, 255, 255, 0.7);
        }

        body {
          font-family: 'Montserrat', sans-serif;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: var(--bg-color);
          color: var(--text-color-primary);
        }

        .app-container {
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 0;
          text-align: center;
          overflow-x: hidden;
          overflow-y: auto;
          z-index: 1;
        }

        .cyber-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0d001a;
          z-index: 0;
        }
        
        .cyber-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(15px);
          z-index: 1;
        }

        #tsparticles {
          position: fixed;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 2;
        }

        .main-content-container {
          position: relative;
          z-index: 3;
          width: 100%;
          max-width: 1200px;
          padding: 0 1rem;
          margin-top: 1.5rem;
          flex-grow: 1;
        }
        
        .top-navbar {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 2rem 1rem 1rem;
          position: relative;
          z-index: 3;
        }

        .navbar-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          color: var(--text-color-primary);
          margin: 0;
          letter-spacing: 2px;
          text-shadow: var(--neon-glow);
        }

        .navbar-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(0.8rem, 1.8vw, 1.1rem);
          color: var(--text-color-secondary);
          margin: 0.5rem 0 0;
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
        }

        .summary-dashboard {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          padding: 1.5rem;
          background: var(--card-bg-light);
          border-radius: 1.25rem;
          border: 1px solid var(--border-color);
          backdrop-filter: blur(30px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          cursor: pointer;
        }

        .summary-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), var(--neon-glow);
          border-color: var(--accent-color-blue);
        }

        .summary-value {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 600;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        .summary-card:hover .summary-value {
          text-shadow: var(--neon-glow);
        }

        .total-card .summary-value { color: var(--accent-color-blue); }
        .queued-card .summary-value { color: var(--accent-color-purple); }
        .running-card .summary-value { color: var(--accent-color-purple); }
        .completed-card .summary-value { color: var(--accent-color-green); }
        .failed-card .summary-value { color: var(--accent-color-red); }
        
        .summary-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-color-secondary);
          margin-top: 0.5rem;
        }

        .job-form {
          padding: 2rem;
          background: var(--card-bg-dark);
          border-radius: 1.5rem;
          border: 1px solid var(--border-color);
          backdrop-filter: blur(35px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          margin-bottom: 2rem;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--text-color-primary);
          margin-bottom: 1.5rem;
          text-shadow: var(--neon-glow);
        }

        .form-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          align-items: center;
        }

        .form-input, .form-select {
          padding: 0.75rem 1rem;
          font-size: 1rem;
          color: var(--text-color-primary);
          background: rgba(30, 35, 50, 0.8);
          border: 1px solid rgba(100, 115, 140, 0.5);
          border-radius: 0.75rem;
          transition: all 0.3s ease;
          font-family: 'Montserrat', sans-serif;
          backdrop-filter: blur(10px);
        }

        .form-input::placeholder, .option-default {
          color: var(--text-color-secondary);
        }
        
        .form-input:focus, .form-select:focus {
          outline: none;
          box-shadow: var(--neon-glow);
          border-color: var(--accent-color-blue);
        }

        .submit-button {
          padding: 0.9rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, var(--accent-color-blue), var(--accent-color-purple));
          color: var(--text-color-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--neon-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 0.5px;
        }

        .submit-button:hover {
          background: linear-gradient(135deg, var(--accent-color-purple), var(--accent-color-blue));
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), var(--neon-glow);
        }

        .submit-button:disabled {
          background: rgba(100, 115, 140, 0.4);
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          animation: spin 1s linear infinite;
          width: 1.25rem;
          height: 1.25rem;
          color: var(--text-color-primary);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .jobs-table-container {
          background: var(--card-bg-dark);
          border-radius: 1.5rem;
          border: 1px solid var(--border-color);
          backdrop-filter: blur(35px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .jobs-table-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 500;
          padding: 1.5rem;
          color: var(--text-color-primary);
          background: rgba(30, 35, 50, 0.5);
          border-bottom: 1px solid var(--border-color);
          text-shadow: var(--neon-glow);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .jobs-table {
          width: 100%;
          border-collapse: collapse;
        }

        .jobs-table th, .jobs-table td {
          padding: 1rem 1.5rem;
          text-align: left;
          border-bottom: 1px solid rgba(66, 73, 90, 0.2);
        }

        .jobs-table th {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-color-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .job-row {
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }

        .job-row:last-child {
          border-bottom: none;
        }

        .job-row:hover {
          background-color: rgba(66, 73, 90, 0.1);
          box-shadow: inset var(--neon-glow);
        }

        .status-badge {
          padding: 0.3rem 0.8rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-color-primary);
          text-transform: capitalize;
          box-shadow: var(--neon-glow);
        }
        
        .status-submitted { background-color: var(--accent-color-purple); }
        .status-in-progress { background-color: var(--accent-color-gold); }
        .status-completed { background-color: var(--accent-color-green); }
        .status-failed { background-color: var(--accent-color-red); }

        .popup-message {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.75rem 1.5rem;
          background: var(--accent-color-red);
          color: var(--text-color-primary);
          border-radius: 0.5rem;
          box-shadow: 0 0 10px rgba(255, 69, 0, 0.5);
          z-index: 100;
          font-size: 0.875rem;
          backdrop-filter: blur(10px);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(30px);
          z-index: 50;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
        }

        .job-details-panel {
          background: var(--card-bg-dark);
          border-radius: 2rem;
          border: 1px solid var(--border-color);
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.6);
          padding: 3rem;
          max-width: 1000px;
          width: 100%;
          position: relative;
          backdrop-filter: blur(35px);
        }

        .job-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .job-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: var(--text-color-primary);
          text-shadow: var(--neon-glow);
        }

        .job-subtitle {
          font-family: 'Montserrat', sans-serif;
          color: var(--text-color-secondary);
        }

        .header-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }

        .back-button, .close-button {
          padding: 0.85rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Montserrat', sans-serif;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .back-button {
          background: var(--accent-color-blue);
          color: var(--text-color-primary);
          box-shadow: var(--neon-glow);
        }

        .close-button {
          background: transparent;
          color: var(--text-color-secondary);
          border: 1px solid var(--border-color);
          width: 48px;
          height: 48px;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .close-button:hover {
          background: var(--accent-color-red);
          border-color: var(--accent-color-red);
          color: #fff;
          box-shadow: var(--neon-glow);
        }

        .job-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .job-details-full-width {
          grid-column: 1 / -1;
        }

        .info-card {
          background: var(--card-bg-light);
          border-radius: 1.5rem;
          border: 1px solid var(--border-color);
          backdrop-filter: blur(30px);
          padding: 2rem;
          text-align: left;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .card-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--text-color-primary);
          margin-bottom: 1.5rem;
          text-shadow: var(--neon-glow);
        }

        .info-grid {
          display: grid;
          gap: 1.2rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-family: 'Montserrat', sans-serif;
          color: var(--text-color-secondary);
          font-size: 0.9rem;
        }

        .info-value {
          font-family: 'Montserrat', sans-serif;
          color: var(--text-color-primary);
          font-size: 1rem;
          font-weight: 600;
        }

        .chart-container {
          height: 220px;
          width: 100%;
        }
        
        .chart-container-lg {
          height: 400px;
          width: 100%;
          overflow-x: auto;
        }

        .status-modal {
          background: var(--card-bg-dark);
          border-radius: 2rem;
          border: 1px solid var(--border-color);
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.6);
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          text-align: center;
          backdrop-filter: blur(35px);
        }

        .status-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          text-shadow: var(--neon-glow);
        }

        .status-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: var(--text-color-primary);
          margin-bottom: 1rem;
          text-shadow: var(--neon-glow);
        }

        .status-message {
          font-family: 'Montserrat', sans-serif;
          color: var(--text-color-secondary);
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 2rem;
        }

        .status-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }

        .action-button {
          padding: 0.9rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 0.75rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Montserrat', sans-serif;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          color: var(--text-color-primary);
        }

        .view-button {
          background: linear-gradient(135deg, var(--accent-color-blue), var(--accent-color-purple));
          box-shadow: var(--neon-glow);
        }

        .download-button {
          background: var(--accent-color-gold);
          box-shadow: var(--neon-glow);
        }

        .cancel-button {
          background: rgba(100, 115, 140, 0.2);
          border: 1px solid var(--border-color);
          box-shadow: var(--neon-glow);
        }

        .delete-button {
          background: var(--accent-color-red);
          box-shadow: var(--neon-glow);
        }

        .empty-state {
          font-family: 'Montserrat', sans-serif;
          color: var(--text-color-secondary);
          font-size: 1rem;
          padding: 2rem;
        }

        /* New Background CSS */
        .gradient-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.6;
          animation: blob-float 20s ease-in-out infinite alternate, blob-glow 10s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        .gradient-blob.one { 
          background: #4a00e0; 
          width: 800px; 
          height: 800px; 
          top: -300px; 
          left: -300px; 
          animation-delay: 0s; 
        }
        .gradient-blob.two { 
          background: #8e2de2; 
          width: 700px; 
          height: 700px; 
          bottom: -250px; 
          right: -250px; 
          animation-delay: 5s; 
        }
        .gradient-blob.three { 
          background: #00ffff; 
          width: 600px; 
          height: 600px; 
          top: 10%; 
          right: 5%; 
          animation-delay: 10s; 
        }
        .gradient-blob.four { 
          background: #ff00ff; 
          width: 550px; 
          height: 550px; 
          bottom: 5%; 
          left: 5%; 
          animation-delay: 15s; 
        }

        @keyframes blob-float {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(100px, -50px) rotate(10deg);
          }
          50% {
            transform: translate(50px, 100px) rotate(-10deg);
          }
          75% {
            transform: translate(-100px, 50px) rotate(5deg);
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
          }
        }
        
        @keyframes blob-glow {
          0% { opacity: 0.6; }
          50% { opacity: 0.9; }
          100% { opacity: 0.6; }
        }
        /* End of New Background CSS */

        @media (max-width: 900px) {
          .job-details-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .hidden-md {
            display: none;
          }
          .job-details-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-buttons {
            margin-top: 1rem;
          }
        }
      `}</style>
      <div className="cyber-bg"></div>
      <div className="cyber-overlay"></div>
      <div className="gradient-blob one"></div>
      <div className="gradient-blob two"></div>
      <div className="gradient-blob three"></div>
      <div className="gradient-blob four"></div>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: { color: { value: 'transparent' } },
          fpsLimit: 120, // Increased FPS limit for smoother movement
          particles: {
            number: { value: 150, density: { enable: true, area: 500 } }, // Increased particles, smaller density area for a denser feel
            color: { value: ['#7d17b8', '#0093d9', '#d91d90', '#ffd93d', '#ff6b6b'] }, // Updated with your requested colors
            shape: { type: 'star' },
            opacity: { value: { min: 0.5, max: 1 }, random: true, anim: { enable: true, speed: 2, opacity_min: 0.1, sync: false } },
            size: { value: { min: 5, max: 8 }, random: true, anim: { enable: true, speed: 5, size_min: 1, sync: false } }, // Updated with your requested sizes
            move: {
              enable: true,
              speed: { min: 3, max: 7 }, // Increased movement speed
              direction: 'none',
              random: true,
              straight: false,
              out_mode: 'out',
              bounce: false,
            },
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'repulse',
                parallax: {
                  enable: false,
                  force: 60,
                  smooth: 10,
                },
              },
              onClick: {
                enable: true,
                mode: 'push',
              },
            },
            modes: {
              repulse: {
                distance: 100,
                duration: 0.4,
              },
              push: {
                quantity: 4,
              },
            },
          },
          detectRetina: true,
        }}
      />
      <nav className="top-navbar">
        <h1 className="navbar-title">Quantum Jobs Tracker 🚀</h1>
        <p className="navbar-subtitle">Track, Manage, and Visualize Quantum Jobs</p>
      </nav>
      <div className="main-content-container">
        <AnimatePresence mode="wait">
          {showDashboard && !selectedJob && !showStatusModal ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="summary-dashboard">
                {['total', 'queued', 'running', 'completed', 'failed'].map((key, index) => (
                  <motion.div
                    key={key}
                    className={`summary-card ${key}-card`}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05, type: 'spring', stiffness: 120 }}
                  >
                    <h3 className="summary-value">{jobSummary[key]}</h3>
                    <p className="summary-label">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                  </motion.div>
                ))}
              </div>
              <motion.form
                onSubmit={handleSubmit}
                className="job-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <h2 className="form-title">Submit a New Job</h2>
                <div className="form-controls">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Job Name"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    disabled={loading}
                  />
                  <select
                    className="form-select"
                    value={backend}
                    onChange={(e) => setBackend(e.target.value)}
                    disabled={loading}
                  >
                    <option value="" className="option-default">-- Select a Backend --</option>
                    {availableBackends.map((b) => (
                      <option key={b} value={b} className="option-item">
                        {b}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search Job or Backend"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <motion.button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !jobName || !backend}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  {loading ? (
                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    'Submit Job'
                  )}
                </motion.button>
              </motion.form>
              <motion.div
                className="jobs-table-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h2 className="jobs-table-title">Live Job Status</h2>
                {filteredJobs.length === 0 ? (
                  <div className="empty-state">No jobs found matching your search.</div>
                ) : (
                  <div className="table-wrapper">
                    <table className="jobs-table">
                      <thead>
                        <tr>
                          <th className="table-header">Job Name</th>
                          <th className="table-header">Backend</th>
                          <th className="table-header">Status</th>
                          <th className="table-header hidden-md">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredJobs.map((job) => (
                          <motion.tr
                            key={job.id}
                            className="job-row"
                            onClick={() => handleJobClick(job)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <td className="table-cell font-medium">{job.name}</td>
                            <td className="table-cell">{job.backend}</td>
                            <td className="table-cell">
                              <span
                                className="status-badge"
                                style={{ backgroundColor: statusColors[job.status] }}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="table-cell hidden-md">{job.date}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {selectedJob && !showStatusModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {renderJobDetails()}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showStatusModal && selectedJob && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {renderStatusModal()}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="popup-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            Please fill in all fields!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
