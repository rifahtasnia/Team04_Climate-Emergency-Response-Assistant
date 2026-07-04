#!/usr/bin/env python3
"""Reproduce the dataset figures used by AEGIS documentation and fixtures."""

from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUTPUT = ROOT / "data" / "processed" / "dataset-summary.json"


def disaster_summary() -> dict:
    targets: Counter[str] = Counter()
    events: Counter[str] = Counter()
    labels: Counter[str] = Counter()
    rows = 0

    with (RAW / "disaster-reports-train.csv").open(
        encoding="utf-8", newline=""
    ) as source:
        for row in csv.DictReader(source):
            rows += 1
            targets[row["target"]] += 1
            events[row["event_type"]] += 1
            for label in row["label"].split(","):
                labels[label.strip()] += 1

    return {
        "records": rows,
        "relevant": targets["1"],
        "flood_reports": events["flood"],
        "top_labels": labels.most_common(12),
    }


def toronto_climate_summary() -> dict:
    with (RAW / "toronto-climate-variables.csv").open(newline="") as source:
        reader = csv.DictReader(source)
        rows = list(reader)
        fields = reader.fieldnames or []

    baseline = next(
        row
        for row in rows
        if row["Climate Scenario"] == "OBSERVED_TORONTO_AVERAGE"
        and row["Distribution"] == "MEDIAN"
    )
    future = next(
        row
        for row in rows
        if row["Climate Scenario"] == "SSP5-8.5"
        and row["Time Horizon"] == "2071-2100"
        and row["Distribution"] == "MEDIAN"
    )

    return {
        "rows": len(rows),
        "columns": len(fields),
        "baseline_maximum_one_day_precipitation_mm": float(
            baseline["MAXIMUM_1DAY_PRECIPITATION"]
        ),
        "future_maximum_one_day_precipitation_mm": float(
            future["MAXIMUM_1DAY_PRECIPITATION"]
        ),
        "future_days_above_35c": float(future["DAYS_ABOVE_35C"]),
    }


def survey_summary() -> dict:
    with (RAW / "transformto-resident-survey.csv").open(
        encoding="cp1252", newline=""
    ) as source:
        reader = csv.DictReader(source)
        rows = list(reader)
        fields = reader.fieldnames or []

    equitable_forest = sum(bool(row[fields[29]].strip()) for row in rows)
    climate_lens = sum(bool(row[fields[30]].strip()) for row in rows)

    return {
        "responses": len(rows),
        "fields": len(fields),
        "equitable_forest_support": equitable_forest,
        "climate_lens_support": climate_lens,
    }


def montreal_summary() -> dict:
    files = sorted(RAW.glob("montreal-ghg-*.csv"))
    year_totals: defaultdict[int, float] = defaultdict(float)

    for path in files:
        with path.open(encoding="utf-8", newline="") as source:
            for row in csv.DictReader(source):
                year = int(row["Year"])
                year_totals[year] += float((row["Total tCO2e"] or "0").replace(",", ""))

    latest_year = max(year_totals)
    return {
        "sectors": len(files),
        "latest_year": latest_year,
        "latest_total_tco2e": round(year_totals[latest_year]),
    }


def africa_summary() -> dict:
    files = sorted((RAW / "africa-climate").glob("*.csv"))
    years: list[int] = []

    for path in files:
        with path.open(encoding="utf-8", newline="") as source:
            for row in csv.DictReader(source):
                years.append(int(row["Year"][:4]))

    return {
        "countries": len(files),
        "first_year": min(years),
        "last_year": max(years),
    }


def main() -> None:
    summary = {
        "natural_disasters_from_social_media": disaster_summary(),
        "toronto_current_and_future_climate": toronto_climate_summary(),
        "transformto_resident_survey": survey_summary(),
        "montreal_ghg_inventory": montreal_summary(),
        "african_climate_indicators": africa_summary(),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(OUTPUT)


if __name__ == "__main__":
    main()
