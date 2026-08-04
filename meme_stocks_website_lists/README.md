# Retro Meme-Stock Lists — Website Export

Top-25 ranked "meme stock" lists per period, produced by the retro
meme-stock identification pipeline. The classifier is trained on the
post-2020 meme era (SEC N-PORT holdings of meme-themed funds, biweekly
reconstitutions, 2021-01 → 2023-06) using **only market-based features**
(no text, no social media), then applied backward through history. Each
model family uses only the data that existed as of its break year, so the
lists answer: *which stocks would a meme-stock fund have held, had it
existed then, judging purely from market behavior?*

## Files

24 CSVs, named `{family}_{label}_{cadence}_top25.csv`:

- **family** — `Mmax`, `M1926`, `M1950`, `M1976`, `M1996`, `M2010` (see below)
- **label** — `state` or `entry` (see below)
- **cadence** — `monthly` or `weekly`

Each file holds the top 25 stocks per period, 25 rows per period, sorted
by period then rank.

### Columns

| column | meaning |
|---|---|
| `ym` / `week` | period: `ym` = calendar month as YYYYMM (monthly files); `week` = last trading day of the week, YYYY-MM-DD (weekly files) |
| `rank` | 1 = highest meme score that period |
| `ticker` | CRSP ticker **as of that date** — tickers are reused across history (e.g. GME = General Motors in the 1980s). Use `permno` as the stable identifier. |
| `company` | issuer name (CRSP) |
| `permno` | CRSP permanent security identifier — the stable key for joins across files and time |
| `score` | linear meme score (cross-sectional; comparable **within** a period only, not across periods — use `rank`/`pctile` for time series) |
| `pctile` | percentile of `score` within the period universe (1.0 = top) |
| `n_universe` | number of stocks scored that period |
| `source_tier` | (Mmax files only) which family produced that period's scores |

## State vs. entry

- **`state` (v7)** — score for *being* a meme stock over the upcoming
  period (trained on: fund membership during period k, features from the
  snapshot before k). The standing meme list.
- **`entry` (v8)** — score for *becoming* a meme stock (trained only on
  prior non-members, label = joins the fund in period k). Ranks stocks by
  resemblance to a fresh meme-cohort entrant; useful for spotting
  new episodes rather than persistent membership.

Both are strictly predictive: every feature is computed before the period
it scores, with realistic reporting lags (fundamentals +4 months, 13F +2
months, short interest +8 business days, FTD +15 calendar days, Form 4 +3
calendar days).

## Model families

Each family is one similarity mapping trained on the same modern labels,
restricted to the feature families whose data existed at its break year.
Later families see richer data but start later.

| Family | Break year | Coverage (monthly / weekly per-family) | New data at break | Feature families |
|---|---|---|---|---|
| `M1926` | 1926 | 1926-02 → 2025-12 | CRSP daily price/volume | F2 |
| `M1950` | 1950 | 1950-01 → 2025-12 | Compustat fundamentals | F2 + F6a |
| `M1976` | 1976 | 1976-01 → 2025-12 | IBES analyst estimates | F2 + F6a + F6b(early) |
| `M1996` | 1996 | 1996-01 → 2025-12 | OptionMetrics option chain | F2 + F1 + F6a + F6b(full) + F5a + F5b |
| `M2010` | 2010 | 2010-01 → 2025-12 | BJZZ retail order flow | F2 + F1 + F6a + F6b(full) + F5a + F5b + F3a + F3b + F4a |
| `Mmax` | — | 1926-02 → 2025-08 | composite | richest family per era, stitched |

`Mmax` is not a tenth model: it hands off across eras — M1926 for
1926–1949, M1950 for 1950–1975, M1976 for 1976–1995, M1996 for 1996–2009,
M2010 for 2010–2025-08 — and `source_tier` records the handoff. It ends
2025-08 (OptionMetrics vintage frontier); the per-family files run through
2025-12, with option/borrow families absent after their source data ends
(late 2025), handled by the standard missing-data rule below.

## Features by family

All features enter the scorer as **within-period cross-sectional
percentile ranks** (missing → 0.5). Stocks missing more than 40% of the
family's features are dropped from that period's universe. The scorer is
an L1-penalized logistic regression fit on the 2021-01 → 2023-06 training
window; the coefficient vectors are frozen (model of record) and applied
unchanged to every period.

