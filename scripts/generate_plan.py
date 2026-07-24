#!/usr/bin/env python3
"""
generate_plan.py — LLM-generated structured plan from the dashboard's own
real data (Fitness, Vault, Tasks) -> public/data/plan.json.

CI-runnable (unlike repo_activity.py / sync_vault_data.py): only reads
files already inside this repo checkout (public/data/*.json) and calls
Groq. Needs a GROQ_API_KEYS (comma-separated) or GROQ_API_KEY secret.

Forces STRICT JSON output via prompt + a schema description, and only
feeds it real numbers already computed elsewhere in this pipeline - no
new numbers are invented by the model, only prioritization/narrative.

Usage:
  python scripts/generate_plan.py [--dry-run]
"""
import argparse
import itertools
import json
import os
import urllib.request
from pathlib import Path

DASHBOARD_DATA = Path(__file__).parent.parent / "public" / "data"

SCHEMA_DESC = """Return ONLY valid JSON, no markdown fences, matching exactly:
{
  "headline": "one sharp sentence, no fluff",
  "priorities": [
    {"title": "short action", "domain": "fitness|vault|tasks", "urgency": "high|medium|low", "reason": "one sentence citing the specific number that justifies this"}
  ],
  "risks": [
    {"title": "short risk name", "detail": "one sentence, must cite a real number from the data given"}
  ],
  "wins": [
    {"title": "short win name", "detail": "one sentence, must cite a real number from the data given"}
  ]
}
3-4 items per list max. Every "detail"/"reason" MUST reference an actual number from the input - no invented stats, no generic advice."""


def build_context() -> str:
    hevy = json.loads((DASHBOARD_DATA / "hevy.json").read_text(encoding="utf-8"))
    stats = json.loads((DASHBOARD_DATA / "stats.json").read_text(encoding="utf-8"))
    vault = json.loads((DASHBOARD_DATA / "vault.json").read_text(encoding="utf-8"))
    feed = json.loads((DASHBOARD_DATA / "feed.json").read_text(encoding="utf-8"))

    summary = hevy["hevy_summary"]
    fstats = stats.get("fitness", {})
    vstats = stats.get("vault", {})
    regression = hevy["hevy_analytics"].get("regression_watch", [])[:3]
    junk = hevy["hevy_audit"].get("junk_volume", [])[:3]
    backlog = feed.get("news_feed", {}).get("ingest_backlog", {})

    return f"""FITNESS:
- Total volume {summary['total_volume_kg']}kg across {summary['total_workouts']} workouts, {summary['total_sets']} sets
- ACWR {fstats.get('acwr')} (>1.3 = injury risk zone), acute load {fstats.get('acute')}, chronic load {fstats.get('chronic')}
- Consistency: max streak {fstats.get('maxStreak')} days, median gap {fstats.get('medGap')} days, CV {fstats.get('cv')}
- Regressing lifts: {json.dumps(regression)}
- Junk volume flags: {json.dumps(junk)}

VAULT:
- {vault.get('notebooks')} notebooks, {vault.get('wiki')} compiled wiki pages, last capture {vstats.get('lastCapture')} ({vstats.get('daysSince')} days ago)
- Ingest backlog by type: {json.dumps(backlog)}, total {sum(backlog.values()) if backlog else 0}

TASKS:
- Open tasks tracked locally (not yet in shared backend)
"""


def call_groq(prompt: str) -> str:
    keys = [k.strip() for k in os.environ.get("GROQ_API_KEYS", os.environ.get("GROQ_API_KEY", "")).split(",") if k.strip()]
    if not keys:
        raise RuntimeError("No GROQ_API_KEYS/GROQ_API_KEY set")
    key_pool = itertools.cycle(keys)
    body = json.dumps({
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
        "temperature": 0.2,
    }).encode()
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {next(key_pool)}",
            "Content-Type": "application/json",
            # Groq's Cloudflare WAF blocks urllib's default User-Agent (error 1010).
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        out = json.loads(resp.read())
        return out["choices"][0]["message"]["content"].strip()


def strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    context = build_context()
    prompt = f"You are a blunt, data-only coach for Tuhin Bhattacharya's personal dashboard.\n\n{context}\n\n{SCHEMA_DESC}"

    try:
        raw = call_groq(prompt)
        plan = json.loads(strip_fences(raw))
    except Exception as e:
        print(f"[WARN] generate_plan: Groq/parse failed ({e}), writing fallback plan")
        plan = {
            "headline": "LLM plan generation unavailable this run.",
            "priorities": [],
            "risks": [],
            "wins": [],
        }

    from datetime import datetime
    plan["generated_at"] = datetime.now().isoformat(timespec="seconds")

    if args.dry_run:
        print(json.dumps(plan, indent=2))
        return

    (DASHBOARD_DATA / "plan.json").write_text(json.dumps(plan, indent=2), encoding="utf-8")
    print(f"[INFO] wrote {DASHBOARD_DATA / 'plan.json'}")


if __name__ == "__main__":
    main()
