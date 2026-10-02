# ATM Cash Forecasting & CIT Logistics Optimizer

> A decision-support platform for forecasting ATM cash demand, identifying refill risk, optimizing replenishment, and planning Cash-in-Transit (CIT) operations.

## Overview

**ATM Cash Forecasting & CIT Logistics Optimizer** is a React + TypeScript dashboard designed to help bank operations teams move from reactive ATM cash replenishment to data-driven planning.

The system combines ATM-level demand forecasts with operational rules, cash-availability monitoring, regional clustering, stress testing, CIT route planning, and capital optimization.

Instead of only showing a predicted demand number, the application converts ATM telemetry into operational decisions such as:

- Which ATMs need cash now?
- Which ATMs can wait?
- How much cash should be loaded?
- How many CIT vehicles are required?
- Which machines should be included in a replenishment manifest?
- How does the network behave during demand shocks or delivery delays?
- How can cash holding and CIT costs be balanced?

---

## Key Capabilities

### 1. ATM Operations Dashboard

The Operations view provides a network-wide overview of ATM liquidity and refill requirements.

**Features include:**

- ATM-level cash availability
- Predicted demand
- Estimated cash remaining
- Cash remaining percentage
- Days of cash remaining
- Refill status
- Suggested refill amount
- Search and filtering
- Individual ATM inspection
- Bulk ATM actions
- Refill simulation

### 2. Dynamic Refill Policy Engine

ATM status is recalculated from the active operational policy rather than relying only on static labels.

The policy engine classifies machines into:

- `Refill Now`
- `Refill Soon`
- `OK`

Refill recommendations are rounded to the configured cash unit and the application recalculates the results when policy thresholds change.

### 3. ATM Demand & ML Forecast Explorer

The ML Forecast Explorer presents the forecasting architecture and provides an interactive scenario simulator.

The interface includes:

- Model benchmark comparison
- Out-of-sample evaluation metrics
- Feature importance
- Calendar and behavioral features
- Location cluster effects
- Days since refill
- Current balance and ATM capacity
- Interactive demand scenarios
- Refill-trigger simulation
- XGBoost-based forecasting scenario visualization

The project also includes a historical forecasting notebook:

```text
ATM_FullYear2024_Dashboard_Enhanced_with_PRF1.ipynb
```

### 4. Regional Geographic Intelligence

The Regional view organizes the ATM network into operational corridors.

The project models corridors such as:

- Dhaka Core
- Dhaka North
- Dhaka Diplomatic
- Dhaka West
- Chittagong Port
- Cox's Bazar
- Sylhet Valley
- Comilla-Feni
- Mymensingh
- Rajshahi-Bogra
- Khulna-Jessore
- Barisal-Padma

The view provides:

- Regional ATM counts
- Critical ATM counts
- Cash utilization
- Cash density
- Regional cluster analysis
- CIT corridor visualization
- Network topology

### 5. Fleet Stress Testing

The Stress Test Engine simulates operational shocks to identify ATMs that may become vulnerable before the situation occurs.

Scenarios include demand surges and carrier delivery delays.

The simulator estimates:

- Baseline cash-outs
- Stressed cash-outs
- Newly vulnerable ATMs
- Additional liquidity requirements
- Potential lost interchange revenue
- Pre-emptive replenishment requirements

Custom stress parameters can also be configured.

### 6. CIT Dispatch Planner

The CIT Dispatch Planner turns ATM refill requirements into an operational replenishment manifest.

It supports:

- Selecting urgent ATMs
- Building a refill manifest
- Truck capacity constraints
- Maximum stops per vehicle
- CIT fee configuration
- Truck requirement calculation
- Route grouping
- Refill cash calculation
- Estimated financial impact
- Dispatch approval simulation
- CSV manifest export
- Formal carrier order generation

Example operational flow:

```text
ATM Risk Detection
       ↓
Urgent ATM Selection
       ↓
Refill Amount Calculation
       ↓
Manifest Creation
       ↓
Vehicle / Stop Constraints
       ↓
Route Grouping
       ↓
CIT Cost Estimation
       ↓
Dispatch
```

### 7. Capital Optimization

The Capital Optimizer evaluates the trade-off between:

- Cash held inside ATMs
- Cost of idle liquidity
- CIT replenishment frequency
- Service-level requirements
- Replenishment batch size

Configurable parameters include:

- Annual cost of capital / interest rate
- CIT cost per stop
- Target ATM availability SLA

