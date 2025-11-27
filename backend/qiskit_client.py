from __future__ import annotations

import os
import time
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any

from dotenv import load_dotenv
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit_ibm_runtime.ibm_backend import IBMBackend

load_dotenv()


@dataclass
class BackendStatus:
    name: str
    is_simulator: bool
    num_qubits: Optional[int]
    queue_length: Optional[int]
    operational: Optional[bool]
    status_msg: Optional[str]
    version: Optional[str]

    def to_dict(self) -> Dict:
        return asdict(self)


class IBMQuantumClient:
    def __init__(self, cache_ttl: int = 30) -> None:
        token = os.getenv("IBM_QUANTUM_API_TOKEN")
        instance = os.getenv("IBM_QUANTUM_INSTANCE") or None

        if not token:
            raise RuntimeError("Missing IBM_QUANTUM_API_TOKEN in environment")

        self._service = QiskitRuntimeService(
            channel="ibm_quantum_platform",
            token=token,
            instance=instance
        )

        self._ttl = int(os.getenv("CACHE_TTL", str(cache_ttl)))
        self._cache_time: float = 0.0
        self._cache_statuses: List[BackendStatus] = []
        self._err: Optional[str] = None

    # ================================
    # INTERNAL: Refresh cache
    # ================================
    def _refresh(self) -> None:
        results: List[BackendStatus] = []
        backends: List[IBMBackend] = list(self._service.backends())

        for be in backends:
            try:
                st = be.status()
                cfg = be.configuration()

                results.append(
                    BackendStatus(
                        name=be.name,
                        is_simulator=bool(getattr(cfg, "simulator", False)),
                        num_qubits=getattr(cfg, "num_qubits", None),
                        queue_length=getattr(st, "pending_jobs", None),
                        operational=getattr(st, "operational", None),
                        status_msg=getattr(st, "status_msg", None),
                        version=getattr(cfg, "backend_version", None),
                    )
                )
            except Exception as e:
                results.append(
                    BackendStatus(
                        name=getattr(be, "name", "unknown"),
                        is_simulator=False,
                        num_qubits=None,
                        queue_length=None,
                        operational=None,
                        status_msg=f"error: {e}",
                        version=None,
                    )
                )

        self._cache_statuses = results
        self._cache_time = time.time()

    # ================================
    # PUBLIC: GET STATUSES
    # ================================
    def get_statuses(self, force: bool = False) -> Tuple[bool, List[BackendStatus], Optional[str]]:
        now = time.time()

        if force or (now - self._cache_time > self._ttl) or not self._cache_statuses:
            try:
                self._refresh()
                self._err = None
            except Exception as e:
                self._err = str(e)

        return (self._err is None, self._cache_statuses, self._err)

    # ================================
    # AI Recommendation (your version)
    # ================================
    def recommend_backend(
        self, min_qubits: int = 0, max_queue: Optional[int] = None
    ) -> Tuple[bool, Optional[BackendStatus], Optional[str]]:

        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, None, err

        candidates = [
            s for s in statuses
            if (s.operational is True) and (s.num_qubits or 0) >= min_qubits
        ]

        if max_queue is not None:
            candidates = [s for s in candidates if s.queue_length is not None and s.queue_length <= max_queue]

        def score(s: BackendStatus) -> int:
            sc = 0
            if s.operational: sc += 1000
            if not s.is_simulator: sc += 500
            sc -= (s.queue_length or 0) * 20
            sc += (s.num_qubits or 0) * 5
            return sc

        candidates.sort(key=lambda x: score(x), reverse=True)

        return True, (candidates[0] if candidates else None), None

    # ================================
    # Top busiest
    # ================================
    def top_busiest(self, n: int = 5) -> Tuple[bool, List[BackendStatus], Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, [], err

        busiest = sorted(
            [s for s in statuses if s.queue_length is not None],
            key=lambda s: s.queue_length,
            reverse=True
        )[:n]

        return True, busiest, None

    # ================================
    # Summary
    # ================================
    def summary(self) -> Tuple[bool, Dict, Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, {}, err

        total = len(statuses)
        operational = sum(1 for s in statuses if s.operational)
        sims = sum(1 for s in statuses if s.is_simulator)
        total_queue = sum(s.queue_length or 0 for s in statuses)
        busiest = sorted(
            statuses,
            key=lambda s: (s.queue_length or 0),
            reverse=True
        )[:5]

        return True, {
            "total_backends": total,
            "operational_backends": operational,
            "simulators": sims,
            "total_pending_jobs": total_queue,
            "busiest": [b.to_dict() for b in busiest],
        }, None

    # ==============================================================
    # NEW: BACKEND DETAILS  (for /api/backends/{name}/details)
    # ==============================================================
    def get_backend_details(
        self, backend_name: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:

        try:
            backend: IBMBackend = self._service.backend(backend_name)

            cfg = backend.configuration()
            st = backend.status()
            props = backend.properties()

            # ---- Build detailed response ----
            details = {
                "basic": {
                    "name": backend.name,
                    "simulator": cfg.simulator,
                    "num_qubits": cfg.num_qubits,
                    "max_shots": getattr(cfg, "max_shots", None),
                    "backend_version": getattr(cfg, "backend_version", None),
                    "basis_gates": cfg.basis_gates,
                },
                "status": {
                    "operational": st.operational,
                    "pending_jobs": getattr(st, "pending_jobs", None),
                    "status_msg": st.status_msg,
                },
                "topology": {
                    "coupling_map": cfg.coupling_map,
                },
                "qubits": [],
                "readout_errors": [],
                "gate_errors": [],
            }

            # Qubit properties
            if props and props.qubits:
                for idx, qprops in enumerate(props.qubits):
                    t1 = t2 = freq = None
                    try:
                        for p in qprops:
                            if "T1" in p.name.upper():
                                t1 = p.value
                            if "T2" in p.name.upper():
                                t2 = p.value
                            if "FREQUENCY" in p.name.upper():
                                freq = p.value
                    except:
                        pass

                    details["qubits"].append(
                        {"index": idx, "t1": t1, "t2": t2, "frequency": freq}
                    )

            # Readout errors
            if props and props.readout_errors:
                for idx, row in enumerate(props.readout_errors):
                    try:
                        val = row[0].value
                    except:
                        val = None
                    details["readout_errors"].append({"qubit": idx, "error": val})

            # Gate errors
            if props and props.gates:
                for g in props.gates:
                    try:
                        gname = g.gate
                        qubits = g.qubits
                        err = g.parameters[0].value if g.parameters else None
                    except:
                        gname = None
                        qubits = []
                        err = None

                    details["gate_errors"].append(
                        {"gate": gname, "qubits": qubits, "error": err}
                    )

            return True, details, None

        except Exception as exc:
            return False, None, str(exc)

    # ==============================================================
    # NEW: BACKEND ANALYTICS (for /api/backends/{name}/analytics)
    # ==============================================================
    def get_backend_analytics(
        self, backend_name: str, history_rows: List[Dict]
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:

        ok, details, err = self.get_backend_details(backend_name)
        if not ok or not details:
            return False, None, err

        qubits = details["qubits"]
        readout = details["readout_errors"]
        gates = details["gate_errors"]

        # Aggregations
        t1_vals = [q["t1"] for q in qubits if q["t1"]]
        t2_vals = [q["t2"] for q in qubits if q["t2"]]
        ro_vals = [r["error"] for r in readout if r["error"]]
        queues = [row.get("queue_length") or 0 for row in history_rows]

        # Gate histogram
        gate_map = {}
        for g in gates:
            name = g["gate"]
            if name not in gate_map:
                gate_map[name] = []
            if g["error"] is not None:
                gate_map[name].append(g["error"])

        gate_hist = [
            {
                "gate": g,
                "avg_error": sum(vals) / len(vals) if vals else None,
                "samples": len(vals),
            }
            for g, vals in gate_map.items()
        ]

        analytics = {
            "calibration_summary": {
                "avg_t1": sum(t1_vals) / len(t1_vals) if t1_vals else None,
                "avg_t2": sum(t2_vals) / len(t2_vals) if t2_vals else None,
                "avg_readout_error":
                    sum(ro_vals) / len(ro_vals) if ro_vals else None,
            },
            "t1_distribution": t1_vals,
            "t2_distribution": t2_vals,
            "readout_distribution": ro_vals,
            "gate_error_histogram": gate_hist,
            "queue_history_summary": {
                "avg_queue": sum(queues) / len(queues) if queues else 0,
                "max_queue": max(queues) if queues else 0,
                "samples": len(queues),
            },
            "queue_history_series": history_rows,
        }

        return True, analytics, None
