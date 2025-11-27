from __future__ import annotations

import os
import asyncio
from typing import Optional

from fastapi import FastAPI, Query, Response, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from qiskit_client import IBMQuantumClient
from history import init_db, _snapshot_loop, event_generator, query_history

load_dotenv()

app = FastAPI(title="Quantum Jobs Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_client = None

def get_client() -> IBMQuantumClient:
    global _client
    if _client is None:
        _client = IBMQuantumClient()
    return _client

@app.on_event("startup")
async def startup_tasks():
    init_db()
    # start snapshot loop
    loop = asyncio.get_event_loop()
    loop.create_task(_snapshot_loop(get_client()))

@app.get("/api/backends")
def backends(force: bool = Query(False, description="Bypass cache and refresh")):
    ok, statuses, err = get_client().get_statuses(force=force)
    return {"ok": ok, "data": [s.to_dict() for s in statuses], "error": err}

@app.get("/api/summary")
def summary():
    ok, data, err = get_client().summary()
    return {"ok": ok, "data": data, "error": err}

@app.get("/api/top")
def top(n: int = Query(5, ge=1, le=50)):
    ok, data, err = get_client().top_busiest(n=n)
    return {"ok": ok, "data": [s.to_dict() for s in data], "error": err}

@app.get("/api/recommendation")
def recommendation(min_qubits: int = Query(0, ge=0), max_queue: Optional[int] = Query(None, ge=0)):
    ok, rec, err = get_client().recommend_backend(min_qubits=min_qubits, max_queue=max_queue)
    return {"ok": ok, "data": (rec.to_dict() if rec else None), "error": err}

@app.get("/api/history")
def history(backend_name: str, limit: int = 200):
    data = query_history(backend_name, limit)
    return {"ok": True, "data": data}

@app.get("/api/stream")
def stream():
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/predict_wait")
def predict_wait(backend_name: str):
    rows = query_history(backend_name, limit=100)
    qlens = [r.get("queue_length") or 0 for r in rows]
    if not qlens:
        return {"ok": False, "error": "no history available"}
    med = sorted(qlens)[len(qlens)//2]
    est_seconds = med * 120  # heuristic: 2 minutes per job
    return {"ok": True, "estimate_seconds": est_seconds, "median_queue_length": med}

@app.get("/api/backends/{backend_name}/details")
def backend_details(backend_name: str):
    """
    Full config + status + calibration of a single backend.
    Used for the 'Details' tab in your frontend.
    """
    ok, data, err = get_client().get_backend_details(backend_name)
    return {"ok": ok, "data": data, "error": err}


@app.get("/api/backends/{backend_name}/analytics")
def backend_analytics(
    backend_name: str,
    history_limit: int = Query(300, ge=20, le=2000),
):
    """
    Analytics view combining calibrations (T1/T2/error) and queue history.
    Used for the 'Analytics' tab in your frontend.
    """
    # Get history from SQLite
    history_rows = query_history(backend_name, limit=history_limit)
    ok, data, err = get_client().get_backend_analytics(backend_name, history_rows)
    return {"ok": ok, "data": data, "error": err}
