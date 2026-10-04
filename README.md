# ATM Cash Management — Backend

FastAPI + SQLAlchemy backend for your ATM cash dashboard. It turns the notebook
(`ATM_FullYear2024_Dashboard_Enhanced_with_PRF1.ipynb`) into a service: data ingestion and
validation, gap-safe feature engineering, LightGBM/XGBoost/CatBoost training with a model
registry, next-day forecasts, cash position, refill planning, and the API your dashboard calls.

```
app/
  main.py            FastAPI app (also serves the dashboard at "/")
  config.py          every notebook threshold as an env var
  models.py db.py    schema: atms, withdrawals, predictions, atm_status, cash_events, model_runs, jobs
  ml/                features.py  training.py  forecast.py  registry.py
  services/          ingest  pipeline  cash  queries  bootstrap  jobs
  routers/           system  atms  cash  data  model
  cli.py             python -m app.cli ...
static/index.html    your dashboard, now driven by the API
tests/               39 tests
```

## Quick start

```bash
pip install -r requirements.txt
cp .env.example .env            # optional; defaults work (SQLite in ./data)

# A) instantly see your current dashboard through the API (no CSVs needed)
python -m app.cli bootstrap-dashboard --html ATM_Cash_Dashboard_final_output.html

# B) the real thing: load your two raw CSVs, then either reuse your notebook's model ...
python -m app.cli ingest ATM_Featured_Dataset_JAN24_JUN24.csv ATM_Featured_Dataset_JUL24_DEC24.csv
python -m app.cli import-model ATM_Cash_Forecasting_Package.pkl      # saved by notebook cell 87
#    ... or train a fresh one (picks the winner on validation RMSE)
python -m app.cli train
python -m app.cli refresh        # forecasts + status snapshot

python -m app.cli serve          # http://localhost:8000  (dashboard)   /docs  (API explorer)
```
Docker: `cp .env.example .env && docker compose up --build`.

### Verify my feature definitions against your notebook (do this once)
The notebook never showed how `Rolling_*`, `Demand_*`, `EWMA_*` etc. were computed, so
`features.py` re-implements them from the NaN counts the notebook printed (they match exactly).
Prove it on your data:
```bash
python -m app.cli verify-features ATM_Featured_Dataset_JAN24_JUN24.csv
```
If a row says `DIFFERS`, edit that one line in `app/ml/features.py`. If you use the imported
notebook model, parity matters, since the model expects features computed the way it was trained.

## Daily operation
```
POST /api/data/withdrawals   push yesterday's rows (JSON)  -> auto refresh job
POST /api/data/upload        or upload CSV(s)
POST /api/cash-events        record real refills / balance readings (replaces the simulation per ATM)
GET  /api/refill-plan        prioritised worklist  (/api/refill-plan.csv for the CIT team)
GET  /api/model/monitoring   accuracy of forecasts we issued and later saw come true (drift)
POST /api/model/train        retrain (async); GET /api/jobs/{id} to follow it
```
Cron alternative: `python -m app.cli refresh`. Or set `AUTO_REFRESH_MINUTES`.
Set `API_KEY` to require `X-API-Key` on every write endpoint (reads stay open).
Full list with schemas: `/docs`.

## What I changed vs the notebook, and why
| # | Notebook | Backend |
|---|---|---|
| 1 | `Target_Next_Day` is rebuilt with a **row-based** `shift(-1)` over the concatenated files. Your data has a ~4-month hole, so the last row before it would get a July value as its "next day". (The lag/rolling features arrive pre-computed in your CSVs; their code isn't in the notebook.) | Every ATM is re-indexed to a **calendar**. Lags and targets across a hole are NaN and the row is dropped. |
| 2 | Simulated cash **reset to full the moment it crossed 20%**, then status was computed, so an ATM that needed cash today showed as 100% / OK (92 of 256 on your dashboard; "Refill Now" was structurally ~0). | Status is read **before** the refill (`SIM_REFILL_LEAD_DAYS`, default 1). In my re-run on your data, instant-refill logic showed 1 Refill Now and 74 ATMs at exactly 100%; the lead-time logic shows 74 Refill Now. (Counts match but the ATMs differ, since the two simulations diverge after the first delayed refill.) |
| 3 | Balance drawn down with **predicted** demand even for days already known. | Uses **actual** withdrawals; the model is only used for tomorrow. Real refill/balance events override the simulation. |
| 4 | Last day per ATM dropped (no target), so the dashboard "next-day" forecast was for a day that had already happened. | A live forecast is issued from each ATM's **latest** day. |
| 5 | Best model chosen on the **test** set. LightGBM/XGBoost never early-stopped (all 2000 trees). | Chosen on **validation** RMSE; all three early-stop. Test stays an honest holdout. |
| 6 | 5 ATMs that stop reporting in March silently vanished from the table. | Shown as **No Data** and listed in `/api/data-quality`. 6 new ATMs with <35 days history get a trailing-mean fallback (`Forecast_Method`). |
| 7 | Chart plotted prediction on the feature date. | `dates` are the day the demand occurs; each point is tagged Train / Validation / Test / Live / Forecast. |
| 8 | `weekday_names` labelled 0 = Sunday, so the "highest day" was reported as Wednesday. | pandas `dayofweek` is Monday = 0; your peak is **Thursday**, lowest Friday. `IsWeekend` is configurable (`WEEKEND_DAYS`, default Fri/Sat). |

## Things only you can fix (data, not code)
* **Real cash balances.** Both the notebook and this backend *estimate* cash in the vault. Vault
  capacity is derived (1.5 x peak recommended loading). Upload real capacities
  (`POST /api/atms/master`, CSV: `ATMID,Location,Capacity`) and feed refill events.
* **The missing months.** History has no data from late March to late July. Forecasts are fine
  after it, but seasonal learning would improve if those months can be recovered.
* Locations are all "(location not in dataset)": supply them via the master CSV.

## Tests
`python -m pytest tests` (39 tests: feature NaN counts, hole-safety, training/selection, cash logic,
ingestion, bootstrap, and a full API lifecycle). Verified on pandas 2.3 and 3.0.

Security note: `import-model` unpickles a file, so it is CLI-only. Never expose it over HTTP.
