#!/usr/bin/env python3
"""
repo_activity.py — real "what's happening in this project" snapshot.

LOCAL-ONLY: unlike sync_dashboard_data.py, this needs the full monorepo
checked out on disk (git history across multiple sibling repos, file
mtimes across the whole project tree) — GitHub Actions only checks out
this single repo, so it can't run this in CI. Run it by hand (or from a
local cron/Hermes job) whenever you want a fresh snapshot, then commit
the resulting public/data/repo_activity.json like any other data file.

Usage:
  python scripts/repo_activity.py [--project-root "D:/antigravity project/karma - zeroclaw"]
"""
import argparse
import json
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DASHBOARD_DATA = REPO_ROOT / "public" / "data"

# Sibling git repos inside the monorepo worth tracking commit activity for.
TRACKED_REPOS = [
    ("karma-os", "."),
    ("karma-os-dashboard", "karma-os-dashboard"),
    ("karma-hermes", "projects/Karma-Hermes"),
]

# Top-level folders worth reporting file/activity stats for.
TRACKED_FOLDERS = [
    "obsidian-vault", ".mindos", "projects", "karma-os-dashboard",
    "memory", "archive",
]

IGNORE_DIR_NAMES = {"node_modules", ".git", "__pycache__", "dist", ".venv", "venv"}
IGNORE_FILE_NAMES = {"hevy_cache.json", "exercise_muscle_map.json"}


def git_commit_days(project_root: Path, repo_rel_path: str, since_days: int = 90) -> list[str]:
    repo_path = project_root / repo_rel_path
    try:
        out = subprocess.run(
            ["git", "log", f"--since={since_days} days ago", "--pretty=format:%ad", "--date=short"],
            cwd=repo_path, capture_output=True, text=True, timeout=15,
        )
        return [d for d in out.stdout.splitlines() if d]
    except Exception as e:
        print(f"[WARN] repo_activity: git log failed for {repo_rel_path}: {e}")
        return []


def build_commit_heatmap(project_root: Path, since_days: int = 90) -> dict:
    all_days: list[str] = []
    per_repo: dict[str, int] = {}
    for name, rel_path in TRACKED_REPOS:
        days = git_commit_days(project_root, rel_path, since_days)
        per_repo[name] = len(days)
        all_days.extend(days)
    by_day = Counter(all_days)
    today = datetime.now().date()
    days_series = []
    for i in range(since_days, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        days_series.append({"date": d, "commits": by_day.get(d, 0)})
    return {
        "days": days_series,
        "total_commits": sum(per_repo.values()),
        "commits_by_repo": per_repo,
        "active_days": len(by_day),
    }


def scan_recent_files(project_root: Path, since_days: int = 14, limit: int = 25) -> list[dict]:
    cutoff = datetime.now().timestamp() - since_days * 86400
    recent = []
    for folder in TRACKED_FOLDERS:
        base = project_root / folder
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if any(part in IGNORE_DIR_NAMES for part in p.parts) or p.name in IGNORE_FILE_NAMES:
                continue
            try:
                if not p.is_file():
                    continue
                mtime = p.stat().st_mtime
            except OSError:
                continue
            if mtime >= cutoff:
                recent.append({
                    "path": str(p.relative_to(project_root)).replace("\\", "/"),
                    "folder": folder,
                    "mtime": datetime.fromtimestamp(mtime).isoformat(timespec="seconds"),
                })
    recent.sort(key=lambda f: f["mtime"], reverse=True)
    return recent[:limit]


def folder_activity_counts(recent_files: list[dict]) -> list[dict]:
    counts = Counter(f["folder"] for f in recent_files)
    return [{"name": k, "count": v} for k, v in sorted(counts.items(), key=lambda kv: -kv[1])]


def folder_size_counts(project_root: Path) -> list[dict]:
    out = []
    for folder in TRACKED_FOLDERS:
        base = project_root / folder
        if not base.exists():
            continue
        file_count = 0
        total_bytes = 0
        for p in base.rglob("*"):
            if any(part in IGNORE_DIR_NAMES for part in p.parts):
                continue
            try:
                if p.is_file():
                    file_count += 1
                    total_bytes += p.stat().st_size
            except OSError:
                continue
        out.append({"name": folder, "files": file_count, "mb": round(total_bytes / 1_000_000, 1)})
    return sorted(out, key=lambda f: -f["files"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project-root", default=str(REPO_ROOT.parent))
    args = ap.parse_args()
    project_root = Path(args.project_root)

    heatmap = build_commit_heatmap(project_root)
    recent_files = scan_recent_files(project_root)
    folder_activity = folder_activity_counts(recent_files)
    folder_sizes = folder_size_counts(project_root)

    out = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "commit_heatmap": heatmap,
        "recent_files": recent_files,
        "folder_activity": folder_activity,
        "folder_sizes": folder_sizes,
    }

    (DASHBOARD_DATA / "repo_activity.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"[INFO] wrote {DASHBOARD_DATA / 'repo_activity.json'}")
    print(f"[INFO] {heatmap['total_commits']} commits across {len(TRACKED_REPOS)} repos in last 90 days, "
          f"{len(recent_files)} recently modified files found")


if __name__ == "__main__":
    main()
