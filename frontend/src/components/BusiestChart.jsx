import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Custom Tooltip Component for attractive styling
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.name;
    const queue = data.queue;

    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}>
        <p style={{ margin: 0, color: '#007BFF', fontSize: '16px', fontWeight: 'bold' }}>
          {name}
        </p>
        <p style={{ margin: '8px 0 0', color: '#FF007F', fontSize: '14px', fontWeight: 'bold' }}>
          queue : {queue}
        </p>
      </div>
    );
  }

  return null;
};

export default function BusiestChart({ data }) {
  return (
    <div>
      <div style={{fontWeight:700, marginBottom:8, color: '#fff'}}>Busiest Backends (by queue length)</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="name" stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#fff', fontSize: '14px', paddingTop: '10px' }} />
          <Bar dataKey="queue" fill="#Ddb092" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
