import React from 'react'

export default function BackendCard({ b }) {
  const status = b.operational ? 'Operational' : 'Down'
  return (
    <div className="card" style={{padding:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div style={{fontWeight:700}}>{b.name}</div>
        <span className="muted" style={{fontSize:12}}>{b.version || ''}</span>
      </div>
      <div className="muted" style={{fontSize:12, marginBottom:8}}>{b.is_simulator ? 'Simulator' : 'Hardware'}</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
        <div><div className="muted" style={{fontSize:12}}>Qubits</div><div style={{fontWeight:700}}>{b.num_qubits ?? '-'}</div></div>
        <div><div className="muted" style={{fontSize:12}}>Queue</div><div style={{fontWeight:700}}>{b.queue_length ?? '-'}</div></div>
        <div><div className="muted" style={{fontSize:12}}>Status</div><div style={{fontWeight:700}}>{status}</div></div>
      </div>
      {b.status_msg && <div className="muted" style={{fontSize:12, marginTop:8}}>{b.status_msg}</div>}
    </div>
  )
}
