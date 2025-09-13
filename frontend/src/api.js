const API = 'https://quantum-jobs-tracker-l3jz.onrender.com'
async function j(path) {
  const res = await fetch(`${API}${path}`)
  return res.json()
}

export const getBackends = () => j('/api/backends')
export const getSummary = () => j('/api/summary')
export const getTop = (n=5) => j(`/api/top?n=${n}`)
export const getRecommendation = (minQ=0, maxQ=null) => j(`/api/recommendation?min_qubits=${minQ}${maxQ!==null?`&max_queue=${maxQ}`:''}`)
