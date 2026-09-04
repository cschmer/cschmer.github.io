#!/usr/bin/env python3
"""Build static JSON for the /data/trend-slope-strength/ explorer.

Reads trend_slope_strength_data/*.csv (see its README.md for the data
dictionary) and writes compact JSON under data/trend-slope-strength/:

  manifest.json      specifications, sample spans, benchmark signal lists,
                     CSV download table (name, bytes, group, description),
                     and the headline reproduction checks from the README
  summary.json       every row of summary_stats.csv keyed by series name:
                     {start, end, n_days, ret, vol, sharpe, mdd, alpha, t,
                      mom_beta, r2, excess}  (pct units as in the CSV)
  ts.json            {"dates": [...], "growth": {spec: [...]}} growth of $1
                     for the four TS series (full_ew, full_vw, top500_ew,
                     top500_vw), monthly
  rolling.json       {"dates": [...], spec: {"alpha": [...], "t": [...]}}
                     trailing 60-month FF6 alpha (annualized %) and t-stat
  p/{spec}.json      {"dates": [...], "growth": {"RQ1_SQ1": [...], ...}}
                     growth of $1 for the 25 double-sort cells, monthly
  b/{w}.json         {"dates": [...], "growth": {signal: [...]}} growth of $1
                     for the D10-D1 benchmark spreads (chart-window
                     formation), w in {ew, vw}, monthly
  b/index.json       {key: {"dates": [...], "growth": [...]}} growth of $1 for
                     the S&P 500 and NASDAQ index benchmarks (sp500_ew,
                     sp500_vw, nasdaq_ew, nasdaq_vw); each series carries its
                     own dates because NASDAQ coverage starts in 1973

Growth series start at 1.0 on the month before the first return, so
dates[0] is that base month and growth[k] is the value at the end of
dates[k]. Floats are rounded to 5 significant digits. The CSVs are never
modified.

Rerun after regenerating the CSVs:  python3 scripts/build_ts_data.py
"""
from __future__ import annotations

import csv
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "trend_slope_strength_data"
OUT = ROOT / "data" / "trend-slope-strength"

SPECS = ["full_ew", "full_vw", "top500_ew", "top500_vw"]
SPEC_LABELS = {
    "full_ew": "Full universe, equal weight",
    "full_vw": "Full universe, value weight",
    "top500_ew": "Top 500, equal weight",
    "top500_vw": "Top 500, value weight",
}
WEIGHTINGS = ["ew", "vw"]
CONVENTION = "chartwindow"  # the paper's baseline; skip-21 files are not exported
INDEX_SERIES = ["sp500_ew", "sp500_vw", "nasdaq_ew", "nasdaq_vw"]
INDEX_LABELS = {
    "sp500_ew": "S&P 500, equal weight",
    "sp500_vw": "S&P 500, value weight",
    "nasdaq_ew": "NASDAQ, equal weight",
    "nasdaq_vw": "NASDAQ, value weight",
}
SIGNAL_LABELS = {
    "R2": "Unsigned R² (trend strength)",
    "SignedR2": "Signed R²",
    "TSlope": "Slope t-statistic",
    "Slope": "Slope",
    "Mom12m": "12-month momentum",
    "Mom6m": "6-month momentum",
    "IntMom": "Intermediate momentum (months 7–12)",
    "STreversal": "Short-term reversal (prior month)",
    "LRreversal": "Long-run reversal (months 13–60)",
    "MRreversal": "Medium-run reversal (months 13–36)",
    "High52": "52-week high",
    "MomVol": "Momentum-volatility",
    "IndMom": "Industry momentum",
    "ResidualMom": "Residual momentum",
    "TrendFactor": "Trend factor (Han, Zhou and Zhu 2016)",
}

