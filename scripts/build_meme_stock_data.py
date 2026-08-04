#!/usr/bin/env python3
"""Build static JSON for the /data/meme-stocks/ explorer.

Reads meme_stocks_website_lists/*.csv (24 files, see its README.md) and writes
compact JSON under data/meme-stocks/:

  manifest.json          dataset list (order = dataset id used everywhere else)
  idx/{key}.json         sorted period list per dataset (drives the pickers)
  d/{key}/{year}.json    one year of top-25 tables for one dataset
  p/{permno % 100}.json  per-permno appearances + identity timeline (lookup)
  search.json            permno -> distinct tickers/company names (autocomplete)

Row arrays in chunks: [rank, ticker, company, permno, score, pctile].
Appearance arrays in shards: [dataset_id, period, rank, pctile].
Identity timeline entries: [date_int, ticker, company] (change points only).

Rerun after regenerating the CSVs:  python3 scripts/build_meme_stock_data.py
"""
from __future__ import annotations

import csv
import json
import shutil
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "meme_stocks_website_lists"
OUT = ROOT / "data" / "meme-stocks"

FAMILIES = ["Mmax", "M1926", "M1950", "M1976", "M1996", "M2010"]
LABELS = ["state", "entry"]
CADENCES = ["monthly", "weekly"]
N_SHARDS = 100


def date_int(period: str) -> int:
    """Orderable YYYYMMDD int for a period ('192602' or '1926-02-20')."""
    if len(period) == 6:
        return int(period) * 100 + 28  # month treated as month-end
    return int(period.replace("-", ""))


def dump(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, separators=(",", ":")) + "\n")


def main() -> None:
    for sub in ("idx", "d", "p"):
        shutil.rmtree(OUT / sub, ignore_errors=True)

    datasets = []
    # permno -> {date_int: (ticker, company)}
    identity: dict[int, dict[int, tuple[str, str]]] = defaultdict(dict)
    # permno -> [(dataset_id, period, rank, pctile)]
    appearances: dict[int, list] = defaultdict(list)
    total_rows = 0

    for family in FAMILIES:
        for label in LABELS:
            for cadence in CADENCES:
                key = f"{family}_{label}_{cadence}"
                csv_path = SRC / f"{key}_top25.csv"
                ds_id = len(datasets)
                # period -> {"n": n_universe, "tier": ?, "rows": [...]}
                periods: dict[str, dict] = {}
                with csv_path.open(newline="") as fh:
                    for row in csv.DictReader(fh):
                        period = row.get("ym") or row["week"]
                        per = periods.get(period)
                        if per is None:
                            per = periods[period] = {
                                "n": int(row["n_universe"]),
                                "rows": [],
                            }
                            tier = row.get("source_tier")
                            if tier:
                                per["tier"] = tier
                        permno = int(row["permno"])
                        rank = int(row["rank"])
                        ticker = row["ticker"]
                        company = row["company"]
                        score = round(float(row["score"]), 2)
                        pctile = round(float(row["pctile"]), 4)
                        per["rows"].append(
                            [rank, ticker, company, permno, score, pctile]
                        )
                        identity[permno][date_int(period)] = (ticker, company)
                        appearances[permno].append((ds_id, period, rank, pctile))
                        total_rows += 1

                ordered = sorted(periods)
                for per in periods.values():
                    per["rows"].sort()
                dump(OUT / "idx" / f"{key}.json", {"key": key, "periods": ordered})
                by_year: dict[str, dict] = defaultdict(dict)
                for period in ordered:
                    by_year[period[:4]][period] = periods[period]
                for year, chunk in by_year.items():
                    dump(OUT / "d" / key / f"{year}.json", chunk)

                datasets.append(
                    {
                        "key": key,
                        "family": family,
                        "label": label,
                        "cadence": cadence,
                        "first": ordered[0],
                        "last": ordered[-1],
                        "n_periods": len(ordered),
                        "csv": f"{key}_top25.csv",
                        "csv_bytes": csv_path.stat().st_size,
                    }
                )
                print(f"{key}: {len(ordered)} periods, {len(by_year)} year chunks")

    # --- permno shards: identity timeline (change points) + appearances ---
    shards: dict[int, dict] = defaultdict(dict)
    search = []
    for permno in sorted(identity):
        timeline = []
        for d in sorted(identity[permno]):
            ticker, company = identity[permno][d]
            if not timeline or (timeline[-1][1], timeline[-1][2]) != (ticker, company):
                timeline.append([d, ticker, company])
        apps = sorted(appearances[permno])
        shards[permno % N_SHARDS][str(permno)] = {
            "n": timeline,
            "a": [list(a) for a in apps],
        }
        tickers, names = [], []
        for _, ticker, company in timeline:
            if ticker and ticker not in tickers:
                tickers.append(ticker)
            if company and company not in names:
                names.append(company)
        search.append([permno, " ".join(tickers), names])

    for shard_id, contents in shards.items():
        dump(OUT / "p" / f"{shard_id}.json", contents)
    dump(OUT / "search.json", search)
    dump(OUT / "manifest.json", {"datasets": datasets, "n_shards": N_SHARDS})

    n_appearances = sum(len(v) for v in appearances.values())
    print(f"rows read: {total_rows}, appearances written: {n_appearances}")
    if total_rows != n_appearances:
        sys.exit("MISMATCH between rows read and appearances written")
    print(f"permnos: {len(identity)}, shards: {len(shards)}")


if __name__ == "__main__":
    main()
