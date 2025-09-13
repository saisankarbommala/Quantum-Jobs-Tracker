# Quantum Jobs Tracker - Updated (history + SSE + prediction)

This build adds:
- SQLite snapshots of backend queue depth (history.db in backend/)
- Background snapshot loop that records status every 30 seconds
- SSE endpoint `/api/stream` to receive live snapshots in the frontend
- `/api/history?backend_name=...` to fetch recent snapshots for a backend
- `/api/predict_wait?backend_name=...` simple heuristic prediction

## Run locally (backend + frontend)

1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.sample .env
# Edit .env and set IBM_QUANTUM_API_TOKEN
uvicorn main:app --reload --port 8000
```

When backend starts it will create `history.db` and start snapshotting (every 30s by default).

2. Frontend
```bash
cd frontend
npm i
npm run dev
# open http://localhost:5173
```

If your backend is remote, set `VITE_API_URL` when running frontend dev:
```bash
VITE_API_URL=https://your-backend.example.com npm run dev
```

## Notes
- The snapshot loop requires a valid `IBM_QUANTUM_API_TOKEN` in backend/.env.
- The snapshot DB (`history.db`) is created next to `main.py` (backend/).
- SSE stream is at `/api/stream` and emits JSON payloads with `type: "snapshot"`.