# (file, group, description) for the downloads table on methodology.html
FILES = [
    ("ts_factor_daily.csv", "Headline series", "TS factor in four specifications, daily returns"),
    ("ts_factor_monthly.csv", "Headline series", "TS factor in four specifications, monthly returns"),
    ("portfolios25_full_ew_daily.csv", "Headline series", "25 double-sort cells, full universe, equal weight, daily"),
    ("portfolios25_full_ew_monthly.csv", "Headline series", "25 double-sort cells, full universe, equal weight, monthly"),
    ("portfolios25_full_vw_daily.csv", "Headline series", "25 double-sort cells, full universe, value weight, daily"),
    ("portfolios25_full_vw_monthly.csv", "Headline series", "25 double-sort cells, full universe, value weight, monthly"),
    ("portfolios25_top500_ew_daily.csv", "Headline series", "25 double-sort cells, top 500, equal weight, daily"),
    ("portfolios25_top500_ew_monthly.csv", "Headline series", "25 double-sort cells, top 500, equal weight, monthly"),
    ("portfolios25_top500_vw_daily.csv", "Headline series", "25 double-sort cells, top 500, value weight, daily"),
    ("portfolios25_top500_vw_monthly.csv", "Headline series", "25 double-sort cells, top 500, value weight, monthly"),
    ("rolling_ff6_alpha_60m.csv", "Headline series", "Trailing 60-month daily FF6 regression at each month-end, four TS series"),
    ("summary_stats.csv", "Headline series", "Full-sample statistics for every published series, including all 100 cells"),
    ("benchmark_spreads_ew_chartwindow_daily.csv", "Benchmark spreads", "D10−D1 spreads, equal weight, chart-window formation, daily"),
    ("benchmark_spreads_ew_chartwindow_monthly.csv", "Benchmark spreads", "D10−D1 spreads, equal weight, chart-window formation, monthly"),
    ("benchmark_spreads_vw_chartwindow_daily.csv", "Benchmark spreads", "D10−D1 spreads, value weight, chart-window formation, daily"),
    ("benchmark_spreads_vw_chartwindow_monthly.csv", "Benchmark spreads", "D10−D1 spreads, value weight, chart-window formation, monthly"),
    ("benchmark_spreads_ew_skip21_daily.csv", "Benchmark spreads", "D10−D1 spreads, equal weight, skip-21 formation, daily"),
    ("benchmark_spreads_ew_skip21_monthly.csv", "Benchmark spreads", "D10−D1 spreads, equal weight, skip-21 formation, monthly"),
    ("benchmark_spreads_vw_skip21_daily.csv", "Benchmark spreads", "D10−D1 spreads, value weight, skip-21 formation, daily"),
    ("benchmark_spreads_vw_skip21_monthly.csv", "Benchmark spreads", "D10−D1 spreads, value weight, skip-21 formation, monthly"),
    ("index_benchmarks_daily.csv", "Index benchmarks", "S&P 500 and NASDAQ, equal and value weight, daily"),
    ("index_benchmarks_monthly.csv", "Index benchmarks", "S&P 500 and NASDAQ, equal and value weight, monthly"),
    ("factor_level_ts_daily.csv", "Factor-level strategies", "TS logic applied to a 17-factor universe, daily"),
    ("factor_level_ts_monthly.csv", "Factor-level strategies", "TS logic applied to a 17-factor universe, monthly"),
    ("breakpoints_monthly.csv", "Sort diagnostics", "R² and within-R² slope quintile breakpoints per formation date and universe"),
    ("cell_stats_monthly.csv", "Sort diagnostics", "Per-cell stock counts, mean R², slope, and market cap per formation date"),
    ("README.md", "Documentation", "Data dictionary: every file, column, unit, and regression convention"),
]

# Headline reproduction checks from the README (used by the explorer's self-test)
CHECKS = {
    "ts_full_vw": {"ret": 17.9, "sharpe": 0.78, "alpha": 10.4, "t": 4.65},
    "ts_full_ew": {"ret": 13.4, "sharpe": 0.89, "alpha": 6.9, "t": 5.08},
    "ts_top500_ew": {"ret": 14.4, "sharpe": 0.63, "alpha": 7.4, "t": 3.53},
    "ts_top500_vw": {"ret": 14.4, "sharpe": 0.58, "alpha": 7.3, "t": 2.94},
    "D10-D1_R2_ew_chartwindow": {"ret": 8.8, "sharpe": 1.03, "alpha": 6.9, "t": 5.43},
}


def sig(x: float, n: int = 5) -> float:
    """Round to n significant digits (keeps JSON small)."""
    return float(f"{x:.{n}g}")


def month(date: str) -> str:
    return date[:7]


