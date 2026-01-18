#!/usr/bin/env python3
"""
Extract quotations from UN speeches database.
Finds mentions of notable figures and identifies potential quotes ATTRIBUTED to them.
"""

import sqlite3
import json
import re
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "un_speeches.db"

# Match both ASCII and Unicode quotation marks
QUOTE_CHARS = r'["\'\u201c\u201d\u2018\u2019\u00ab\u00bb]'  # " ' " " ' ' « »
QUOTE_OPEN = r'[\"\'\u201c\u2018\u00ab]'   # Opening quotes: " ' " ' «
QUOTE_CLOSE = r'[\"\'\u201d\u2019\u00bb]'  # Closing quotes: " ' " ' »

def get_connection():
    return sqlite3.connect(DB_PATH)

def extract_quotations_for_figure(conn, figure_id, name, search_patterns):
    """Extract quotations mentioning a specific figure."""
    cursor = conn.cursor()
    patterns = json.loads(search_patterns)

    quotations = []

    for pattern in patterns:
        # Build LIKE clause
        like_pattern = f"%{pattern}%"

        # Find chunks mentioning this figure
        cursor.execute("""
            SELECT
                c.id as chunk_id,
                c.speech_id,
                c.text,
                s.year,
                s.country_name,
                s.speaker
            FROM chunks c
            JOIN speeches s ON c.speech_id = s.id
            WHERE c.text LIKE ?
            ORDER BY s.year DESC
        """, (like_pattern,))

        for row in cursor.fetchall():
            chunk_id, speech_id, text, year, country, speaker = row

            # Determine if this looks like a direct quote FROM this figure
            is_direct_quote = False
            confidence = 0.3  # Base confidence for a mention
            extracted_quote = None

            text_lower = text.lower()
            pattern_lower = pattern.lower()

            # Find position of the pattern
            pos = text_lower.find(pattern_lower)
            if pos == -1:
                continue

            # Get context around the mention (500 chars before and after)
            start = max(0, pos - 500)
            end = min(len(text), pos + len(pattern) + 500)
            context_text = text[start:end]
            context_lower = context_text.lower()

            # Find position of pattern in context
            pattern_pos_in_context = context_lower.find(pattern_lower)

            # Patterns that indicate a quote is attributed TO this figure
            # The pattern must be near the figure's name
            # Use Unicode-aware quote patterns
            q_open = QUOTE_OPEN
            q_close = QUOTE_CLOSE
            q_any = QUOTE_CHARS
            # Pattern for quote content (non-greedy, 10-500 chars)
            q_content = rf'[^"\'\u201c\u201d\u2018\u2019\u00ab\u00bb]{{10,500}}'

            attribution_patterns = [
                # "X said" followed by quote
                (rf'{re.escape(pattern_lower)}\s+(once\s+)?said[,:.;]?\s*{q_open}({q_content}){q_close}', 0.95, 2),
                (rf'{re.escape(pattern_lower)}\s+(once\s+)?wrote[,:.;]?\s*{q_open}({q_content}){q_close}', 0.95, 2),
                # "said X" or "wrote X" (attribution after verb) - rare but possible
                (rf'said\s+{re.escape(pattern_lower)}[,:.;]?\s*{q_open}({q_content}){q_close}', 0.9, 1),
                # "As X said/wrote/put it"
                (rf'as\s+{re.escape(pattern_lower)}\s+(once\s+)?(said|wrote|put it)[,:.;]?\s*{q_open}({q_content}){q_close}', 0.95, 3),
                # "In the words of X"
                (rf'in the words of\s+{re.escape(pattern_lower)}[,:.;]?\s*{q_open}({q_content}){q_close}', 0.95, 1),
                # "X famously said/wrote"
                (rf'{re.escape(pattern_lower)}\s+famously\s+(said|wrote)[,:.;]?\s*{q_open}({q_content}){q_close}', 0.95, 2),
                # "To quote X"
                (rf'to quote\s+{re.escape(pattern_lower)}[,:.;]?\s*{q_open}({q_content}){q_close}', 0.95, 1),
                # "X reminded us"
                (rf'{re.escape(pattern_lower)}\s+reminded us[,:.;]?\s*{q_open}({q_content}){q_close}', 0.9, 1),
                # "X taught us"
                (rf'{re.escape(pattern_lower)}\s+taught us[,:.;]?\s*{q_open}({q_content}){q_close}', 0.9, 1),
                # Quote followed by attribution: "..." - X
                (rf'{q_open}({q_content}){q_close}\s*[-–—]\s*{re.escape(pattern_lower)}', 0.95, 1),
                # Quote followed by "said X" or "wrote X"
                (rf'{q_open}({q_content}){q_close}\s*,?\s*(said|wrote)\s+{re.escape(pattern_lower)}', 0.9, 1),
            ]

            # Try each attribution pattern
            for regex, score, quote_group in attribution_patterns:
                match = re.search(regex, context_lower, re.IGNORECASE)
                if match:
                    try:
                        extracted_quote = match.group(quote_group)
                        if extracted_quote and len(extracted_quote) >= 10:
                            # Get the actual text with original casing
                            quote_start = context_lower.find(extracted_quote)
                            if quote_start != -1:
                                extracted_quote = context_text[quote_start:quote_start+len(extracted_quote)]
                            is_direct_quote = True
                            confidence = score
                            break
                    except IndexError:
                        continue

            # If no attributed quote found, check for weaker indicators
            if not is_direct_quote:
                # Check if the name is mentioned with verbs suggesting teaching/belief
                weak_indicators = [
                    (rf'{re.escape(pattern_lower)}\s+believed', 0.5),
                    (rf'{re.escape(pattern_lower)}\s+argued', 0.5),
                    (rf'{re.escape(pattern_lower)}\s+stated', 0.5),
                    (rf'according to\s+{re.escape(pattern_lower)}', 0.4),
                    (rf'philosophy of\s+{re.escape(pattern_lower)}', 0.4),
                    (rf'teachings of\s+{re.escape(pattern_lower)}', 0.5),
                    (rf'ideas of\s+{re.escape(pattern_lower)}', 0.4),
                    (rf'legacy of\s+{re.escape(pattern_lower)}', 0.4),
                    (rf"{re.escape(pattern_lower)}['']s\s+(words|teachings|philosophy|ideas)", 0.5),
                ]

                for regex, score in weak_indicators:
                    if re.search(regex, context_lower, re.IGNORECASE):
                        confidence = max(confidence, score)

            # Use extracted quote if found, otherwise use the context around the name
            if extracted_quote:
                quote_text = extracted_quote
            else:
                # Just use context around the mention
                name_start = max(0, pattern_pos_in_context - 150)
                name_end = min(len(context_text), pattern_pos_in_context + len(pattern) + 150)
                quote_text = context_text[name_start:name_end]

            quotations.append({
                'figure_id': figure_id,
                'speech_id': speech_id,
                'chunk_id': chunk_id,
                'quote_text': quote_text[:1000],  # Limit length
                'context_text': context_text[:1500],
                'year': year,
                'country_name': country,
                'is_direct_quote': is_direct_quote,
                'confidence_score': confidence
            })

    return quotations

