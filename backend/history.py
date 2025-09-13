import asyncio
import sqlite3
import time
import json
from typing import Dict, Any, List, Optional

DB_PATH = "history.db"
_snapshot_interval = int(30)  # seconds

_clients: List[asyncio.Queue] = []

def init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS backend_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      snapshot_time INTEGER NOT NULL,
      queue_length INTEGER,
      num_qubits INTEGER,
      is_simulator INTEGER,
      operational INTEGER,
      status_msg TEXT,
      version TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_snapshot_time ON backend_snapshot(snapshot_time);
    CREATE INDEX IF NOT EXISTS idx_backend_name ON backend_snapshot(name);
    """)
    con.commit()
    con.close()

def save_snapshots(snapshot_time: int, items: List[Dict[str,Any]]):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    for it in items:
        cur.execute("""
            INSERT INTO backend_snapshot
            (name, snapshot_time, queue_length, num_qubits, is_simulator, operational, status_msg, version)
            VALUES (?,?,?,?,?,?,?,?)
        """, (
            it.get("name"), snapshot_time, it.get("queue_length"),
            it.get("num_qubits"), 1 if it.get("is_simulator") else 0,
            1 if it.get("operational") else 0,
            it.get("status_msg"), it.get("version")
        ))
    con.commit()
    con.close()

def query_history(backend_name: str, limit: int = 200):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("""
      SELECT snapshot_time, queue_length, num_qubits, operational
      FROM backend_snapshot
      WHERE name = ?
      ORDER BY snapshot_time DESC
      LIMIT ?
    """, (backend_name, limit))
    rows = cur.fetchall()
    con.close()
    return [{ "snapshot_time": r[0], "queue_length": r[1], "num_qubits": r[2], "operational": r[3] } for r in rows][::-1]

async def _snapshot_loop(client):
    while True:
        try:
            ok, statuses, err = client.get_statuses(force=True)
            snapshot_time = int(time.time())
            if ok and statuses:
                items = [s.to_dict() for s in statuses]
                save_snapshots(snapshot_time, items)
                payload = {"type":"snapshot", "time": snapshot_time, "items": items}
                for q in list(_clients):
                    try:
                        await q.put(json.dumps(payload))
                    except Exception:
                        pass
        except Exception as e:
            payload = {"type":"error", "error": str(e)}
            for q in list(_clients):
                try:
                    await q.put(json.dumps(payload))
                except Exception:
                    pass
        await asyncio.sleep(_snapshot_interval)

async def event_generator():
    q = asyncio.Queue()
    _clients.append(q)
    try:
        while True:
            data = await q.get()
            yield f"data: {data}\n\n"
    finally:
        try:
            _clients.remove(q)
        except ValueError:
            pass
