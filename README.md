# ATM Cash Forecasting & Decision-Support System

**A decision-support system that predicts when every ATM will run dry — before it does.**

This project builds a forecasting layer that reads each machine’s rhythm (paydays, holidays, weekends, its own history) and turns that signal into a same-day refill decision instead of a guess.

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
