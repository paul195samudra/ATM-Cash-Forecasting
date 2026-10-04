"""Command line:  python -m app.cli <command>

  init-db                              create tables
  bootstrap-dashboard --html FILE      seed DB from ATM_Cash_Dashboard_final_output.html
  ingest CSV [CSV ...] [--master F]    load raw history (+ optional location/capacity master)
  import-model PKL                     register the model your notebook saved (ATM_Cash_Forecasting_Package.pkl)
  train [--models ...] [--n-estimators N] [--no-refresh]
  refresh                              recompute forecasts + status with the active model
  verify-features CSV                  prove feature parity with your notebook's pre-computed columns
  serve [--host H] [--port P]
"""
from __future__ import annotations

import argparse
import json
import logging
import sys

import numpy as np
import pandas as pd


def _print(x) -> None:
    print(json.dumps(x, indent=2, default=str))


def cmd_verify_features(path: str) -> int:
    """Compare our engineered features with the columns already present in the notebook's CSV."""
    from .config import get_settings
    from .ml.features import FULL_FEATURES, engineer_features
    raw = pd.read_csv(path)
    raw["Date"] = pd.to_datetime(raw["Date"])
    ours = engineer_features(raw, get_settings().weekend_days)
    theirs = raw.copy()
    m = ours.merge(theirs, on=["ATMID", "Date"], suffixes=("", "_nb"))
    print(f"{len(m):,} overlapping ATM-days\n")
    print(f"{'feature':28s} {'compared':>9s} {'max |diff|':>12s} {'mismatch %':>11s}  verdict")
    bad = 0
    for c in FULL_FEATURES:
        if f"{c}_nb" not in m.columns:
            continue
        a, b = m[c].astype(float), m[f"{c}_nb"].astype(float)
        both = a.notna() & b.notna()
        if both.sum() == 0:
            print(f"{c:28s} {'0':>9s}")
            continue
        diff = (a[both] - b[both]).abs()
        tol = 1e-6 * (1 + b[both].abs())
        mism = float((diff > tol).mean() * 100)
        ok = mism < 0.5
        bad += not ok
        print(f"{c:28s} {both.sum():9d} {diff.max():12.4g} {mism:10.2f}%  {'OK' if ok else 'DIFFERS - adjust app/ml/features.py'}")
    print("\nAll compared features match." if not bad else f"\n{bad} feature(s) differ - see above.")
    return 1 if bad else 0


def main(argv=None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    p = argparse.ArgumentParser(prog="python -m app.cli", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init-db")
    b = sub.add_parser("bootstrap-dashboard"); b.add_argument("--html", required=True)
    i = sub.add_parser("ingest"); i.add_argument("csv", nargs="+"); i.add_argument("--master")
    m = sub.add_parser("import-model"); m.add_argument("pkl")
    t = sub.add_parser("train"); t.add_argument("--models", nargs="*"); t.add_argument("--n-estimators", type=int, default=2000)
    t.add_argument("--no-refresh", action="store_true")
    sub.add_parser("refresh")
    v = sub.add_parser("verify-features"); v.add_argument("csv")
    s = sub.add_parser("serve"); s.add_argument("--host", default="0.0.0.0"); s.add_argument("--port", type=int, default=8000)
    a = p.parse_args(argv)

    from .db import init_db, session_scope
    init_db()
    if a.cmd == "init-db":
        print("tables created")
    elif a.cmd == "bootstrap-dashboard":
        from .services.bootstrap import bootstrap_from_dashboard
        with session_scope() as db:
            _print(bootstrap_from_dashboard(db, a.html))
    elif a.cmd == "ingest":
        from .services import ingest
        with session_scope() as db:
            _print(ingest.ingest_frames(db, [pd.read_csv(f) for f in a.csv]))
            if a.master:
                _print(ingest.ingest_master(db, pd.read_csv(a.master)))
    elif a.cmd == "import-model":
        from .ml.registry import import_notebook_package
        with session_scope() as db:
            r = import_notebook_package(db, a.pkl)
            _print({"run_id": r.id, "name": r.name, "features": len(r.feature_columns or [])})
    elif a.cmd == "train":
        from .services import pipeline
        with session_scope() as db:
            kw = dict(models=a.models or None, n_estimators=a.n_estimators)
            _print(pipeline.train(db, **kw).id if a.no_refresh else pipeline.train_and_refresh(db, **kw))
    elif a.cmd == "refresh":
        from .services import pipeline
        with session_scope() as db:
            _print(pipeline.refresh(db))
    elif a.cmd == "verify-features":
        return cmd_verify_features(a.csv)
    elif a.cmd == "serve":
        import uvicorn
        uvicorn.run("app.main:app", host=a.host, port=a.port)
    return 0


if __name__ == "__main__":
    sys.exit(main())