def prev_month(ym: str) -> str:
    y, m = int(ym[:4]), int(ym[5:7])
    return f"{y - 1}-12" if m == 1 else f"{y}-{m - 1:02d}"


def dump(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, separators=(",", ":")) + "\n")


def read_monthly(name: str, date_col: str = "date") -> tuple[list[str], dict[str, list[float]]]:
    """Return (months, {column: returns}) for a monthly return CSV."""
    with (SRC / name).open(newline="") as fh:
        reader = csv.DictReader(fh)
        cols = [c for c in reader.fieldnames if c != date_col]
        dates, series = [], {c: [] for c in cols}
        for row in reader:
            dates.append(month(row[date_col]))
            for c in cols:
                series[c].append(float(row[c]))
    return dates, series


def growth(returns: list[float]) -> list[float]:
    """Growth of $1, with a leading 1.0 for the base month."""
    out, v = [1.0], 1.0
    for r in returns:
        v *= 1.0 + r
        out.append(sig(v))
    return out


def growth_file(dates: list[str], series: dict[str, list[float]]) -> dict:
    return {
        "dates": [prev_month(dates[0])] + dates,
        "growth": {k: growth(v) for k, v in series.items()},
    }


def daily_spread_error(spec: str) -> float:
    """Max |RQ5_SQ5 - RQ1_SQ1 - ts| over daily rows for one specification."""
    with (SRC / "ts_factor_daily.csv").open(newline="") as fh:
        ts = {row["date"]: float(row[f"ts_{spec}"]) for row in csv.DictReader(fh)}
    worst = 0.0
    with (SRC / f"portfolios25_{spec}_daily.csv").open(newline="") as fh:
        for row in csv.DictReader(fh):
            err = abs(float(row["RQ5_SQ5"]) - float(row["RQ1_SQ1"]) - ts[row["date"]])
            worst = max(worst, err)
    return worst


