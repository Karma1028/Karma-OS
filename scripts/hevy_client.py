"""
hevy_client.py — minimal, self-contained Hevy API client.

Standalone port of the fetch/parse logic from
.mindos/skills/karma_fitness/hevy.py so this repo's data sync doesn't
depend on the main monorepo's untracked skills directory (GitHub Actions
only checks out this repo).

Auth: api-key header (not Bearer). API docs: https://api.hevyapp.com/docs
"""
import json
import os
import time
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path

HEVY_BASE_URL = "https://api.hevyapp.com/v1"
CACHE_FILE = Path(__file__).parent / "hevy_cache.json"


def _headers():
    return {
        "api-key": os.environ["HEVY_API_KEY"],
        "Content-Type": "application/json",
        "accept": "application/json",
    }


def _get(endpoint: str, params: dict = None) -> dict:
    url = f"{HEVY_BASE_URL}/{endpoint.lstrip('/')}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        print(f"[ERROR] hevy_client._get {endpoint}: {e}")
        return {}


def fetch_all_workouts(page_size: int = 10) -> list[dict]:
    all_workouts = []
    page = 1
    while True:
        data = _get("workouts", {"page": page, "pageSize": page_size})
        workouts = data.get("workouts", [])
        if not workouts:
            break
        all_workouts.extend(workouts)
        page_count = data.get("page_count", 1)
        print(f"[INFO] hevy_client: fetched page {page}/{page_count} ({len(workouts)} workouts)")
        if page >= page_count:
            break
        page += 1
        time.sleep(0.3)
    return all_workouts


def fetch_exercise_templates() -> list[dict]:
    all_ex = []
    page = 1
    while True:
        data = _get("exercise_templates", {"page": page, "pageSize": 100})
        items = data.get("exercise_templates", [])
        if not items:
            break
        all_ex.extend(items)
        if page >= data.get("page_count", 1):
            break
        page += 1
    return all_ex


def parse_workout(raw: dict) -> dict:
    exercises = []
    total_volume_kg = 0.0
    total_sets = 0

    for ex in raw.get("exercises", []):
        sets_parsed = []
        ex_volume = 0.0
        for s in ex.get("sets", []):
            weight_kg = float(s.get("weight_kg") or s.get("weight") or 0)
            reps = int(s.get("reps") or 0)
            vol = weight_kg * reps
            ex_volume += vol
            sets_parsed.append({
                "set_index": s.get("index", len(sets_parsed) + 1),
                "set_type": s.get("set_type", "normal"),
                "weight_kg": weight_kg,
                "reps": reps,
                "rpe": s.get("rpe"),
                "notes": (s.get("notes") or "").strip(),
                "volume_kg": vol,
            })
        total_volume_kg += ex_volume
        total_sets += len(sets_parsed)
        exercises.append({
            "exercise_id": ex.get("exercise_template_id"),
            "title": ex.get("title", "Unknown"),
            "notes": (ex.get("notes") or "").strip(),
            "sets": sets_parsed,
            "total_sets": len(sets_parsed),
            "total_volume_kg": ex_volume,
            "max_weight_kg": max((s["weight_kg"] for s in sets_parsed), default=0),
            "max_reps": max((s["reps"] for s in sets_parsed), default=0),
        })

    start_at = raw.get("start_time") or raw.get("created_at", "")
    end_at = raw.get("end_time", "")
    duration_min = raw.get("duration") or 0
    if not duration_min and start_at and end_at:
        try:
            duration_min = round((datetime.fromisoformat(end_at) - datetime.fromisoformat(start_at)).total_seconds() / 60)
        except Exception:
            duration_min = 0

    return {
        "id": raw.get("id"),
        "title": raw.get("title", "Workout"),
        "description": (raw.get("description") or "").strip(),
        "date": start_at[:10] if start_at else "",
        "start_time": start_at,
        "end_time": end_at,
        "duration_min": duration_min,
        "total_volume_kg": round(total_volume_kg, 1),
        "total_sets": total_sets,
        "exercises": exercises,
        "exercise_count": len(exercises),
    }


def load_cache() -> list[dict]:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []


def save_cache(workouts: list[dict]):
    CACHE_FILE.write_text(json.dumps(workouts, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[INFO] hevy_client: cache saved -> {CACHE_FILE} ({len(workouts)} workouts)")


def sync(force: bool = False) -> list[dict]:
    if not force and CACHE_FILE.exists():
        cached = load_cache()
        print(f"[INFO] hevy_client: loaded {len(cached)} workouts from cache")
        return cached

    print("[INFO] hevy_client: fetching all workouts from API...")
    raw_workouts = fetch_all_workouts()
    if not raw_workouts:
        print("[WARN] hevy_client: no workouts returned from API")
        return []

    parsed = [parse_workout(w) for w in raw_workouts]
    parsed.sort(key=lambda w: w["date"])
    save_cache(parsed)
    return parsed


def get_personal_bests(workouts: list[dict]) -> dict[str, dict]:
    pbs: dict[str, dict] = {}
    for w in workouts:
        for ex in w.get("exercises", []):
            title = ex["title"]
            for s in ex["sets"]:
                if s["set_type"] == "warmup":
                    continue
                cur = pbs.get(title)
                if cur is None or s["weight_kg"] > cur["weight_kg"]:
                    pbs[title] = {
                        "weight_kg": s["weight_kg"],
                        "reps": s["reps"],
                        "date": w["date"],
                        "workout_id": w["id"],
                    }
    return pbs


def get_weekly_volume(workouts: list[dict]) -> list[dict]:
    from collections import defaultdict
    weeks: dict[str, dict] = defaultdict(lambda: {"volume_kg": 0.0, "sessions": 0, "exercises": set()})
    for w in workouts:
        if not w["date"]:
            continue
        dt = datetime.fromisoformat(w["date"])
        iso_week = dt.strftime("%G-W%V")
        weeks[iso_week]["volume_kg"] += w["total_volume_kg"]
        weeks[iso_week]["sessions"] += 1
        for ex in w["exercises"]:
            weeks[iso_week]["exercises"].add(ex["title"])
    return [
        {"week": k, "volume_kg": round(v["volume_kg"], 1),
         "sessions": v["sessions"], "unique_exercises": len(v["exercises"])}
        for k, v in sorted(weeks.items())
    ]
