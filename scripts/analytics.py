"""
analytics.py — standalone port of the analytics functions from
.mindos/skills/karma_fitness/analyser.py (muscle groups, junk volume,
progression, regression watch, rep-range distribution, ACWR, consistency).

Kept in sync by hand with the monorepo version; this copy exists so
GitHub Actions (scoped to just this repo) can run the sync without
depending on the untracked .mindos/skills directory.
"""
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

MUSCLE_MAP_CACHE = Path(__file__).parent / "exercise_muscle_map.json"


def get_exercise_muscle_map(fetch_templates_fn, force: bool = False) -> dict[str, str]:
    if not force and MUSCLE_MAP_CACHE.exists():
        try:
            return json.loads(MUSCLE_MAP_CACHE.read_text(encoding="utf-8"))
        except Exception:
            pass
    templates = fetch_templates_fn()
    muscle_map = {t["id"]: t.get("primary_muscle_group", "other") for t in templates}
    if muscle_map:
        MUSCLE_MAP_CACHE.write_text(json.dumps(muscle_map, indent=2), encoding="utf-8")
    return muscle_map


def compute_muscle_groups(workouts: list[dict], muscle_map: dict[str, str]) -> list[dict]:
    agg: dict[str, dict] = defaultdict(lambda: {"vol": 0.0, "sets": 0})
    for w in workouts:
        for ex in w.get("exercises", []):
            muscle = muscle_map.get(ex.get("exercise_id"), "other")
            name = muscle.replace("_", " ").title() if muscle else "Other"
            agg[name]["vol"] += ex["total_volume_kg"]
            agg[name]["sets"] += ex["total_sets"]
    return [
        {"name": name, "vol": round(v["vol"], 1), "sets": v["sets"]}
        for name, v in sorted(agg.items(), key=lambda kv: -kv[1]["vol"])
    ]


def compute_junk_volume(workouts: list[dict], threshold: int = 8) -> list[dict]:
    flags = []
    for w in workouts:
        for ex in w.get("exercises", []):
            working_sets = [s for s in ex["sets"] if s["set_type"] != "warmup"]
            if len(working_sets) > threshold:
                flags.append({
                    "date": w["date"],
                    "name": ex["title"],
                    "sets": len(working_sets),
                    "session": w["title"],
                })
    return sorted(flags, key=lambda f: f["date"], reverse=True)


def compute_progression(workouts: list[dict], min_sessions: int = 2) -> list[dict]:
    by_exercise: dict[str, list[dict]] = defaultdict(list)
    for w in sorted(workouts, key=lambda x: x["date"]):
        for ex in w.get("exercises", []):
            working_sets = [s for s in ex["sets"] if s["set_type"] != "warmup"]
            if not working_sets:
                continue
            best_set = max(working_sets, key=lambda s: s["weight_kg"])
            by_exercise[ex["title"]].append({"date": w["date"], "weight_kg": best_set["weight_kg"]})

    result = []
    for name, points in by_exercise.items():
        if len(points) < min_sessions:
            continue
        first, last = points[0]["weight_kg"], points[-1]["weight_kg"]
        best = max(p["weight_kg"] for p in points)
        delta = round(last - first, 1)
        pct = round((delta / first) * 100) if first else 0
        result.append({
            "name": name,
            "sessions": len(points),
            "first": first,
            "last": last,
            "best": best,
            "delta": delta,
            "pct": pct,
            "series": [p["weight_kg"] for p in points],
        })
    return sorted(result, key=lambda r: -r["sessions"])


def compute_regression_watch(progression: list[dict], pct_threshold: int = -10) -> list[dict]:
    return sorted([p for p in progression if p["pct"] <= pct_threshold], key=lambda p: p["pct"])


def rep_range_distribution(workouts: list[dict]) -> dict:
    bins = {"strength": 0, "hyper": 0, "endu": 0}
    for w in workouts:
        for ex in w.get("exercises", []):
            for s in ex["sets"]:
                if s["set_type"] == "warmup" or not s["reps"]:
                    continue
                if s["reps"] <= 5:
                    bins["strength"] += 1
                elif s["reps"] <= 12:
                    bins["hyper"] += 1
                else:
                    bins["endu"] += 1
    return {**bins, "total": sum(bins.values())}


def compute_acwr(workouts: list[dict]) -> dict:
    dated = [w for w in workouts if w["date"]]
    if not dated:
        return {"acwr": 0, "acute": 0, "chronic": 0}
    last_date = max(datetime.fromisoformat(w["date"]).date() for w in dated)
    acute_total = sum(w["total_volume_kg"] for w in dated
                       if (last_date - datetime.fromisoformat(w["date"]).date()).days < 7)
    chronic_total = sum(w["total_volume_kg"] for w in dated
                         if (last_date - datetime.fromisoformat(w["date"]).date()).days < 28)
    acute = acute_total / 7
    chronic = chronic_total / 28
    acwr = round(acute / chronic, 2) if chronic else 0
    return {"acwr": acwr, "acute": round(acute, 1), "chronic": round(chronic, 1)}


def session_streak(workouts: list[dict]) -> dict:
    if not workouts:
        return {"current": 0, "longest": 0, "last_session": None, "total_sessions": 0}
    dates = sorted({w["date"] for w in workouts if w["date"]}, reverse=True)
    today = datetime.now().date()
    streak = 0
    prev = today
    for d_str in dates:
        d = datetime.fromisoformat(d_str).date()
        gap = (prev - d).days
        if gap <= 1:
            streak += 1
            prev = d
        else:
            break
    all_dates = sorted({datetime.fromisoformat(d).date() for d in dates})
    longest = 1
    run = 1
    for i in range(1, len(all_dates)):
        if (all_dates[i] - all_dates[i - 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    return {"current": streak, "longest": longest, "last_session": dates[0] if dates else None,
            "total_sessions": len(dates)}


def consistency_stats(workouts: list[dict]) -> dict:
    streak = session_streak(workouts)
    dates = sorted({datetime.fromisoformat(w["date"]).date() for w in workouts if w["date"]})
    if len(dates) < 2:
        return {**streak, "median_gap_days": 0, "cv": 0}
    gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
    gaps_sorted = sorted(gaps)
    mid = len(gaps_sorted) // 2
    median_gap = gaps_sorted[mid] if len(gaps_sorted) % 2 else (gaps_sorted[mid - 1] + gaps_sorted[mid]) / 2
    mean_gap = sum(gaps) / len(gaps)
    variance = sum((g - mean_gap) ** 2 for g in gaps) / len(gaps)
    cv = round((variance ** 0.5) / mean_gap, 2) if mean_gap else 0
    return {**streak, "median_gap_days": median_gap, "cv": cv}
