from __future__ import annotations

import os
import time
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any

from dotenv import load_dotenv
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit_ibm_runtime.ibm_backend import IBMBackend

load_dotenv()


# -------------------------------------------------------------------
# Dataclass used in /api/backends, /api/top, /api/summary, etc.
# -------------------------------------------------------------------
@dataclass
class BackendStatus:
    name: str
    is_simulator: bool
    num_qubits: Optional[int]
    queue_length: Optional[int]
    operational: Optional[bool]
    status_msg: Optional[str]
    version: Optional[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _avg(values: List[float]) -> Optional[float]:
    values = [v for v in values if v is not None]
    if not values:
        return None
    return float(sum(values) / len(values))


class IBMQuantumClient:
    """
    Small wrapper around QiskitRuntimeService with:
    - cached status snapshots
    - recommendation helpers
    - detailed backend info
    - analytics extracted from backend properties()
    """

    def __init__(self, cache_ttl: int = 30) -> None:
        token = os.getenv("IBM_QUANTUM_API_TOKEN")
        instance = os.getenv("IBM_QUANTUM_INSTANCE") or None

        if not token:
            raise RuntimeError("Missing IBM_QUANTUM_API_TOKEN in environment")

        # IMPORTANT: use "ibm_quantum_platform" channel for new runtime
        self._service = QiskitRuntimeService(
            channel="ibm_quantum_platform",
            token=token,
            instance=instance,
        )

        self._ttl = int(os.getenv("CACHE_TTL", str(cache_ttl)))
        self._cache_time: float = 0.0
        self._cache_statuses: List[BackendStatus] = []
        self._err: Optional[str] = None

    # ---------------------------------------------------------------
    # INTERNAL CACHE REFRESH (used by get_statuses / summary / top)
    # ---------------------------------------------------------------
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
            except Exception as e:  # very defensive, never break the loop
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

    # ---------------------------------------------------------------
    # BASIC STATUS / SUMMARY HELPERS (unchanged)
    # ---------------------------------------------------------------
    def get_statuses(
        self, force: bool = False
    ) -> Tuple[bool, List[BackendStatus], Optional[str]]:
        now = time.time()
        if force or (now - self._cache_time > self._ttl) or not self._cache_statuses:
            try:
                self._refresh()
                self._err = None
            except Exception as e:
                self._err = str(e)
        return (self._err is None, self._cache_statuses, self._err)

    def recommend_backend(
        self, min_qubits: int = 0, max_queue: Optional[int] = None
    ) -> Tuple[bool, Optional[BackendStatus], Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, None, err

        candidates = [
            s
            for s in statuses
            if (s.operational is True) and (s.num_qubits or 0) >= min_qubits
        ]

        if max_queue is not None:
            candidates = [
                s
                for s in candidates
                if s.queue_length is not None and s.queue_length <= max_queue
            ]

        def score_backend(s: BackendStatus) -> int:
            score = 0
            if s.operational:
                score += 1000
            if not s.is_simulator:
                score += 500
            q = s.queue_length or 0
            score -= q * 20
            score += (s.num_qubits or 0) * 5
            return score

        candidates.sort(key=score_backend, reverse=True)
        return True, (candidates[0] if candidates else None), None

    def top_busiest(
        self, n: int = 5
    ) -> Tuple[bool, List[BackendStatus], Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, [], err
        busiest = sorted(
            [s for s in statuses if s.queue_length is not None],
            key=lambda s: s.queue_length,
            reverse=True,
        )[:n]
        return True, busiest, None

    def summary(self) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, {}, err

        total = len(statuses)
        operational = sum(1 for s in statuses if s.operational)
        sims = sum(1 for s in statuses if s.is_simulator)
        total_queue = sum(
            s.queue_length or 0 for s in statuses if s.queue_length is not None
        )
        busiest = sorted(
            [s for s in statuses if s.queue_length is not None],
            key=lambda s: s.queue_length,
            reverse=True,
        )[:5]

        return (
            True,
            {
                "total_backends": total,
                "operational_backends": operational,
                "simulators": sims,
                "total_pending_jobs": total_queue,
                "busiest": [b.to_dict() for b in busiest],
            },
            None,
        )

    # ---------------------------------------------------------------
    # NEW: DETAILED BACKEND INFORMATION
    # used by: /api/backends/{name}/details
    # ---------------------------------------------------------------
    def get_backend_details(
        self, backend_name: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Return a rich 'details' payload for a backend:
        - basic info & status
        - configuration: qubits, basis gates, coupling map, max shots…
        - calibration summary: avg T1/T2/readout error/gate error
        """
        try:
            backend: IBMBackend = self._service.backend(backend_name)
        except Exception as e:
            return False, None, f"backend {backend_name} not found: {e}"

        try:
            status = backend.status()
        except Exception:
            status = None

        try:
            cfg = backend.configuration()
        except Exception:
            cfg = None

        try:
            props = backend.properties()
        except Exception:
            props = None

        # ---------- BASIC INFO ----------
        basic_info: Dict[str, Any] = {
            "name": backend.name,
            "backend_version": getattr(cfg, "backend_version", None)
            if cfg is not None
            else None,
            "description": getattr(cfg, "description", None)
            if cfg is not None
            else None,
            "num_qubits": getattr(cfg, "num_qubits", None)
            if cfg is not None
            else None,
            "simulator": getattr(cfg, "simulator", False)
            if cfg is not None
            else False,
            "operational": getattr(status, "operational", None)
            if status is not None
            else None,
            "status_msg": getattr(status, "status_msg", None)
            if status is not None
            else None,
            "pending_jobs": getattr(status, "pending_jobs", None)
            if status is not None
            else None,
            "max_shots": getattr(cfg, "max_shots", None)
            if cfg is not None
            else None,
        }

        # ---------- CONFIGURATION ----------
        config_info: Dict[str, Any] = {
            "basis_gates": getattr(cfg, "basis_gates", None) if cfg is not None else None,
            "dynamic_reprate_enabled": getattr(
                cfg, "dynamic_reprate_enabled", None
            )
            if cfg is not None
            else None,
            "coupling_map": getattr(cfg, "coupling_map", None)
            if cfg is not None
            else None,
            "configuration": getattr(cfg, "to_dict", lambda: None)()
            if cfg is not None and hasattr(cfg, "to_dict")
            else None,
        }

        # ---------- CALIBRATION & ERROR METRICS ----------
        t1_values: List[Optional[float]] = []
        t2_values: List[Optional[float]] = []
        readout_errors: List[Optional[float]] = []
        gate_errors_1q: List[Optional[float]] = []
        gate_errors_2q: List[Optional[float]] = []

        if props is not None:
            # t1 / t2 / readout_error per qubit using methods on BackendProperties
            try:
                num_props_qubits = len(props.qubits)  # type: ignore[attr-defined]
            except Exception:
                num_props_qubits = getattr(cfg, "num_qubits", 0) or 0

            for q in range(num_props_qubits):
                # T1 / T2
                try:
                    t1_values.append(props.t1(q))  # type: ignore[attr-defined]
                except Exception:
                    t1_values.append(None)
                try:
                    t2_values.append(props.t2(q))  # type: ignore[attr-defined]
                except Exception:
                    t2_values.append(None)
                # readout error
                try:
                    readout_errors.append(
                        props.readout_error(q)  # type: ignore[attr-defined]
                    )
                except Exception:
                    readout_errors.append(None)

            # try to estimate 1q / 2q gate errors using gate_error()
            # not all backends support all gates → always inside try/except
            for q in range(num_props_qubits):
                # 1-qubit gate error
                for gate_name in ("sx", "x", "id", "rz"):
                    try:
                        err = props.gate_error(  # type: ignore[attr-defined]
                            gate_name, [q]
                        )
                        gate_errors_1q.append(err)
                        break
                    except Exception:
                        continue

            # 2-qubit gates: just sample first pair (0,1), (1,2)… if possible
            for q in range(num_props_qubits - 1):
                for gate_name in ("cx", "ecr"):
                    try:
                        err = props.gate_error(  # type: ignore[attr-defined]
                            gate_name, [q, q + 1]
                        )
                        gate_errors_2q.append(err)
                        break
                    except Exception:
                        continue

        calibration_summary = {
            "avg_t1_us": _avg([v for v in t1_values if v is not None]),
            "avg_t2_us": _avg([v for v in t2_values if v is not None]),
            "avg_readout_error": _avg(
                [v for v in readout_errors if v is not None]
            ),
            "avg_gate_error_1q": _avg(
                [v for v in gate_errors_1q if v is not None]
            ),
            "avg_gate_error_2q": _avg(
                [v for v in gate_errors_2q if v is not None]
            ),
            "num_qubits_with_calib": len(
                [v for v in t1_values if v is not None]
            ),
            "last_update_date": str(
                getattr(props, "last_update_date", "")
            )
            if props is not None
            else None,
        }

        details_payload: Dict[str, Any] = {
            "basic_info": basic_info,
            "configuration": config_info,
            "calibration_summary": calibration_summary,
        }

        return True, details_payload, None

    # ---------------------------------------------------------------
    # NEW: BACKEND ANALYTICS
    # used by: /api/backends/{name}/analytics
    # (no DB dependency – purely from backend properties)
    # ---------------------------------------------------------------
    def get_backend_analytics(
        self, backend_name: str, history_rows: int = 200
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Returns a rich analytics payload for charts:
        - per-qubit T1/T2 distribution
        - readout error distribution
        - 1q / 2q gate error distributions
        - synthetic queue timeline (for sparkline style charts)
        """
        try:
            backend: IBMBackend = self._service.backend(backend_name)
        except Exception as e:
            return False, None, f"backend {backend_name} not found: {e}"

        try:
            status = backend.status()
        except Exception:
            status = None

        try:
            props = backend.properties()
        except Exception:
            props = None

        # If we have no properties at all, return a minimal analytics object
        if props is None:
            queue_len = getattr(status, "pending_jobs", None) if status else None
            synthetic_timeline = []
            if isinstance(queue_len, int):
                base = queue_len
                for i in range(10):
                    synthetic_timeline.append(
                        {
                            "slot": i,
                            "queue": max(0, base - int(i * base / 9.0)),
                        }
                    )

            return (
                True,
                {
                    "queue_timeline": synthetic_timeline,
                    "note": "No calibration properties available for this backend; analytics are limited.",
                },
                None,
            )

        # --------------- Build distributions ---------------
        t1_list: List[Optional[float]] = []
        t2_list: List[Optional[float]] = []
        readout_list: List[Optional[float]] = []
        gate_errors_1q: List[Optional[float]] = []
        gate_errors_2q: List[Optional[float]] = []

        try:
            num_qubits = len(props.qubits)  # type: ignore[attr-defined]
        except Exception:
            num_qubits = 0

        for q in range(num_qubits):
            # T1 / T2
            try:
                t1_list.append(props.t1(q))  # type: ignore[attr-defined]
            except Exception:
                t1_list.append(None)
            try:
                t2_list.append(props.t2(q))  # type: ignore[attr-defined]
            except Exception:
                t2_list.append(None)
            # readout error
            try:
                readout_list.append(
                    props.readout_error(q)  # type: ignore[attr-defined]
                )
            except Exception:
                readout_list.append(None)

        # Sample some 1q gate errors
        for q in range(num_qubits):
            for gate_name in ("sx", "x", "id", "rz"):
                try:
                    err = props.gate_error(  # type: ignore[attr-defined]
                        gate_name, [q]
                    )
                    gate_errors_1q.append(err)
                    break
                except Exception:
                    continue

        # Sample some 2q gate errors
        for q in range(num_qubits - 1):
            for gate_name in ("cx", "ecr"):
                try:
                    err = props.gate_error(  # type: ignore[attr-defined]
                        gate_name, [q, q + 1]
                    )
                    gate_errors_2q.append(err)
                    break
                except Exception:
                    continue

        # --------------- Build chart-ready data ---------------
        t1_distribution = [
            {"qubit": i, "t1": v} for i, v in enumerate(t1_list) if v is not None
        ]
        t2_distribution = [
            {"qubit": i, "t2": v} for i, v in enumerate(t2_list) if v is not None
        ]
        readout_distribution = [
            {"qubit": i, "readout_error": v}
            for i, v in enumerate(readout_list)
            if v is not None
        ]

        # Basic stats for display cards
        analytics_summary = {
            "avg_t1_us": _avg([v for v in t1_list if v is not None]),
            "avg_t2_us": _avg([v for v in t2_list if v is not None]),
            "avg_readout_error": _avg(
                [v for v in readout_list if v is not None]
            ),
            "avg_gate_error_1q": _avg(
                [v for v in gate_errors_1q if v is not None]
            ),
            "avg_gate_error_2q": _avg(
                [v for v in gate_errors_2q if v is not None]
            ),
        }

        # synthetic queue timeline from current queue length (no DB)
        queue_len = getattr(status, "pending_jobs", None) if status else None
        queue_timeline: List[Dict[str, Any]] = []
        if isinstance(queue_len, int):
            base = queue_len
            for i in range(12):
                queue_timeline.append(
                    {
                        "slot": i,
                        "queue": max(
                            0, int(base - (base * 0.8 * i / 11.0))
                        ),
                    }
                )

        analytics_payload: Dict[str, Any] = {
            "summary": analytics_summary,
            "t1_distribution": t1_distribution,
            "t2_distribution": t2_distribution,
            "readout_error_distribution": readout_distribution,
            "queue_timeline": queue_timeline,
        }

        return True, analytics_payload, None
