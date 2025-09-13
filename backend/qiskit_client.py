from __future__ import annotations

import os
import time
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple

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
        self._service = QiskitRuntimeService(channel="ibm_quantum_platform", token=token, instance=instance)
        self._ttl = int(os.getenv("CACHE_TTL", str(cache_ttl)))
        self._cache_time: float = 0.0
        self._cache_statuses: List[BackendStatus] = []
        self._err: Optional[str] = None

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

    def get_statuses(self, force: bool = False) -> Tuple[bool, List[BackendStatus], Optional[str]]:
        now = time.time()
        if force or (now - self._cache_time > self._ttl) or not self._cache_statuses:
            try:
                self._refresh()
                self._err = None
            except Exception as e:
                self._err = str(e)
        return (self._err is None, self._cache_statuses, self._err)

    def recommend_backend(self, min_qubits: int = 0, max_queue: Optional[int] = None) -> Tuple[bool, Optional[BackendStatus], Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, None, err
        candidates = [s for s in statuses if (s.operational is True) and (s.num_qubits or 0) >= min_qubits]
        if max_queue is not None:
            candidates = [s for s in candidates if s.queue_length is not None and s.queue_length <= max_queue]
        def score_backend(s):
            score = 0
            if s.operational: score += 1000
            if not s.is_simulator: score += 500
            q = s.queue_length or 0
            score -= q * 20
            score += (s.num_qubits or 0) * 5
            return score
        candidates.sort(key=lambda x: score_backend(x), reverse=True)
        return (True, (candidates[0] if candidates else None), None)

    def top_busiest(self, n: int = 5) -> Tuple[bool, List[BackendStatus], Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, [], err
        busiest = sorted([s for s in statuses if s.queue_length is not None], key=lambda s: s.queue_length, reverse=True)[:n]
        return True, busiest, None

    def summary(self) -> Tuple[bool, Dict, Optional[str]]:
        ok, statuses, err = self.get_statuses()
        if not ok:
            return False, {}, err
        total = len(statuses)
        operational = sum(1 for s in statuses if s.operational)
        sims = sum(1 for s in statuses if s.is_simulator)
        total_queue = sum(s.queue_length or 0 for s in statuses if s.queue_length is not None)
        busiest = sorted([s for s in statuses if s.queue_length is not None], key=lambda s: s.queue_length, reverse=True)[:5]
        return True, {
            "total_backends": total,
            "operational_backends": operational,
            "simulators": sims,
            "total_pending_jobs": total_queue,
            "busiest": [b.to_dict() for b in busiest],
        }, None
