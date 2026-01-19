#!/usr/bin/env python3
"""
Discourse analysis for UN speeches database.
Tracks how discussion of concepts evolves over decades.
"""

import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "un_speeches.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# =============================================================================
# SCHEMA CREATION
# =============================================================================

def create_tables(conn):
    """Create discourse analysis tables."""
    cursor = conn.cursor()

    # Concepts table - abstract ideas we want to track
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS concepts (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            category TEXT
        )
    """)

    # Terms that indicate a concept
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS concept_terms (
            id INTEGER PRIMARY KEY,
            concept_id INTEGER REFERENCES concepts(id),
            term TEXT NOT NULL,
            term_type TEXT DEFAULT 'phrase',
            weight REAL DEFAULT 1.0,
            UNIQUE(concept_id, term)
        )
    """)

    # Links chunks to concepts they discuss
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chunk_topics (
            chunk_id INTEGER REFERENCES chunks(id),
            concept_id INTEGER REFERENCES concepts(id),
            relevance_score REAL,
            matched_terms TEXT,
            PRIMARY KEY (chunk_id, concept_id)
        )
    """)

    # World events for correlation
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS world_events (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            year INTEGER NOT NULL,
            end_year INTEGER,
            category TEXT,
            region TEXT,
            description TEXT
        )
    """)

    # Link events to concepts
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS event_concepts (
            event_id INTEGER REFERENCES world_events(id),
            concept_id INTEGER REFERENCES concepts(id),
            relevance TEXT DEFAULT 'primary',
            PRIMARY KEY (event_id, concept_id)
        )
    """)

    # Pre-aggregated country positions by decade
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS country_decade_positions (
            country_code TEXT,
            country_name TEXT,
            concept_id INTEGER REFERENCES concepts(id),
            decade INTEGER,
            mention_count INTEGER,
            speech_count INTEGER,
            sample_contexts TEXT,
            PRIMARY KEY (country_code, concept_id, decade)
        )
    """)

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chunk_topics_concept ON chunk_topics(concept_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_concept_terms_concept ON concept_terms(concept_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_country_positions_concept ON country_decade_positions(concept_id, decade)")

    conn.commit()
    print("✅ Tables created")

# =============================================================================
# CONCEPT DICTIONARY
# =============================================================================

CONCEPTS = {
    "rearmament": {
        "description": "Military buildup, increased defense spending, weapons acquisition, militarization",
        "category": "military",
        "terms": [
            ("rearmament", 1.0),
            ("re-armament", 1.0),
            ("military buildup", 0.95),
            ("military build-up", 0.95),
            ("arms buildup", 0.95),
            ("arms build-up", 0.95),
            ("defense spending", 0.8),
            ("defence spending", 0.8),
            ("military spending", 0.8),
            ("military expenditure", 0.8),
            ("military expenditures", 0.8),
            ("arms race", 0.9),
            ("arms races", 0.9),
            ("militarization", 0.85),
            ("militarisation", 0.85),
            ("military modernization", 0.8),
            ("military modernisation", 0.8),
            ("weapons acquisition", 0.85),
            ("arms acquisition", 0.85),
            ("arms procurement", 0.85),
            ("defense budget", 0.75),
            ("defence budget", 0.75),
            ("military budget", 0.75),
            ("armed forces expansion", 0.9),
            ("troop increases", 0.8),
            ("nuclear armament", 0.9),
            ("conventional armament", 0.9),
        ]
    },
    "disarmament": {
        "description": "Reduction of weapons, arms control, demilitarization",
        "category": "military",
        "terms": [
            ("disarmament", 1.0),
            ("arms control", 0.95),
            ("arms reduction", 0.95),
            ("weapons reduction", 0.9),
            ("demilitarization", 0.9),
            ("demilitarisation", 0.9),
            ("nuclear disarmament", 1.0),
            ("nuclear-free", 0.85),
            ("denuclearization", 0.95),
            ("denuclearisation", 0.95),
            ("arms limitation", 0.9),
            ("weapons ban", 0.85),
            ("arms embargo", 0.8),
            ("non-proliferation", 0.85),
            ("nonproliferation", 0.85),
            ("test ban", 0.8),
            ("arms treaty", 0.85),
            ("disarm", 0.9),
        ]
    },
    "climate_change": {
        "description": "Global warming, environmental crisis, carbon emissions",
        "category": "environment",
        "terms": [
            ("climate change", 1.0),
            ("global warming", 1.0),
            ("climate crisis", 1.0),
            ("climate emergency", 1.0),
            ("greenhouse gas", 0.9),
            ("greenhouse gases", 0.9),
            ("carbon emissions", 0.9),
            ("carbon dioxide emissions", 0.9),
            ("CO2 emissions", 0.9),
            ("fossil fuels", 0.8),
            ("renewable energy", 0.75),
            ("Paris Agreement", 0.85),
            ("Kyoto Protocol", 0.85),
            ("net zero", 0.85),
            ("net-zero", 0.85),
            ("carbon neutral", 0.85),
            ("decarbonization", 0.85),
            ("decarbonisation", 0.85),
            ("rising temperatures", 0.8),
            ("sea level rise", 0.85),
            ("melting ice", 0.8),
            ("extreme weather", 0.75),
        ]
    },
    "human_rights": {
        "description": "Fundamental rights and freedoms, civil liberties, dignity",
        "category": "rights",
        "terms": [
            ("human rights", 1.0),
            ("fundamental rights", 0.95),
            ("civil rights", 0.9),
            ("civil liberties", 0.9),
            ("human dignity", 0.85),
            ("Universal Declaration", 0.9),
            ("freedom of speech", 0.85),
            ("freedom of expression", 0.85),
            ("freedom of religion", 0.85),
            ("freedom of assembly", 0.85),
            ("political prisoners", 0.85),
            ("arbitrary detention", 0.85),
            ("torture", 0.8),
            ("genocide", 0.9),
            ("ethnic cleansing", 0.9),
            ("crimes against humanity", 0.95),
            ("right to life", 0.85),
            ("right to liberty", 0.85),
        ]
    },
    "sovereignty": {
        "description": "National independence, territorial integrity, self-determination",
        "category": "political",
        "terms": [
            ("sovereignty", 1.0),
            ("sovereign rights", 0.95),
            ("territorial integrity", 0.95),
            ("self-determination", 0.95),
            ("national independence", 0.9),
            ("non-interference", 0.85),
            ("non-intervention", 0.85),
            ("internal affairs", 0.8),
            ("domestic affairs", 0.8),
            ("sovereign equality", 0.9),
            ("national sovereignty", 1.0),
            ("sovereign state", 0.85),
            ("sovereign nation", 0.85),
            ("inviolability", 0.8),
            ("border integrity", 0.85),
        ]
    },
    "terrorism": {
        "description": "Terrorist threats, counter-terrorism, extremism",
        "category": "security",
        "terms": [
            ("terrorism", 1.0),
            ("terrorist", 0.95),
            ("terrorists", 0.95),
            ("terrorist attacks", 1.0),
            ("terrorist threat", 0.95),
            ("counter-terrorism", 0.95),
            ("counterterrorism", 0.95),
            ("anti-terrorism", 0.9),
            ("extremism", 0.85),
            ("violent extremism", 0.9),
            ("radicalization", 0.85),
            ("radicalisation", 0.85),
            ("suicide bombing", 0.9),
            ("terrorist organization", 0.95),
            ("terrorist organisation", 0.95),
            ("terrorist group", 0.95),
            ("9/11", 0.9),
            ("September 11", 0.85),
        ]
    },
    "refugees": {
        "description": "Displaced persons, asylum seekers, migration crises",
        "category": "humanitarian",
        "terms": [
            ("refugees", 1.0),
            ("refugee crisis", 1.0),
            ("refugee camp", 0.9),
            ("refugee camps", 0.9),
            ("asylum seekers", 0.95),
            ("asylum seeker", 0.95),
            ("displaced persons", 0.95),
            ("internally displaced", 0.95),
            ("forced displacement", 0.95),
            ("forced migration", 0.9),
            ("mass migration", 0.85),
            ("migration crisis", 0.9),
            ("UNHCR", 0.85),
            ("resettlement", 0.8),
            ("humanitarian corridor", 0.85),
            ("safe haven", 0.75),
        ]
    },
    "nuclear_weapons": {
        "description": "Nuclear arms, atomic weapons, nuclear deterrence",
        "category": "military",
        "terms": [
            ("nuclear weapons", 1.0),
            ("nuclear weapon", 1.0),
            ("atomic weapons", 0.95),
            ("atomic bomb", 0.95),
            ("nuclear bomb", 0.95),
            ("nuclear arsenal", 0.95),
            ("nuclear deterrent", 0.9),
            ("nuclear deterrence", 0.9),
            ("nuclear power", 0.7),  # Lower weight - ambiguous
            ("nuclear threat", 0.9),
            ("nuclear war", 0.95),
            ("mushroom cloud", 0.85),
            ("Hiroshima", 0.8),
            ("Nagasaki", 0.8),
            ("ICBM", 0.9),
            ("ballistic missile", 0.85),
            ("warhead", 0.85),
            ("nuclear stockpile", 0.95),
        ]
    },
}

WORLD_EVENTS = [
    # Cold War era
    {"name": "Korean War", "year": 1950, "end_year": 1953, "category": "war", "region": "Asia",
     "concepts": ["rearmament", "nuclear_weapons"]},
    {"name": "Hungarian Revolution", "year": 1956, "category": "crisis", "region": "Europe",
     "concepts": ["sovereignty", "human_rights"]},
    {"name": "Suez Crisis", "year": 1956, "category": "crisis", "region": "Middle East",
     "concepts": ["sovereignty"]},
    {"name": "Cuban Missile Crisis", "year": 1962, "category": "crisis", "region": "Americas",
     "concepts": ["nuclear_weapons", "disarmament"]},
    {"name": "Vietnam War escalation", "year": 1964, "end_year": 1975, "category": "war", "region": "Asia",
     "concepts": ["sovereignty", "human_rights"]},
    {"name": "Prague Spring / Soviet invasion", "year": 1968, "category": "crisis", "region": "Europe",
     "concepts": ["sovereignty", "human_rights"]},

    # Detente era
    {"name": "SALT I Treaty", "year": 1972, "category": "treaty", "region": "Global",
     "concepts": ["disarmament", "nuclear_weapons"]},
    {"name": "Helsinki Accords", "year": 1975, "category": "treaty", "region": "Europe",
     "concepts": ["human_rights", "sovereignty"]},
    {"name": "Soviet invasion of Afghanistan", "year": 1979, "end_year": 1989, "category": "war", "region": "Asia",
     "concepts": ["sovereignty", "refugees"]},

    # 1980s
    {"name": "INF Treaty", "year": 1987, "category": "treaty", "region": "Global",
     "concepts": ["disarmament", "nuclear_weapons"]},
    {"name": "Fall of Berlin Wall", "year": 1989, "category": "revolution", "region": "Europe",
     "concepts": ["sovereignty", "human_rights"]},

    # Post-Cold War
    {"name": "Gulf War", "year": 1991, "category": "war", "region": "Middle East",
     "concepts": ["sovereignty"]},
    {"name": "Rwandan Genocide", "year": 1994, "category": "crisis", "region": "Africa",
     "concepts": ["human_rights", "refugees"]},
    {"name": "Srebrenica massacre", "year": 1995, "category": "crisis", "region": "Europe",
     "concepts": ["human_rights", "refugees"]},
    {"name": "Kyoto Protocol adopted", "year": 1997, "category": "treaty", "region": "Global",
     "concepts": ["climate_change"]},

    # 2000s
    {"name": "September 11 attacks", "year": 2001, "category": "crisis", "region": "Global",
     "concepts": ["terrorism"]},
    {"name": "US invasion of Iraq", "year": 2003, "category": "war", "region": "Middle East",
     "concepts": ["sovereignty", "terrorism"]},
    {"name": "Darfur crisis", "year": 2003, "end_year": 2010, "category": "crisis", "region": "Africa",
     "concepts": ["human_rights", "refugees"]},

    # 2010s
    {"name": "Arab Spring", "year": 2011, "category": "revolution", "region": "Middle East",
     "concepts": ["human_rights", "sovereignty"]},
    {"name": "Syrian Civil War begins", "year": 2011, "category": "war", "region": "Middle East",
     "concepts": ["refugees", "human_rights", "terrorism"]},
    {"name": "Russian annexation of Crimea", "year": 2014, "category": "crisis", "region": "Europe",
     "concepts": ["sovereignty", "rearmament"]},
    {"name": "Paris Climate Agreement", "year": 2015, "category": "treaty", "region": "Global",
     "concepts": ["climate_change"]},
    {"name": "European refugee crisis peak", "year": 2015, "category": "crisis", "region": "Europe",
     "concepts": ["refugees"]},
    {"name": "ISIS territorial peak", "year": 2015, "category": "crisis", "region": "Middle East",
     "concepts": ["terrorism", "refugees"]},

    # 2020s
    {"name": "COVID-19 pandemic", "year": 2020, "end_year": 2023, "category": "crisis", "region": "Global",
     "concepts": ["human_rights"]},
    {"name": "Russian invasion of Ukraine", "year": 2022, "category": "war", "region": "Europe",
     "concepts": ["sovereignty", "rearmament", "refugees", "nuclear_weapons"]},
    {"name": "Hamas attack / Gaza war", "year": 2023, "category": "war", "region": "Middle East",
     "concepts": ["terrorism", "human_rights", "refugees"]},
]

def seed_concepts(conn):
    """Populate concepts and terms tables."""
    cursor = conn.cursor()

    for name, data in CONCEPTS.items():
        # Insert concept
        cursor.execute("""
            INSERT OR IGNORE INTO concepts (name, description, category)
            VALUES (?, ?, ?)
        """, (name, data["description"], data["category"]))

        # Get concept ID
        cursor.execute("SELECT id FROM concepts WHERE name = ?", (name,))
        concept_id = cursor.fetchone()[0]

        # Insert terms
        for term, weight in data["terms"]:
            cursor.execute("""
                INSERT OR IGNORE INTO concept_terms (concept_id, term, weight)
                VALUES (?, ?, ?)
            """, (concept_id, term, weight))

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM concepts")
    concept_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM concept_terms")
    term_count = cursor.fetchone()[0]
    print(f"✅ Seeded {concept_count} concepts with {term_count} terms")

def seed_world_events(conn):
    """Populate world events table."""
    cursor = conn.cursor()

    for event in WORLD_EVENTS:
        cursor.execute("""
            INSERT OR IGNORE INTO world_events (name, year, end_year, category, region, description)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (event["name"], event["year"], event.get("end_year"),
              event.get("category"), event.get("region"), event.get("description")))

        # Get event ID
        cursor.execute("SELECT id FROM world_events WHERE name = ? AND year = ?",
                      (event["name"], event["year"]))
        event_id = cursor.fetchone()[0]

        # Link to concepts
        for concept_name in event.get("concepts", []):
            cursor.execute("SELECT id FROM concepts WHERE name = ?", (concept_name,))
            row = cursor.fetchone()
            if row:
                cursor.execute("""
                    INSERT OR IGNORE INTO event_concepts (event_id, concept_id)
                    VALUES (?, ?)
                """, (event_id, row[0]))

    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM world_events")
    print(f"✅ Seeded {cursor.fetchone()[0]} world events")

# =============================================================================
# CHUNK TOPIC TAGGING
# =============================================================================

def tag_chunks_for_concept(conn, concept_id, concept_name, terms):
    """Tag all chunks that mention a concept's terms."""
    cursor = conn.cursor()

    # Clear existing tags for this concept
    cursor.execute("DELETE FROM chunk_topics WHERE concept_id = ?", (concept_id,))

    chunk_matches = {}  # chunk_id -> {relevance, terms}

    for term, weight in terms:
        # Case-insensitive search
        like_pattern = f"%{term}%"

        cursor.execute("""
            SELECT c.id, c.text
            FROM chunks c
            WHERE LOWER(c.text) LIKE LOWER(?)
        """, (like_pattern,))

        for row in cursor.fetchall():
            chunk_id = row[0]
            text_lower = row[1].lower()
            term_lower = term.lower()

            # Count occurrences
            count = text_lower.count(term_lower)
            term_relevance = min(weight * count, 1.0)  # Cap at 1.0

            if chunk_id not in chunk_matches:
                chunk_matches[chunk_id] = {"relevance": 0, "terms": []}

            chunk_matches[chunk_id]["relevance"] = max(
                chunk_matches[chunk_id]["relevance"],
                term_relevance
            )
            if term not in chunk_matches[chunk_id]["terms"]:
                chunk_matches[chunk_id]["terms"].append(term)

    # Insert matches
    for chunk_id, data in chunk_matches.items():
        cursor.execute("""
            INSERT INTO chunk_topics (chunk_id, concept_id, relevance_score, matched_terms)
            VALUES (?, ?, ?, ?)
        """, (chunk_id, concept_id, data["relevance"], json.dumps(data["terms"])))

    conn.commit()
    return len(chunk_matches)

def tag_all_concepts(conn):
    """Tag chunks for all concepts."""
    cursor = conn.cursor()

    cursor.execute("""
        SELECT c.id, c.name, GROUP_CONCAT(ct.term || ':' || ct.weight, '|') as terms
        FROM concepts c
        JOIN concept_terms ct ON c.id = ct.concept_id
        GROUP BY c.id
    """)

    total_tags = 0
    for row in cursor.fetchall():
        concept_id, concept_name, terms_str = row

        # Parse terms
        terms = []
        for t in terms_str.split("|"):
            parts = t.rsplit(":", 1)
            terms.append((parts[0], float(parts[1])))

        count = tag_chunks_for_concept(conn, concept_id, concept_name, terms)
        total_tags += count
        print(f"  {concept_name}: {count:,} chunks tagged")

    print(f"✅ Total: {total_tags:,} chunk-topic associations")

# =============================================================================
# AGGREGATION
# =============================================================================

def aggregate_country_positions(conn):
    """Pre-compute country positions by decade."""
    cursor = conn.cursor()

    # Clear existing aggregations
    cursor.execute("DELETE FROM country_decade_positions")

    # Simpler aggregation without complex sample contexts
    cursor.execute("""
        INSERT INTO country_decade_positions
            (country_code, country_name, concept_id, decade, mention_count, speech_count, sample_contexts)
        SELECT
            s.country_code,
            MAX(s.country_name) as country_name,
            ct.concept_id,
            (s.year / 10) * 10 as decade,
            COUNT(*) as mention_count,
            COUNT(DISTINCT s.id) as speech_count,
            NULL as sample_contexts
        FROM chunk_topics ct
        JOIN chunks c ON ct.chunk_id = c.id
        JOIN speeches s ON c.speech_id = s.id
        GROUP BY s.country_code, ct.concept_id, decade
    """)

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM country_decade_positions")
    print(f"✅ Aggregated {cursor.fetchone()[0]:,} country-decade-concept positions")

# =============================================================================
# ANALYSIS QUERIES
# =============================================================================

def print_concept_overview(conn):
    """Print overview of all concepts and their mention counts."""
    cursor = conn.cursor()

    print("\n" + "="*70)
    print("CONCEPT OVERVIEW")
    print("="*70)

    cursor.execute("""
        SELECT c.name, c.category, COUNT(ct.chunk_id) as mentions,
               COUNT(DISTINCT s.country_code) as countries,
               MIN(s.year) as first_year, MAX(s.year) as last_year
        FROM concepts c
        LEFT JOIN chunk_topics ct ON c.id = ct.concept_id
        LEFT JOIN chunks ch ON ct.chunk_id = ch.id
        LEFT JOIN speeches s ON ch.speech_id = s.id
        GROUP BY c.id
        ORDER BY mentions DESC
    """)

    print(f"\n{'Concept':<20} {'Category':<12} {'Mentions':>10} {'Countries':>10} {'Years':>15}")
    print("-"*70)
    for row in cursor.fetchall():
        years = f"{row[4]}-{row[5]}" if row[4] else "N/A"
        print(f"{row[0]:<20} {row[1]:<12} {row[2]:>10,} {row[3]:>10} {years:>15}")

def print_concept_by_decade(conn, concept_name):
    """Print mentions of a concept by decade."""
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM concepts WHERE name = ?", (concept_name,))
    row = cursor.fetchone()
    if not row:
        print(f"Concept '{concept_name}' not found")
        return
    concept_id = row[0]

    print(f"\n{'='*70}")
    print(f"'{concept_name.upper()}' MENTIONS BY DECADE")
    print("="*70)

    cursor.execute("""
        SELECT
            (s.year / 10) * 10 as decade,
            COUNT(*) as mentions,
            COUNT(DISTINCT s.country_code) as countries,
            COUNT(DISTINCT s.id) as speeches
        FROM chunk_topics ct
        JOIN chunks c ON ct.chunk_id = c.id
        JOIN speeches s ON c.speech_id = s.id
        WHERE ct.concept_id = ?
        GROUP BY decade
        ORDER BY decade
    """, (concept_id,))

    print(f"\n{'Decade':<10} {'Mentions':>12} {'Countries':>12} {'Speeches':>12}")
    print("-"*50)
    for row in cursor.fetchall():
        print(f"{row[0]}s{'':<5} {row[1]:>12,} {row[2]:>12} {row[3]:>12}")

def print_top_countries_for_concept(conn, concept_name, decade=None):
    """Print countries that mention a concept most."""
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM concepts WHERE name = ?", (concept_name,))
    row = cursor.fetchone()
    if not row:
        print(f"Concept '{concept_name}' not found")
        return
    concept_id = row[0]

    decade_str = f" ({decade}s)" if decade else ""
    print(f"\n{'='*70}")
    print(f"TOP COUNTRIES DISCUSSING '{concept_name.upper()}'{decade_str}")
    print("="*70)

    query = """
        SELECT
            s.country_name,
            COUNT(*) as mentions,
            COUNT(DISTINCT s.id) as speeches
        FROM chunk_topics ct
        JOIN chunks c ON ct.chunk_id = c.id
        JOIN speeches s ON c.speech_id = s.id
        WHERE ct.concept_id = ?
    """
    params = [concept_id]

    if decade:
        query += " AND s.year >= ? AND s.year < ?"
        params.extend([decade, decade + 10])

    query += """
        GROUP BY s.country_code
        ORDER BY mentions DESC
        LIMIT 20
    """

    cursor.execute(query, params)

    print(f"\n{'Country':<30} {'Mentions':>12} {'Speeches':>12}")
    print("-"*55)
    for row in cursor.fetchall():
        print(f"{row[0]:<30} {row[1]:>12,} {row[2]:>12}")

def print_events_and_mentions(conn, concept_name):
    """Show correlation between events and concept mentions."""
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM concepts WHERE name = ?", (concept_name,))
    row = cursor.fetchone()
    if not row:
        print(f"Concept '{concept_name}' not found")
        return
    concept_id = row[0]

    print(f"\n{'='*70}")
    print(f"WORLD EVENTS AND '{concept_name.upper()}' MENTIONS")
    print("="*70)

    cursor.execute("""
        SELECT
            e.year,
            e.name,
            e.category,
            (SELECT COUNT(*) FROM chunk_topics ct
             JOIN chunks c ON ct.chunk_id = c.id
             JOIN speeches s ON c.speech_id = s.id
             WHERE ct.concept_id = ? AND s.year = e.year) as mentions_that_year,
            (SELECT COUNT(*) FROM chunk_topics ct
             JOIN chunks c ON ct.chunk_id = c.id
             JOIN speeches s ON c.speech_id = s.id
             WHERE ct.concept_id = ? AND s.year = e.year - 1) as mentions_year_before,
            (SELECT COUNT(*) FROM chunk_topics ct
             JOIN chunks c ON ct.chunk_id = c.id
             JOIN speeches s ON c.speech_id = s.id
             WHERE ct.concept_id = ? AND s.year = e.year + 1) as mentions_year_after
        FROM world_events e
        JOIN event_concepts ec ON e.id = ec.event_id
        WHERE ec.concept_id = ?
        ORDER BY e.year
    """, (concept_id, concept_id, concept_id, concept_id))

    print(f"\n{'Year':<6} {'Event':<35} {'Before':>8} {'During':>8} {'After':>8} {'Change':>8}")
    print("-"*80)
    for row in cursor.fetchall():
        year, event, category, during, before, after = row
        before = before or 0
        during = during or 0
        after = after or 0
        change = during - before
        change_str = f"+{change}" if change > 0 else str(change)
        print(f"{year:<6} {event:<35} {before:>8} {during:>8} {after:>8} {change_str:>8}")

# =============================================================================
# MAIN
# =============================================================================

def main():
    conn = get_connection()

    print("🚀 UN Speeches Discourse Analysis")
    print("="*50)

    # Step 1: Create tables
    print("\n📋 Creating tables...")
    create_tables(conn)

    # Step 2: Seed concept dictionary
    print("\n📚 Seeding concept dictionary...")
    seed_concepts(conn)

    # Step 3: Seed world events
    print("\n🌍 Seeding world events...")
    seed_world_events(conn)

    # Step 4: Tag chunks with topics
    print("\n🏷️  Tagging chunks with topics...")
    tag_all_concepts(conn)

    # Step 5: Aggregate country positions
    print("\n📊 Aggregating country positions...")
    aggregate_country_positions(conn)

    # Print analysis
    print_concept_overview(conn)
    print_concept_by_decade(conn, "rearmament")
    print_concept_by_decade(conn, "climate_change")
    print_top_countries_for_concept(conn, "rearmament")
    print_top_countries_for_concept(conn, "rearmament", 2020)
    print_events_and_mentions(conn, "rearmament")

    conn.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    main()
