import json
import os
import re
import sqlite3
from collections import defaultdict

DB_PATH = os.path.join(os.getcwd(), "data", "un_speeches.db")
OUTPUT_PATH = os.path.join(os.getcwd(), "app", "lib", "evolution-data.json")


def generate_data():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    concepts = {
        "sc_reform": re.compile(
            r"\b(security council reform|structural reform|enlarge the council|permanent seat|veto power)\b",
            re.IGNORECASE,
        ),
        "human_rights": re.compile(
            r"\b(human rights|fundamental freedoms|universal declaration)\b",
            re.IGNORECASE,
        ),
        "sovereignty": re.compile(
            r"\b(sovereignty|non-interference|domestic affairs|territorial integrity)\b",
            re.IGNORECASE,
        ),
        "multilateralism": re.compile(
            r"\b(multilateralism|rules-based|international order)\b", re.IGNORECASE
        ),
    }

    print("Generating evolution data...")

    # Data structure for Recharts: Array of { year, region_concept: val, ... }
    # But filtering by region for separate lines is better.
    # Let's do: Array of { year, Africa_sc_reform: 10.5, WEOG_sc_reform: 5.2, ... }

    # Aggregators
    regional_counts = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    country_stats_2024 = {}

    cursor.execute("""
        SELECT year, region, country_code, text 
        FROM speeches 
        WHERE region IS NOT NULL AND region != '' 
        ORDER BY year ASC
    """)

    rows = cursor.fetchall()

    for row in rows:
        year = row["year"]
        region = row["region"]
        code = row["country_code"]
        text = row["text"]

        # Normalize Region names for keys
        reg_key = "Other"
        if "Africa" in region:
            reg_key = "Africa"
        elif "Asia" in region:
            reg_key = "Asia"
        elif "Eastern" in region:
            reg_key = "EasternEu"
        elif "Latin" in region or "GRULAC" in region:
            reg_key = "LatAm"
        elif "Western" in region or "WEOG" in region:
            reg_key = "West"

        regional_counts[year][reg_key]["total"] += 1

        matches = {}
        for concept, pattern in concepts.items():
            if pattern.search(text):
                regional_counts[year][reg_key][concept] += 1
                matches[concept] = True

        # Save 2024 data for the globe
        if year >= 2023:  # Use 2023-2024 for better coverage
            if code not in country_stats_2024:
                country_stats_2024[code] = {
                    "region": reg_key,
                    "name": code,
                    "mentions": {k: 0 for k in concepts},
                    "total_speeches": 0,
                }
            country_stats_2024[code]["total_speeches"] += 1
            for k in matches:
                country_stats_2024[code]["mentions"][k] += 1

    conn.close()

    # Format timeline
    timeline = []
    years = sorted(regional_counts.keys())
    for y in years:
        entry = {"year": y}
        for reg in ["Africa", "Asia", "EasternEu", "LatAm", "West"]:
            data = regional_counts[y][reg]
            total = data["total"]
            for concept in concepts:
                # Calculate percentage
                val = 0
                count = data[concept]
                if total > 0:
                    val = round((count / total) * 100, 2)
                entry[f"{reg}_{concept}"] = val  # Percentage
                entry[f"{reg}_{concept}_count"] = count  # Absolute count
        timeline.append(entry)

    # Format map data (normalize to 0-1 range or simple counts)
    map_data = []
    for code, data in country_stats_2024.items():
        entry = {"id": code, "region": data["region"], "total": data["total_speeches"]}
        for k in concepts:
            # Percentage for this country
            if data["total_speeches"] > 0:
                entry[k] = round(
                    (data["mentions"][k] / data["total_speeches"]) * 100, 1
                )
            else:
                entry[k] = 0
        map_data.append(entry)

    final_output = {
        "timeline": timeline,
        "map_data": map_data,
        "meta": {"min_year": years[0], "max_year": years[-1]},
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(final_output, f)

    print(f"Saved JSON to {OUTPUT_PATH}")


if __name__ == "__main__":
    generate_data()