def deduplicate_quotations(quotations):
    """Remove duplicate quotations (same speech_id and similar text)."""
    seen = set()
    unique = []

    for q in quotations:
        key = (q['speech_id'], q['quote_text'][:100])
        if key not in seen:
            seen.add(key)
            unique.append(q)

    return unique

def main():
    conn = get_connection()
    cursor = conn.cursor()

    # Clear existing quotations
    print("Clearing existing quotations...")
    cursor.execute("DELETE FROM quotations")
    conn.commit()

    # Get all notable figures
    cursor.execute("SELECT id, name, search_patterns FROM notable_figures")
    figures = cursor.fetchall()

    print(f"Processing {len(figures)} notable figures...")

    total_quotations = 0
    total_direct_quotes = 0

    for figure_id, name, search_patterns in figures:
        print(f"  Processing: {name}...", end=" ")

        quotations = extract_quotations_for_figure(conn, figure_id, name, search_patterns)
        quotations = deduplicate_quotations(quotations)

        direct_count = sum(1 for q in quotations if q['is_direct_quote'])

        # Insert into database
        for q in quotations:
            cursor.execute("""
                INSERT INTO quotations
                (figure_id, speech_id, chunk_id, quote_text, context_text,
                 year, country_name, is_direct_quote, confidence_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                q['figure_id'], q['speech_id'], q['chunk_id'],
                q['quote_text'], q['context_text'],
                q['year'], q['country_name'],
                q['is_direct_quote'], q['confidence_score']
            ))

        total_quotations += len(quotations)
        total_direct_quotes += direct_count
        print(f"found {len(quotations)} mentions ({direct_count} direct quotes)")

    conn.commit()

    # Print summary
    print(f"\nTotal quotations extracted: {total_quotations}")
    print(f"Total direct quotes: {total_direct_quotes}")

    # Show stats by category
    cursor.execute("""
        SELECT nf.category, COUNT(*) as count,
               SUM(CASE WHEN q.is_direct_quote THEN 1 ELSE 0 END) as direct
        FROM quotations q
        JOIN notable_figures nf ON q.figure_id = nf.id
        GROUP BY nf.category
        ORDER BY count DESC
    """)

    print("\nQuotations by category:")
    for category, count, direct in cursor.fetchall():
        print(f"  {category}: {count} mentions ({direct} direct quotes)")

    # Show top figures with direct quotes
    cursor.execute("""
        SELECT nf.name, COUNT(*) as count,
               SUM(CASE WHEN q.is_direct_quote THEN 1 ELSE 0 END) as direct
        FROM quotations q
        JOIN notable_figures nf ON q.figure_id = nf.id
        GROUP BY nf.id
        ORDER BY direct DESC, count DESC
        LIMIT 20
    """)

    print("\nTop 20 figures by direct quotes:")
    for name, count, direct in cursor.fetchall():
        print(f"  {name}: {count} mentions ({direct} direct quotes)")

    conn.close()

if __name__ == "__main__":
    main()
