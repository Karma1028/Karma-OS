#!/usr/bin/env python3
"""
sync_vault_data.py — real vault_index.json -> public/data/vault.json

LOCAL-ONLY (same reason as repo_activity.py): needs the full monorepo's
obsidian-vault/graphify-out/vault_index.json on disk, which GitHub Actions
(checking out just this repo) can't see. Run by hand after
`python .mindos/skills/vault_report.py` refreshes the source index.

Usage:
  python scripts/sync_vault_data.py [--project-root "D:/antigravity project/karma - zeroclaw"]
"""
import argparse
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DASHBOARD_DATA = REPO_ROOT / "public" / "data"

CLUSTER_COLORS = {
    "AI/ML": "#5b63f0",
    "Business/Market": "#38bdf8",
    "Other": "#9aa1b5",
    "Finance": "#34d399",
    "Stats/Math": "#e879b9",
}

ML_KEYWORDS = ["machine learning", "llm", "nlp", "ai ", "deep learning", "model",
               "neural", "transformer", "embedding", "quantization", "pruning", "rag"]
FIN_KEYWORDS = ["finance", "trading", "stock", "dividend", "economics", "quant",
                "money", "equity", "investment"]
BIZ_KEYWORDS = ["market", "consumer", "brand", "marketing", "strategic", "management",
                "business", "operations", "beverage", "energy drink", "pop mart",
                "two-wheeler", "3m", "india"]
STAT_KEYWORDS = ["statistics", "confidence", "cross-validation", "operations research",
                 "logic", "optimization"]


def categorize(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ML_KEYWORDS):
        return "AI/ML"
    if any(k in n for k in FIN_KEYWORDS):
        return "Finance"
    if any(k in n for k in BIZ_KEYWORDS):
        return "Business/Market"
    if any(k in n for k in STAT_KEYWORDS):
        return "Stats/Math"
    return "Other"


def extract_date(snippet: str) -> str:
    m = re.search(r"created:\s*(\d{4}-\d{2}-\d{2})", snippet or "")
    return m.group(1) if m else ""


def update_activity_knowledge(notebook_sample: list[dict]):
    """Refreshes only the 'Knowledge' stream in activity.json (same
    honest-gap approach as sync_dashboard_data.py's Training refresh)."""
    activity_path = DASHBOARD_DATA / "activity.json"
    if not activity_path.exists():
        return
    activity = json.loads(activity_path.read_text(encoding="utf-8"))
    start = datetime.fromisoformat(activity["start"])
    dated = [n for n in notebook_sample if n["date"]]
    if not dated:
        return
    last_date = max(datetime.fromisoformat(n["date"]) for n in dated)
    total_weeks = max(activity["weeks"], (last_date.date() - start.date()).days // 7 + 1)

    knowledge = [0] * total_weeks
    for n in dated:
        idx = (datetime.fromisoformat(n["date"]).date() - start.date()).days // 7
        if 0 <= idx < total_weeks:
            knowledge[idx] += 1

    for stream in activity["streams"]:
        cur_len = len(stream["dates"])
        if cur_len < total_weeks:
            stream["dates"] = stream["dates"] + [0] * (total_weeks - cur_len)
        if stream["name"] == "Knowledge":
            stream["dates"] = knowledge

    while len(activity["labels"]) < total_weeks:
        activity["labels"].append("")
    activity["weeks"] = total_weeks

    activity_path.write_text(json.dumps(activity, indent=2), encoding="utf-8")
    print(f"[INFO] updated {activity_path} (Knowledge stream, {total_weeks} weeks)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-root", default=str(REPO_ROOT.parent))
    args = ap.parse_args()
    project_root = Path(args.project_root)

    index_path = project_root / "obsidian-vault" / "graphify-out" / "vault_index.json"
    if not index_path.exists():
        print(f"[ERROR] {index_path} not found — run .mindos/skills/vault_report.py first")
        return

    index = json.loads(index_path.read_text(encoding="utf-8"))
    notebooks = index.get("notebooks", [])
    wiki_pages = index.get("wiki_pages", [])
    raw_counts = index.get("raw_counts", {})

    cluster_counts: dict[str, int] = defaultdict(int)
    notebook_sample = []
    for nb in notebooks:
        cluster = categorize(nb["name"])
        cluster_counts[cluster] += 1
        notebook_sample.append({
            "name": nb["name"],
            "cluster": cluster,
            "files": nb.get("files", 0),
            "date": extract_date(nb.get("snippet", "")),
        })

    clusters = [
        {"name": name, "count": count, "fill": CLUSTER_COLORS.get(name, "#9aa1b5")}
        for name, count in sorted(cluster_counts.items(), key=lambda kv: -kv[1])
    ]

    wiki_page_list = [
        {"kind": "concept" if "concepts" in p["path"] else "entity",
         "name": Path(p["path"]).stem.replace("_", " ")}
        for p in wiki_pages
    ]

    vault_json = {
        "notebooks": len(notebooks),
        "wiki": len(wiki_pages),
        "indexed": index.get("generated", "")[:10],
        "clusters": clusters,
        "wikiPages": wiki_page_list,
        "notebookSample": notebook_sample,
    }

    (DASHBOARD_DATA / "vault.json").write_text(json.dumps(vault_json, indent=2), encoding="utf-8")
    print(f"[INFO] wrote {DASHBOARD_DATA / 'vault.json'} ({len(notebooks)} notebooks, {len(clusters)} clusters)")

    # feed.json's news_feed.ingest_backlog — Vault.jsx reads the per-category
    # raw queue counts from here, not stats.json.
    feed_path = DASHBOARD_DATA / "feed.json"
    feed = json.loads(feed_path.read_text(encoding="utf-8"))
    feed.setdefault("news_feed", {})
    feed["news_feed"]["ingest_backlog"] = raw_counts
    feed_path.write_text(json.dumps(feed, indent=2), encoding="utf-8")
    print(f"[INFO] updated {feed_path} (ingest_backlog: {sum(raw_counts.values())} total)")

    # stats.json's vault section — capture cadence from real notebook dates.
    dates = sorted(d for d in (n["date"] for n in notebook_sample) if d)
    stats_path = DASHBOARD_DATA / "stats.json"
    stats = json.loads(stats_path.read_text(encoding="utf-8"))
    if dates:
        last_capture = dates[-1]
        days_since = (datetime.now().date() - datetime.fromisoformat(last_capture).date()).days
        gaps = [(datetime.fromisoformat(dates[i]).date() - datetime.fromisoformat(dates[i-1]).date()).days
                for i in range(1, len(dates))]
        gaps = [g for g in gaps if g >= 0]
        med_gap = sorted(gaps)[len(gaps) // 2] if gaps else 0
        stats["vault"] = {
            "medGap": med_gap,
            "burstiness": stats.get("vault", {}).get("burstiness", 0),
            "lastCapture": last_capture,
            "daysSince": days_since,
        }
        stats_path.write_text(json.dumps(stats, indent=2), encoding="utf-8")
        print(f"[INFO] updated {stats_path} (vault: last capture {last_capture}, {days_since}d ago)")

    update_activity_knowledge(notebook_sample)


if __name__ == "__main__":
    main()