The interface estimates an operational balance between holding additional cash and making more frequent CIT visits.

### 8. CSV Fleet Import

ATM fleet telemetry can be imported directly into the dashboard through CSV.

The import workflow supports:

- CSV file upload
- Raw CSV paste
- Header detection
- Data parsing
- Validation
- Record preview
- Applying imported fleet data to the active dashboard

### 9. Executive Reporting & Daily Briefing

The application contains operational reporting interfaces for management and decision-makers, including:

- Executive audit reporting
- Daily operational briefing
- Formal replenishment manifest
- Architecture and workflow documentation

---

## System Architecture

```text
                    ┌─────────────────────────┐
                    │      ATM Telemetry       │
                    │  CSV / Historical Data   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Data Processing &       │
                    │ Feature Representation  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Demand Forecasting /     │
                    │ Scenario Simulation      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Operational Policy       │
                    │ & Refill Decision Layer  │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
       │ Regional    │    │ Stress Test │    │ Capital      │
       │ Intelligence│    │ Engine      │    │ Optimization │
       └──────┬──────┘    └──────┬──────┘    └──────┬───────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │ CIT Dispatch Planner    │
                    │ & Replenishment Manifest│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Operational Dashboard   │
                    │ Reports / CSV Export    │
                    └─────────────────────────┘
```

---

## Decision Logic

At the ATM level, the application works with the following core variables:

| Field | Description |
|---|---|
| `ATMID` | Unique ATM identifier |
| `Location` | ATM location / descriptive label |
| `ATM_Capacity` | Maximum cash capacity |
| `Estimated_Cash_Remaining` | Estimated current cash balance |
| `Cash_Remaining_Pct` | Percentage of cash remaining |
| `Predicted_Demand` | Forecasted cash demand |
| `Refill_Suggestion_Amount` | Recommended replenishment amount |
| `Days_of_Cash` | Estimated remaining days before depletion |
| `Status` | Refill urgency classification |

The core decision flow is:

```text
Current Cash
     +
Predicted Demand
     +
ATM Capacity
     +
Operational Policy
     ↓
Cash Availability Assessment
     ↓
Refill Status
     ↓
Recommended Refill Amount
     ↓
CIT Planning
```

---

## Refill Policy

The policy engine calculates the remaining cash percentage:

```text
Cash Remaining %
=
Estimated Cash Remaining / ATM Capacity × 100
```

The resulting value is compared against configurable policy thresholds.

The refill amount is calculated from the remaining capacity:

```text
Raw Refill Need
=
ATM Capacity - Estimated Cash Remaining
```

The recommended amount is then rounded upward to the configured cash unit.

This makes the decision layer configurable instead of hard-coded to one operational policy.

---

## Forecasting Features

The forecasting architecture is designed around ATM demand behavior and operational context.

### Time-based features

- Day of week
- Weekend
- Month
- Calendar position
- Holiday indicators
- Payday-related effects

### ATM behavioral features

- Recent demand
- Historical demand
- Rolling demand behavior
- Days since refill
- Current cash balance
- ATM capacity

### Location features

- ATM region
- Regional corridor
- Location cluster
- Urban / commercial / shopping behavior

### Operational features

- Refill thresholds
- Service-level targets
- Vehicle capacity
- Maximum route stops
- CIT cost
- Delivery delays

---

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### Application Logic

- TypeScript
- React state management
- Memoized calculations with React hooks
- Client-side CSV parsing
- Operational policy calculations

### Analytics / Forecasting

The repository includes forecasting and analytical assets built around:

- XGBoost-based scenario simulation
- Historical ATM demand data
- Forecast evaluation concepts
- Feature importance analysis
- Stress testing
- Cost-aware decision support

### Supporting Assets

- JSON historical data
- TypeScript ATM dataset
- Jupyter Notebook
- Standalone HTML presentation/dashboard

---

## Project Structure