### F2 — returns / price dynamics (CRSP daily; all families)
`mom_1m`, `mom_3m`, `mom_6m`, `mom_12m` — trailing returns (21/63/126/252 td);
`vol_1m`, `vol_3m` — realized volatility; `volofvol_12m` — volatility of
monthly vol; `skew_1m`, `skew_3m`, `kurt_3m` — daily-return skewness/kurtosis;
`max_1m`, `min_1m`, `p95_1m` — extreme daily returns (lottery-ness);
`adv_dol`, `adv_dol_spike` — dollar volume level and spike vs. trailing;
`turnover_1m`, `turnover_1m_spike` — share turnover level and spike;
`drawdown_12m` — drawdown from trailing-12m high; `corr_36m` — market
correlation; `price` — share price level; `age_m` — listing age in months.

### F6a — annual fundamentals (Compustat; M1950+)
`neg_ni` — negative net income; `roa` — return on assets; `leverage`;
`cash_at` — cash / assets; `bm` — book-to-market.

### F6b — analyst coverage (IBES; M1976+)
`numest` — number of EPS estimates; `eps_disp` — estimate dispersion.
Full version (M1996+) adds `meanrec` — mean recommendation;
`ptg_implied` — upside implied by consensus price target.

### F5a — institutional ownership (13F; in M1996+)
`breadth` — number of 13F holders; `breadth_chg`; `inst_pct` —
institutional ownership share.

### F5b — insider transactions (Form 4; in M1996+)
`net_sell_pct` — insider net selling; `n_tx_6m` — transaction count, 6m.

### F1 — options surface & flow (OptionMetrics; M1996+)
`atm_iv30` — 30-day ATM implied vol; `skew_25d` — 25-delta put-minus-call
IV; `term_slope` — 30d minus 90d ATM IV (inversion = event pricing);
`iv_spike` — IV vs. trailing; `opt_rel_spread` — option relative bid-ask
spread; `chain_breadth` — listed-contract breadth; `otm_call_share` — OTM
calls' share of the chain; `opt_vol_tot`, `opt_vol_spike` — option volume
level/spike; `call_vol_share`, `otm_call_vol_share`, `shortdte_vol_share`
— call / OTM-call / short-dated share of option volume; `vol_oi` — volume
to open interest; `opt_to_stock_dvol` — option-to-stock dollar volume.

### F3a — short interest (M2010)
`si_pct` — short interest % of shares; `days_to_cover`; `si_chg_3m`.

### F3b — short-side stress (Markit borrow, SEC FTD, Reg SHO; M2010)
`fee` — borrow fee; `fee_spike`; `util` — lendable utilization;
`util_chg_3m`; `dcbs_max` — max borrow-cost bucket; `onloan_pct` — shares
on loan; `ftd_pct`, `ftd_days` — fails-to-deliver level/persistence;
`regsho_days` — days on the Reg SHO threshold list.

### F4a — retail order flow (BJZZ sub-penny; M2010)
`retail_share` — retail share of volume; `retail_imb` — retail order
imbalance; `retail_trade_size`; `trf_share` — off-exchange (TRF) share;
`retail_share_spike`; `retail_imb_chg`.

## How to use

- **The list at a point in time**: filter one file to a single `ym` or
  `week`; the 25 rows are that period's list in rank order.
- **A stock's history**: filter by `permno` (not ticker) across periods;
  `pctile` is the comparable time-series quantity.
- **Comparing families**: same period, same label, different family =
  what each data era's information set says. Divergence between `M1926`
  and `M2010` on the same date shows what the richer data adds.
- **Weekly vs. monthly**: weekly uses trailing trading-day windows ending
  at the last trading day of each week; monthly uses month-end snapshots.
  Same frozen coefficients, so they agree closely but not exactly.
- **Choosing a headline series**: `Mmax_state_*` is the canonical
  "best-available" list per period; per-family files are for
  ladder/robustness views.

### Caveats

- Universe: US common stocks in CRSP (optionable-equity oriented in the
  modern era). NYSE only before 1962; AMEX joins 1962, NASDAQ 1972 — early
  universes are small (`n_universe` column).
- 1926–1949 output (M1926 era) carries the largest concept-transfer
  stretch: 2020s meme behavior mapped onto a pre-options, pre-retail-
  broker market. Treat as suggestive, not a headline claim.
- Raw `score` is not comparable across periods or across families; ranks
  and percentiles are the portable quantities.
- Top-25 is the paper's list convention, not a hard threshold; the cutoff
  at rank 25 is arbitrary. Regenerate with a different N via
  `scratchpad/website_lists_build.py` (data repo).

## Provenance

Built by `scratchpad/website_lists_build.py` from the streams of record:
monthly per-family `models/{family}/results_v{7,8}_meme/stream_monthly_linear.parquet`,
composite `stage3/stream_Mmax_v{7,8}_meme_linear.parquet` and
`stage3/stream_weekly_Mmax_v{7,8}_meme_linear.parquet`; weekly per-family
lists are scored with the identical recipe and frozen coefficients as
`models/build_weekly_streams.py`, extended to each family's full span.
