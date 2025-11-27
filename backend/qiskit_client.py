from __future__ import annotations

import os
import time
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple, Any

from dotenv import load_dotenv
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit_ibm_runtime.ibm_backend import IBMBackend

load_dotenv()


# ------------------------------------------------------------
# Model
# ------------------------------------------------------------

@dataclass
class BackendStatus:
    name: str
    is_simulator: bool
    num_qubits: Optional[int]
    queue_length: Optional[int]
    operational: Optional[bool]
    status_msg: Optional[str]
    version: Optional[str]

    def to_dict(self):
        return asdict(self)


# ------------------------------------------------------------
# IBM Quantum Client
# ------------------------------------------------------------

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
        self._cache_time = 0.0
        self._cache_statuses: List[BackendStatus] = []
        self._error = None

    # ------------------------------------------------------------
    # INTERNAL REFRESH
    # ------------------------------------------------------------
    def _refresh(self):
        statuses = []

        for be in self._service.backends():
            try:
                st = be.status()
                cfg = be.configuration()

                statuses.append(
                    BackendStatus(
                        name=be.name,
                        is_simulator=getattr(cfg, "simulator", False),
                        num_qubits=getattr(cfg, "num_qubits", None),
                        queue_length=getattr(st, "pending_jobs", None),
                        operational=getattr(st, "operational", None),
                        status_msg=getattr(st, "status_msg", None),
                        version=getattr(cfg, "backend_version", None),
                    )
                )

            except Exception as e:
                statuses.append(
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

        self._cache_statuses = statuses
        self._cache_time = time.time()
        self._error = None

    # ------------------------------------------------------------
    # PUBLIC FUNCTIONS
    # ------------------------------------------------------------

    def get_statuses(self, force=False):
        now = time.time()
        if force or (now - self._cache_time > self._ttl) or not self._cache_statuses:
            try:
                self._refresh()
            except Exception as e:
                self._error = str(e)

        return (self._error is None, self._cache_statuses, self._error)

    # ------------------------------------------------------------
    # FULL BACKEND DETAILS
    # ------------------------------------------------------------

    def get_backend_details(self, backend_name: str):
        """
        Returns:
            - config
            - properties
            - readout errors
            - gate errors
            - coupling map
            - multi-qubit error data
        """

        try:
            be: IBMBackend = self._service.backend(backend_name)
        except Exception as e:
            return False, None, f"Backend not found: {e}"

        details = {
            "name": backend_name,
            "config": {},
            "properties": {},
            "readout_errors": [],
            "gate_errors": [],
            "multi_qubit_errors": [],
            "coupling_map": [],
        }

        # CONFIG
        try:
            cfg = be.configuration()
            details["config"] = {
                "simulator": getattr(cfg, "simulator", None),
                "num_qubits": getattr(cfg, "num_qubits", None),
                "backend_version": getattr(cfg, "backend_version", None),
                "basis_gates": getattr(cfg, "basis_gates", None),
                "coupling_map": getattr(cfg, "coupling_map", None),
            }
            details["coupling_map"] = getattr(cfg, "coupling_map", [])
        except Exception:
            pass

        # PROPERTIES
        props = None
        try:
            props = be.properties()
        except Exception:
            pass

        # SAFE READOUT ERROR EXTRACTION
        readout_errors = []

        if props:

            # Case 1 — Qiskit Runtime new format
            if hasattr(props, "meas_errors") and props.meas_errors:
                for qb, err in props.meas_errors.items():
                    readout_errors.append({"qubit": qb, "error": err})

            # Case 2 — Qiskit old format
            elif hasattr(props, "meas_error") and props.meas_error:
                for i, err in enumerate(props.meas_error):
                    readout_errors.append({"qubit": i, "error": err})

            # Case 3 — Very old readout_errors format
            elif hasattr(props, "readout_errors") and props.readout_errors:
                for i, row in enumerate(props.readout_errors):
                    try:
                        val = row[0].value
                    except:
                        val = None
                    readout_errors.append({"qubit": i, "error": val})

        details["readout_errors"] = readout_errors

        # GATE ERRORS
        gate_errors = []
        if props:
            try:
                for gate in props.gates:
                    err = None

                    # Param lookup
                    for param in gate.parameters:
                        if param.name in ("gate_error", "error", "gate_err", "p"):
                            err = param.value

                    gate_errors.append({
                        "gate": gate.gate,
                        "qubits": gate.qubits,
                        "error": err,
                    })

            except Exception:
                pass

        details["gate_errors"] = gate_errors

        # MULTI-QUBIT ERROR MAP
        multi = []
        for g in gate_errors:
            if len(g["qubits"]) > 1:
                multi.append(g)

        details["multi_qubit_errors"] = multi

        return True, details, None

    # ------------------------------------------------------------
    # BACKEND ANALYTICS (properties + errors + trends)
    # ------------------------------------------------------------

    def get_backend_analytics(self, backend_name: str, history_rows=200):
        ok, details, err = self.get_backend_details(backend_name)
        if not ok:
            return False, None, err

        # Analytics = full details + historical queue + error metrics
        return True, {
            "backend": backend_name,
            "details": details,
        }, None

    # ------------------------------------------------------------
    # RECOMMENDATION
    # ------------------------------------------------------------

    def recommend_backend(self, min_qubits: int = 0, max_queue: Optional[int] = None):
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, None, err

        candidates = [s for s in statuses if s.operational and (s.num_qubits or 0) >= min_qubits]

        if max_queue is not None:
            candidates = [s for s in candidates if s.queue_length is not None and s.queue_length <= max_queue]

        def score(s):
            return (
                (s.operational * 1000) +
                ((not s.is_simulator) * 400) +
                (s.num_qubits or 0) * 6 -
                (s.queue_length or 0) * 20
            )

        candidates.sort(key=score, reverse=True)
        return True, (candidates[0] if candidates else None), None

    # ------------------------------------------------------------
    # BUSIEST
    # ------------------------------------------------------------

    def top_busiest(self, n: int = 5):
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, [], err

        ranked = sorted(
            [s for s in statuses if s.queue_length is not None],
            key=lambda x: x.queue_length,
            reverse=True
        )

        return True, ranked[:n], None

    # ------------------------------------------------------------
    # SUMMARY
    # ------------------------------------------------------------

    def summary(self):
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, {}, err

        total = len(statuses)
        operational = sum(1 for s in statuses if s.operational)
        sims = sum(1 for s in statuses if s.is_simulator)
        queue_total = sum(s.queue_length or 0 for s in statuses)

        busiest = sorted(
            [s for s in statuses if s.queue_length is not None],
            key=lambda s: s.queue_length,
            reverse=True
        )[:5]

        return True, {
            "total_backends": total,
            "operational_backends": operational,
            "simulators": sims,
            "total_pending_jobs": queue_total,
            "busiest": [b.to_dict() for b in busiest]
        }, None
