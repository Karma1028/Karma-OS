#!/usr/bin/env python3
"""
sync_dashboard_data.py — live Hevy data -> public/data/hevy.json + stats.json

Self-contained (no dependency on the main monorepo's .mindos/skills) so
this can run from a GitHub Actions checkout of just this repo. Reads
HEVY_API_KEY from the environment (set as a repo secret in CI, or a
local .env / shell export for manual runs).

Usage:
  python scripts/sync_dashboard_data.py            # use cached data if present
  python scripts/sync_dashboard_data.py --force    # re-fetch from Hevy API
  python scripts/sync_dashboard_data.py --dry-run  # print instead of writing
"""
import sys
import json
import argparse
from pathlib import Path
from collections import Counter
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
import hevy_client
import analytics

REPO_ROOT = Path(__file__).parent.parent
DASHBOARD_DATA = REPO_ROOT / "public" / "data"


def build_hevy_json(workouts: list[dict], muscle_map: dict[str, str]) -> dict:
    dated = [w for w in workouts if w["date"]]
    total_volume_kg = round(sum(w["total_volume_kg"] for w in dated))
    total_sets = sum(w["total_sets"] for w in dated)
    avg_duration = round(sum(w["duration_min"] for w in dated) / len(dated)) if dated else 0

    weekly_vol = hevy_client.get_weekly_volume(workouts)
    weekly_counts = [w["sessions"] for w in weekly_vol[-12:]]

    recent = [{
        "title": w["title"],
        "date": w["date"],
        "mins": w["duration_min"],
        "vol": round(w["total_volume_kg"]),
        "sets": w["total_sets"],
        "exercises": [ex["title"] for ex in w["exercises"]],
    } for w in sorted(dated, key=lambda w: w["date"], reverse=True)[:7]]

    pbs = hevy_client.get_personal_bests(workouts)
    prs = sorted(
        [{"name": name, "weight": v["weight_kg"], "reps": v["reps"], "date": v["date"]}
         for name, v in pbs.items()],
        key=lambda p: p["date"], reverse=True,
    )[:8]

    split_counts = dict(Counter(w["title"] for w in dated))

    summary = {
        "total_workouts": len(dated),
        "first_date": min(w["date"] for w in dated) if dated else "",
        "last_date": max(w["date"] for w in dated) if dated else "",
        "total_volume_kg": total_volume_kg,
        "total_sets": total_sets,
        "avg_duration_min": avg_duration,
        "weekly_counts": weekly_counts,
        "recent": recent,
        "prs": prs,
        "split_counts": split_counts,
    }

    progression = analytics.compute_progression(workouts)
    analytics_out = {
        "muscle_groups": analytics.compute_muscle_groups(workouts, muscle_map),
        "weekly_volume": [{"week": w["week"], "vol": w["volume_kg"]} for w in weekly_vol],
        "progression": progression,
        "regression_watch": analytics.compute_regression_watch(progression),
    }

    audit = {"junk_volume": analytics.compute_junk_volume(workouts)}

    return {"hevy_summary": summary, "hevy_analytics": analytics_out, "hevy_audit": audit}


def build_fitness_stats(workouts: list[dict]) -> dict:
    consistency = analytics.consistency_stats(workouts)
    acwr = analytics.compute_acwr(workouts)
    rep = analytics.rep_range_distribution(workouts)
    weekly_vol = hevy_client.get_weekly_volume(workouts)
    dated = [w for w in workouts if w["date"]]
    total_weeks = 0
    if dated:
        first = datetime.fromisoformat(min(w["date"] for w in dated)).date()
        last = datetime.fromisoformat(max(w["date"] for w in dated)).date()
        total_weeks = max(1, (last - first).days // 7 + 1)
    return {
        **acwr,
        "rep": rep,
        "maxStreak": consistency["longest"],
        "medGap": consistency["median_gap_days"],
        "cv": consistency["cv"],
        "activeWeeks": len(weekly_vol),
        "totalWeeks": total_weeks,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-fetch from Hevy API instead of cache")
    ap.add_argument("--dry-run", action="store_true", help="print instead of writing files")
    args = ap.parse_args()

    workouts = hevy_client.sync(force=args.force)
    if not workouts:
        print("[ERROR] sync_dashboard_data: no workouts available, aborting")
        sys.exit(1)

    muscle_map = analytics.get_exercise_muscle_map(hevy_client.fetch_exercise_templates, force=args.force)
    hevy_json = build_hevy_json(workouts, muscle_map)
    fitness_stats = build_fitness_stats(workouts)

    if args.dry_run:
        print(json.dumps(hevy_json, indent=2)[:2000])
        print("--- fitness stats ---")
        print(json.dumps(fitness_stats, indent=2))
        return

    (DASHBOARD_DATA / "hevy.json").write_text(json.dumps(hevy_json, indent=2), encoding="utf-8")
    print(f"[INFO] wrote {DASHBOARD_DATA / 'hevy.json'}")

    stats_path = DASHBOARD_DATA / "stats.json"
    stats = json.loads(stats_path.read_text(encoding="utf-8"))
    stats["fitness"] = fitness_stats
    stats_path.write_text(json.dumps(stats, indent=2), encoding="utf-8")
    print(f"[INFO] updated {stats_path} (fitness section)")


if __name__ == "__main__":
    main()
