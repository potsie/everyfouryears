#!/usr/bin/env python3
"""Prototype extractor for FIFA Post-Match Summary Report PDFs.

Pulls the two things we want to surface first: team Expected Goals (xG) and
per-player physical/running data. Uses `pdftotext -layout` (poppler) so it has
no PyMuPDF dependency.

Usage: python3 parse_pmsr.py <report.pdf> <event_id> [out.json]
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

PDFTOTEXT = shutil.which("pdftotext") or "/usr/local/bin/pdftotext"


def pdf_text(pdf_path: str) -> str:
    return subprocess.run(
        [PDFTOTEXT, "-layout", pdf_path, "-"],
        check=True, capture_output=True, text=True,
    ).stdout


def find_pair(text: str, label: str):
    """A page-3 stat row renders as: <home_val> <label> <away_val>."""
    # values may carry a unit (e.g. "120.4 km") between the number and the label
    pat = re.compile(r"([\d.]+)(?:\s*km)?\s+" + re.escape(label) + r"\s+([\d.]+)")
    m = pat.search(text)
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)


PHYS_COLS = [
    "total_distance_m", "zone1_0_7_m", "zone2_7_15_m", "zone3_15_20_m",
    "zone4_20_25_m", "zone5_25plus_m", "high_speed_runs", "sprints", "top_speed_kmh",
]
# row: number, NAME (1+ words), then 9 numeric columns
ROW = re.compile(r"^\s*(\d+)\s+(.+?)\s+((?:[\d.]+\s+){8}[\d.]+)\s*$")


def parse_physical_block(lines):
    players = []
    for ln in lines:
        m = ROW.match(ln)
        if not m:
            continue
        nums = [float(x) for x in m.group(3).split()]
        if len(nums) != 9:
            continue
        players.append({
            "number": m.group(1),
            "name": m.group(2).strip(),
            **{col: val for col, val in zip(PHYS_COLS, nums)},
        })
    return players


def parse_physical(text: str):
    """Split on the two 'Physical Data ... <Team>' headers and parse each block."""
    lines = text.splitlines()
    blocks = []
    starts = [i for i, ln in enumerate(lines) if ln.strip().startswith("Physical Data")]
    for idx, s in enumerate(starts):
        team = lines[s].split("Physical Data")[-1].strip()
        end = starts[idx + 1] if idx + 1 < len(starts) else len(lines)
        blocks.append((team, parse_physical_block(lines[s:end])))
    return blocks


def abbrs_from_filename(pdf: str):
    """PMSR-M20-AUT-V-JOR.pdf -> ('AUT', 'JOR'). The report lists the home team
    first, matching FIFA's match numbering."""
    m = re.search(r"-M\d+-([A-Z]{3})-V-([A-Z]{3})", Path(pdf).name)
    return (m.group(1), m.group(2)) if m else (None, None)


def main():
    pdf, event_id = sys.argv[1], sys.argv[2]
    out = sys.argv[3] if len(sys.argv) > 3 else "result.json"
    text = pdf_text(pdf)

    home_abbr, away_abbr = abbrs_from_filename(pdf)
    xg_home, xg_away = find_pair(text, "xG (Expected Goals)")
    dist_home, dist_away = find_pair(text, "Total Distance Covered")
    phys = parse_physical(text)

    data = {
        "eventId": event_id,
        "source": "FIFA Post-Match Summary Report",
        "home": {"abbr": home_abbr, "xg": xg_home, "totalDistanceKm": dist_home,
                 "physical": phys[0][1] if len(phys) > 0 else []},
        "away": {"abbr": away_abbr, "xg": xg_away, "totalDistanceKm": dist_away,
                 "physical": phys[1][1] if len(phys) > 1 else []},
    }
    Path(out).write_text(json.dumps(data, indent=2))
    print(f"xG: {home_abbr} {xg_home} / {away_abbr} {xg_away}")
    print(f"distance: {home_abbr} {dist_home}km / {away_abbr} {dist_away}km")
    for team, players in phys:
        print(f"{team}: {len(players)} players")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
