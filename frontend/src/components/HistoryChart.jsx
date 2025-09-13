import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function fmtTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString();
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const time = fmtTime(label);
    const queue = payload[0].value;

    return (
      <div style={{
        background: '#fff',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px'
      }}>
        <p style={{ margin: 0, color: '#00BFFF', fontWeight: 'bold' }}>
          {time}
        </p>
        <p style={{ margin: 0, color: '#FF1493', fontWeight: 'bold' }}>
          queue : {queue}
        </p>
      </div>
    );
  }
  return null;
};

export default function HistoryChart({ data }) {
  const chartData = (data || []).map(d => ({ time: d.snapshot_time, queue: d.queue_length || 0 }));
  
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickFormatter={fmtTime} stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="queue" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}