```text
atm-cash-forecasting/
│
├── src/
│   ├── components/
│   │   ├── ArchitectureGuide.tsx
│   │   ├── AtmChart.tsx
│   │   ├── AtmDetailCard.tsx
│   │   ├── AtmTable.tsx
│   │   ├── BatchActionToolbar.tsx
│   │   ├── CapitalOptimizerView.tsx
│   │   ├── CassetteConfiguratorModal.tsx
│   │   ├── CitDispatchPlanner.tsx
│   │   ├── CsvImportModal.tsx
│   │   ├── DailyBriefingModal.tsx
│   │   ├── DepletionTrajectoryChart.tsx
│   │   ├── ExecutiveAuditReportModal.tsx
│   │   ├── FormalManifestModal.tsx
│   │   ├── KpiSummary.tsx
│   │   ├── MlForecastExplorer.tsx
│   │   ├── Navbar.tsx
│   │   ├── PolicyConfigModal.tsx
│   │   ├── RegionalClusterView.tsx
│   │   └── StressTestEngine.tsx
│   │
│   ├── data/
│   │   ├── atmData.ts
│   │   ├── historyData.json
│   │   └── historyHelper.ts
│   │
│   ├── types/
│   │   └── operations.ts
│   │
│   ├── utils/
│   │   └── cashCalculations.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── ATM_FullYear2024_Dashboard_Enhanced_with_PRF1.ipynb
├── atm_cash_forecasting.html
├── ATM_Cash_Dashboard final output.html
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 18+ recommended
- npm, Bun, or another compatible package manager
- A modern web browser

### Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd atm-cash-forecasting
```

Install dependencies:

```bash
npm install
```

Or with Bun:

```bash
bun install
```

### Run the Development Server

```bash
npm run dev
```

The Vite development server runs on port `3000`.

Open:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
```

### Type Check

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

---

## Available Application Sections

| Section | Purpose |
|---|---|
| **Operations** | Monitor ATM cash levels and refill requirements |
| **Regional Intelligence** | Analyze regional clusters and CIT corridors |
| **Stress Test** | Simulate demand shocks and delivery delays |
| **CIT Dispatch** | Build and export replenishment manifests |
| **Capital Optimizer** | Balance cash holding and replenishment costs |
| **ML Forecast** | Explore forecasting features and scenarios |
| **Architecture** | Understand the end-to-end decision pipeline |

---

## Example Operational Scenario

Suppose an ATM has:

```text
ATM Capacity:              1,000,000
Estimated Cash Remaining:    180,000
Predicted Demand:            250,000
```

The decision layer evaluates the machine against the configured operational policy.

If the machine crosses the configured refill threshold, the system can classify it as:

```text
Status: Refill Now
```

The application can then:

1. Calculate the refill requirement.
2. Add the ATM to a CIT manifest.
3. Group it with other nearby refill candidates.
4. Calculate required vehicle capacity.
5. Estimate CIT costs.
6. Evaluate potential cash-out exposure.
7. Export the replenishment manifest.
8. Simulate dispatch.

---

## Data & Model Notes

The repository contains preloaded ATM records and historical data so the dashboard can be explored without connecting to a production banking system.

The included data should therefore be treated as **development / demonstration data**, not as live banking telemetry.

For production deployment, the system would require secure integration with:

- ATM transaction systems
- Core banking systems
- Cash management systems
- CIT provider systems
- Location / branch databases
- Historical replenishment records

---

## Production Roadmap

Potential next steps for a production-grade implementation include:

### Data Pipeline

- Automated ATM transaction ingestion
- Real-time balance updates
- Data quality monitoring
- Feature-store integration

### Machine Learning

- Automated model training
- Time-series cross-validation
- Model registry
- Model drift monitoring
- Automated retraining
- Per-ATM / per-cluster model selection

### Optimization

- Vehicle routing optimization
- Geographic distance and travel-time constraints
- Multi-depot routing
- Denomination-aware cassette optimization
- Multi-day replenishment scheduling

### Enterprise Integration

- Bank authentication / SSO
- Role-based access control
- Audit trails
- Approval workflows
- Secure API integration
- Real-time CIT dispatch integration

### Monitoring

- Forecast accuracy dashboards
- Data drift monitoring
- Cash-out monitoring
- SLA monitoring
- Model performance alerts

---

## Important Disclaimer

This project is a **decision-support prototype**.

It is not intended to directly control ATM cash systems, authorize financial transactions, or replace bank operational controls.

Any production deployment should include appropriate:

- Security controls
- Access management
- Data protection
- Model validation
- Operational approvals
- Audit logging
- Regulatory compliance
- Human oversight

---

## Author

**Maloy Kishor Paul**

B.Sc. in Computer Science & Engineering  
Daffodil International University

---

## Project Focus

**Forecast → Detect Risk → Optimize Refill → Plan CIT → Stress Test → Monitor**

The goal is to transform ATM cash management from a reactive replenishment process into a measurable, explainable, and optimization-driven operational workflow.