def main() -> None:
    for sub in ("p", "b"):
        shutil.rmtree(OUT / sub, ignore_errors=True)

    # --- summary_stats.csv -> summary.json ---
    summary: dict[str, dict] = {}
    with (SRC / "summary_stats.csv").open(newline="") as fh:
        for row in csv.DictReader(fh):
            summary[row["series"]] = {
                "start": row["start"],
                "end": row["end"],
                "n_days": int(row["n_days"]),
                "ret": sig(float(row["ann_ret_pct"])),
                "vol": sig(float(row["ann_vol_pct"])),
                "sharpe": sig(float(row["sharpe"])),
                "mdd": sig(float(row["max_drawdown_pct"])),
                "alpha": sig(float(row["ff6_alpha_ann_pct"])),
                "t": sig(float(row["ff6_t_alpha"])),
                "mom_beta": sig(float(row["ff6_mom_beta"])),
                "r2": sig(float(row["ff6_r2"])),
                "excess": row["excess_of_rf_in_regression"] == "True",
            }
    for spec in SPECS:
        assert f"ts_{spec}" in summary, spec
        for i in range(1, 6):
            for j in range(1, 6):
                assert f"RQ{i}_SQ{j}_{spec}" in summary, (i, j, spec)
    for name, want in CHECKS.items():
        got = summary[name]
        for k, v in want.items():
            if abs(round(got[k], 2 if k in ("sharpe", "t") else 1) - v) > 1e-9:
                sys.exit(f"CHECK FAILED {name}.{k}: csv {got[k]} vs README {v}")
    dump(OUT / "summary.json", summary)
    print(f"summary.json: {len(summary)} series, headline checks pass")

    # --- ts_factor_monthly.csv -> ts.json ---
    dates, series = read_monthly("ts_factor_monthly.csv")
    assert list(series) == [f"ts_{s}" for s in SPECS]
    ts = growth_file(dates, {k[3:]: v for k, v in series.items()})
    dump(OUT / "ts.json", ts)
    print(f"ts.json: {len(dates)} months {dates[0]} → {dates[-1]}")

    # --- portfolios25_*_monthly.csv -> p/{spec}.json ---
    for spec in SPECS:
        pdates, pseries = read_monthly(f"portfolios25_{spec}_monthly.csv")
        assert pdates == dates, spec
        assert len(pseries) == 25, spec
        # RQ5_SQ5 - RQ1_SQ1 reproduces the TS factor on daily returns (README
        # claim); it cannot hold after monthly compounding, so check daily.
        worst = daily_spread_error(spec)
        if worst > 1e-6:
            sys.exit(f"{spec}: daily RQ5_SQ5 - RQ1_SQ1 differs from ts by {worst}")
        dump(OUT / "p" / f"{spec}.json", growth_file(pdates, pseries))
        print(f"p/{spec}.json: 25 cells, daily spread identity holds (max err {worst:.1e})")

    # --- benchmark_spreads_{w}_chartwindow_monthly.csv -> b/{w}.json ---
    benchmarks = {}
    for w in WEIGHTINGS:
        bdates, bseries = read_monthly(f"benchmark_spreads_{w}_{CONVENTION}_monthly.csv")
        for sig_name in bseries:
            assert sig_name in SIGNAL_LABELS, sig_name
        dump(OUT / "b" / f"{w}.json", growth_file(bdates, bseries))
        benchmarks[w] = {"signals": list(bseries), "first": bdates[0], "last": bdates[-1]}
        print(f"b/{w}.json: {len(bseries)} signals, {bdates[0]} → {bdates[-1]}")

    # --- index_benchmarks_monthly.csv -> b/index.json (per-series dates) ---
    index_out, index_meta = {}, {}
    with (SRC / "index_benchmarks_monthly.csv").open(newline="") as fh:
        rows = list(csv.DictReader(fh))
    for key in INDEX_SERIES:
        idates = [month(r["date"]) for r in rows if r[key] != ""]
        ivals = [float(r[key]) for r in rows if r[key] != ""]
        assert idates == [month(r["date"]) for r in rows][len(rows) - len(idates):], key
        index_out[key] = {"dates": [prev_month(idates[0])] + idates, "growth": growth(ivals)}
        index_meta[key] = {"label": INDEX_LABELS[key], "first": idates[0], "last": idates[-1]}
        print(f"b/index.json: {key} {idates[0]} → {idates[-1]}")
    dump(OUT / "b" / "index.json", index_out)

    # --- rolling_ff6_alpha_60m.csv -> rolling.json ---
    by_spec: dict[str, dict[str, list]] = {s: {"dates": [], "alpha": [], "t": []} for s in SPECS}
    with (SRC / "rolling_ff6_alpha_60m.csv").open(newline="") as fh:
        for row in csv.DictReader(fh):
            spec = row["series"][3:]
            by_spec[spec]["dates"].append(month(row["date"]))
            by_spec[spec]["alpha"].append(sig(float(row["ff6_alpha_ann_pct"])))
            by_spec[spec]["t"].append(sig(float(row["ff6_t_alpha"]), 4))
    rdates = by_spec["full_vw"]["dates"]
    for spec in SPECS:
        assert by_spec[spec]["dates"] == rdates, spec
    rolling = {"dates": rdates}
    for spec in SPECS:
        rolling[spec] = {"alpha": by_spec[spec]["alpha"], "t": by_spec[spec]["t"]}
    dump(OUT / "rolling.json", rolling)
    print(f"rolling.json: {len(rdates)} month-ends {rdates[0]} → {rdates[-1]}")

    # --- manifest.json ---
    files = []
    for name, group, desc in FILES:
        path = SRC / name
        if not path.exists():
            sys.exit(f"missing source file {name}")
        files.append({"name": name, "bytes": path.stat().st_size, "group": group, "desc": desc})
    manifest = {
        "specs": [{"key": s, "label": SPEC_LABELS[s]} for s in SPECS],
        "sample": {"first": dates[0], "last": dates[-1], "n_months": len(dates)},
        "rolling": {"first": rdates[0], "last": rdates[-1]},
        "benchmarks": benchmarks,
        "convention": "chart window [t-252, t]",
        "signal_labels": SIGNAL_LABELS,
        "index_benchmarks": index_meta,
        "checks": CHECKS,
        "files": files,
    }
    dump(OUT / "manifest.json", manifest)
    total = sum(p.stat().st_size for p in OUT.rglob("*.json"))
    print(f"manifest.json: {len(files)} files listed; JSON total {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
