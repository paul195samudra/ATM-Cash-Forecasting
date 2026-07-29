# ATM Cash Forecasting

**A decision-support system that predicts when every ATM will run dry — before it does.**

This project builds a forecasting layer that reads each machine’s rhythm (paydays, holidays, weekends, its own history) and turns that signal into a same-day refill decision instead of a guess.

> Live presentation page: open [`atm_cash_forecasting.html`](atm_cash_forecasting.html) in any modern browser.

---

## Overview

Cash handling and replenishment can account for a large share of ATM operating costs. Poor forecasts lead to either **cash-outs** (lost transactions + poor customer experience) or **excess idle cash**.

This system aims to:

- Maximize ATM uptime / cash availability
- Minimize average cash held in ATMs
- Optimize replenishment frequency and load amounts
- Support mixed ATM networks (residential, business, shopping, rural, high-volume, etc.)

---

## Objectives

| Goal | Description |
|------|-------------|
| **Reduce cash-outs** | Keep machines available for customers |
| **Cut idle cash** | Free up capital sitting unused in cassettes |
| **Optimize CIT trips** | Fewer, smarter replenishment visits |
| **Support mixed networks** | One model framework that works across location types |
| **Turn forecasts into actions** | Produce refill flags, amounts, and schedules |

---

## What the System Predicts

For each ATM the model outputs:

- Expected cash demand (next day / next few days)
- Recommended refill amount
- Suggested next replenishment window
- Priority / urgency flag

These numbers feed a decision layer that respects operational, financial, logical, and regulatory constraints.

---

## Use Case Diagram

Actors interacting with the system:

- **Cash Manager** (Bank Ops)
- **CIT / Replenishment Team**
- **Data Scientist / Analyst**
- **System Admin**

Core use cases:

1. Collect Transaction Data  
2. Feature Engineering  
3. Train Forecasting Models  
4. Generate Cash Forecasts  
5. Optimize Replenishment  
6. View Dashboards & Reports  
7. Monitor Model Performance  
8. Approve / Trigger Replenishment  

See the interactive diagram inside the HTML presentation or the image `ATM_Cash_Forecasting_UseCase_Diagram.png`.

---

## Workflow (7 Steps)

### Data Preparation
1. **Data Collection** — Transaction logs, withdrawals, deposits, refill history, location metadata  
2. **Data Preprocessing** — Missing-value handling, calendar tagging (holidays, paydays), lag & rolling features  
3. **Dataset Splitting** — Chronological Train / Validation / Test (no future leakage)

### Modelling
4. **Feature Engineering** — Lags, rolling stats, ATM behaviour profiles, location & calendar flags  
5. **Model Training** — Seasonal-naive baseline → SARIMA / Prophet → XGBoost (with hyperparameter tuning)

### Evaluation & Output
6. **Model Evaluation** — MAE, RMSE, MAPE, cost-weighted loss  
7. **Final Decision Output** — Refill flag, recommended amount, next replenishment window

---

## Feature Categories

| Category | Key Features |
|----------|--------------|
| **A. Transaction** | ATM ID, date/time, withdrawal amount, deposit amount, balance after transaction |
| **B. Time** | Day of week, week number, month, quarter, weekend, public holiday, festival, salary day, start/end of month |
| **C. ATM Behaviour** | Avg daily withdrawal, transaction count, peak hour, avg transaction size, daily max/min, cash utilisation rate |
| **D. Location** | Mall, residential, business district, university, airport/station, tourist area, rural vs urban |
| **E. Refill Behaviour** | Last refill date, days since refill, previous refill amount, current balance, capacity, % cash remaining |
| **F. External** | Temperature, rainfall, public events, sports matches, festivals, elections *(kept only if they improve accuracy)* |

### Typical Feature Importance (Mixed Networks)

1. Day of week / weekend  
2. ATM cluster / location type  
3. Holiday flags  
4. Lag 1 & lag 3 (recent history)  
5. Payday / working day of month  
6. Days since last refill  
7. Rolling volatility  
8. Day of month / month-end  

---

## Decision Layer

A raw forecast number is not enough. The system converts it into an actionable plan:

**Example**

| Forecast only | Decision-support output |
|---------------|-------------------------|
| Tomorrow’s demand = $58,000 | **Replenish today**<br>• Add $70,000<br>• Next replenishment in 3 days<br>• Route with two nearby low-cash ATMs |

Operational constraints considered:

- **Physical** — Staff/vehicle availability, SLAs, storage capacity  
- **Financial** — Insurance, CIT cost, cash rent, bank fees  
- **Logical** — Route efficiency, denomination constraints  
- **Regulatory** — National rules and internal policy limits  

---

## Tech Stack (Suggested)

| Layer | Tools |
|-------|-------|
| Data & Feature Engineering | Python, pandas / polars, SQL |
| Modelling | scikit-learn, XGBoost / LightGBM, statsmodels, Prophet, optionally PyTorch/TensorFlow |
| Experiment Tracking | MLflow or Weights & Biases |
| Serving & Dashboard | FastAPI + Streamlit / Power BI / custom HTML |
| Orchestration | Airflow / Prefect / cloud schedulers |

---

## How to View the Presentation

1. Clone this repository  
2. Open `atm_cash_forecasting.html` in any modern browser (Chrome, Firefox, Edge, Safari)  
3. No build step or server required — it is a self-contained static page  

```bash
git clone <your-repo-url>
cd <repo-name>
# then simply open the HTML file
```

---

## Project Status

This repository currently contains the project presentation and conceptual design.  
Model training code, data pipelines, and production deployment components can be added in subsequent commits.

---

## Author

**Maloy Kishor Paul**


