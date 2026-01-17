#!/usr/bin/env python3
"""
Analyze UN Speeches database to find the most frequently quoted exact quotations.
Enhanced version with better attribution, more patterns, and fuzzy matching.
"""

import sqlite3
import re
from collections import Counter, defaultdict
from pathlib import Path
from difflib import SequenceMatcher

DB_PATH = Path(__file__).parent.parent / "data" / "un_speeches.db"

# Famous figures we expect to find quoted - helps with attribution
FAMOUS_FIGURES = {
    'mandela': 'Nelson Mandela',
    'nelson mandela': 'Nelson Mandela',
    'gandhi': 'Mahatma Gandhi',
    'mahatma gandhi': 'Mahatma Gandhi',
    'martin luther king': 'Martin Luther King Jr.',
    'mlk': 'Martin Luther King Jr.',
    'kennedy': 'John F. Kennedy',
    'jfk': 'John F. Kennedy',
    'churchill': 'Winston Churchill',
    'einstein': 'Albert Einstein',
    'pope francis': 'Pope Francis',
    'pope paul': 'Pope Paul VI',
    'pope john paul': 'Pope John Paul II',
    'lincoln': 'Abraham Lincoln',
    'roosevelt': 'Franklin D. Roosevelt',
    'eleanor roosevelt': 'Eleanor Roosevelt',
    'kofi annan': 'Kofi Annan',
    'ban ki-moon': 'Ban Ki-moon',
    'ban ki moon': 'Ban Ki-moon',
    'guterres': 'António Guterres',
    'dag hammarskjöld': 'Dag Hammarskjöld',
    'hammarskjold': 'Dag Hammarskjöld',
    'shakespeare': 'William Shakespeare',
    'confucius': 'Confucius',
    'buddha': 'Buddha',
    'jesus': 'Jesus Christ',
    'prophet muhammad': 'Prophet Muhammad',
    'desmond tutu': 'Desmond Tutu',
    'malala': 'Malala Yousafzai',
    'greta thunberg': 'Greta Thunberg',
    'secretary-general': 'UN Secretary-General',
    'the charter': 'UN Charter',
    'un charter': 'UN Charter',
}

# Expanded regex patterns - more forgiving
QUOTE_PATTERNS = [
    # Direct attribution: X said/wrote/stated "..."
    r'(?:said|wrote|declared|stated|observed|noted|remarked|proclaimed|quoted)\s*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
    # Past tense: X once said "..."
    r'(?:once said|famously said|once wrote|famously wrote|has said|had said)\s*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
    # Words of: in the words of X, "..."
    r'(?:words of|words from)[^:"""\']*[:\,]\s*["""\']([^"""\']{15,300})["""\']',
    # As X put it: "..."
    r'as[^:"""\']{1,50}put it[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
    # Quoting: quoting X, "..."
    r'quot(?:ing|ed)[^:"""\']*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
    # To quote: to quote X, "..."
    r'to quote[^:"""\']*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
    # Reminded us: X reminded us that "..."
    r'reminded us[^:"""\']*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
    # Called for: X called for "..."
    r'(?:called for|urged|appealed)[^:"""\']*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
]

# Additional patterns for standalone quotes (often Charter or famous phrases)
STANDALONE_PATTERNS = [
    # Preamble patterns
    r'(?:Charter|preamble)[^"""\']*[:\,]?\s*["""\']([^"""\']{20,300})["""\']',
    # According to
    r'according to[^"""\']*[:\,]?\s*["""\']([^"""\']{15,300})["""\']',
]

# Minimum quote length
MIN_QUOTE_LENGTH = 20

# Similarity threshold for fuzzy matching (0.85 = 85% similar)
SIMILARITY_THRESHOLD = 0.85

def normalize_quote(quote):
    """Normalize a quote for comparison."""
    quote = quote.strip()
    quote = quote.lower()
    # Remove leading/trailing punctuation
    quote = re.sub(r'^[\.\,\;\:\!\?\-–—]+|[\.\,\;\:\!\?\-–—]+$', '', quote)
    # Normalize whitespace and special chars
    quote = ' '.join(quote.split())
    # Remove ellipsis variations
    quote = re.sub(r'\.{2,}|…', '...', quote)
    return quote

def are_similar(quote1, quote2):
    """Check if two quotes are similar enough to be considered the same."""
    ratio = SequenceMatcher(None, quote1, quote2).ratio()
    return ratio >= SIMILARITY_THRESHOLD

def identify_speaker(text, quote_pos, window=300):
    """Try to identify who is being quoted by looking at context."""
    # Get context around the quote
    start = max(0, quote_pos - window)
    end = min(len(text), quote_pos + 50)
    context = text[start:end].lower()
    
    # Check for famous figures
    for key, name in FAMOUS_FIGURES.items():
        if key in context:
            return name
    
    # Try to extract names with patterns
    name_patterns = [
        r'([A-Z][a-z]+ [A-Z][a-z]+) (?:said|wrote|declared|stated|once said)',
        r'(?:President|Secretary-General|Prime Minister|Pope|Dr\.|Mr\.|Mrs\.|Ms\.) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+) (?:said|wrote)',
        r'words of ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        r'quoting ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
    ]
    
    original_context = text[start:end]
    for pattern in name_patterns:
        matches = re.findall(pattern, original_context)
        if matches:
            return matches[-1]
    
    return None

def get_quote_source(quote_norm):
    """Try to identify the source of a famous quote."""
    # Known famous quotes and their sources
    famous_quotes = {
        'to save succeeding generations from the scourge of war': ('UN Charter Preamble', 'The opening words of the 1945 UN Charter, expressing the primary purpose of the United Nations.'),
        'we the peoples of the united nations': ('UN Charter Preamble', 'The iconic opening phrase of the UN Charter, emphasizing that the UN represents peoples, not just governments.'),
        'development is the new name of peace': ('Pope Paul VI', 'From his 1967 encyclical Populorum Progressio, quoted in his historic 1965 UN address.'),
        'i have a dream': ('Martin Luther King Jr.', 'From his famous 1963 speech at the Lincoln Memorial during the March on Washington.'),
        'injustice anywhere is a threat to justice everywhere': ('Martin Luther King Jr.', 'From his 1963 "Letter from Birmingham Jail."'),
        'be the change you wish to see': ('Mahatma Gandhi', 'Often attributed to Gandhi, summarizing his philosophy of leading by example.'),
        'never again': ('Holocaust Remembrance', 'A pledge repeated after World War II to prevent future genocides.'),
        'peace cannot be kept by force': ('Albert Einstein', 'Einstein\'s view that lasting peace requires understanding, not military power.'),
        'the arc of the moral universe is long': ('Martin Luther King Jr.', 'Popularized by King, originally from Theodore Parker.'),
        'education is the most powerful weapon': ('Nelson Mandela', 'Mandela\'s belief in education as a tool for social change.'),
        'love is the strongest force': ('Mahatma Gandhi', 'Gandhi\'s philosophy of nonviolent resistance through love.'),
        'i am a nationalist, but my nationalism is humanity': ('Mahatma Gandhi', 'Gandhi expressing that his patriotism extends to all of humanity.'),
    }
    
    for known_quote, (source, explanation) in famous_quotes.items():
        if known_quote in quote_norm or are_similar(quote_norm, known_quote):
            return source, explanation
    
    return None, None

def analyze_quotes():
    """Main analysis function with improved matching."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all speeches
    cursor.execute("SELECT id, year, country_name, speaker, text FROM speeches ORDER BY year")
    speeches = cursor.fetchall()
    
    print(f"Analyzing {len(speeches)} speeches...")
    
    # Track quotes with full context
    all_quotes = []
    
    for speech_id, year, country, speech_speaker, text in speeches:
        if not text:
            continue
        
        # Try all patterns
        all_patterns = QUOTE_PATTERNS + STANDALONE_PATTERNS
        
        for pattern in all_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                quote = match.group(1)
                
                if len(quote.strip()) < MIN_QUOTE_LENGTH:
                    continue
                
                normalized = normalize_quote(quote)
                
                if len(normalized) < MIN_QUOTE_LENGTH:
                    continue
                
                # Identify speaker
                quoted_person = identify_speaker(text, match.start())
                
                all_quotes.append({
                    'original': quote.strip(),
                    'normalized': normalized,
                    'year': year,
                    'country': country,
                    'speech_speaker': speech_speaker,
                    'quoted_person': quoted_person,
                    'speech_id': speech_id,
                })
    
    print(f"Found {len(all_quotes)} total quote instances")
    
    # Group similar quotes using fuzzy matching
    quote_groups = []
    used = set()
    
    for i, q1 in enumerate(all_quotes):
        if i in used:
            continue
        
        group = [q1]
        used.add(i)
        
        for j, q2 in enumerate(all_quotes[i+1:], i+1):
            if j in used:
                continue
            
            if are_similar(q1['normalized'], q2['normalized']):
                group.append(q2)
                used.add(j)
        
        if len(group) >= 2:  # Only keep repeated quotes
            quote_groups.append(group)
    
    # Sort by frequency
    quote_groups.sort(key=len, reverse=True)
    
    conn.close()
    
    return quote_groups

def generate_report(quote_groups, output_path=None):
    """Generate enhanced markdown report."""
    lines = []
    lines.append("# Most Quoted Quotations in UN Speeches")
    lines.append("")
    lines.append("Analysis of UN General Assembly speeches (1946-2024) to find the exact")
    lines.append("quotations repeated most frequently across different speeches.")
    lines.append("")
    lines.append(f"**Found {len(quote_groups)} unique quotes that appear 2+ times.**")
    lines.append("")
    
    lines.append("## Top 50 Most Repeated Quotations")
    lines.append("")
    
    for i, group in enumerate(quote_groups[:50], 1):
        count = len(group)
        
        # Get best original form
        originals = Counter(q['original'] for q in group)
        best_original = originals.most_common(1)[0][0]
        normalized = group[0]['normalized']
        
        # Get years and countries
        years = sorted(set(q['year'] for q in group))
        countries = list(set(q['country'] for q in group))
        
        # Find attributed speakers
        speakers = [q['quoted_person'] for q in group if q['quoted_person']]
        speaker_counts = Counter(speakers)
        
        # Try to get known source
        known_source, explanation = get_quote_source(normalized)
        
        lines.append(f"### {i}. Quoted {count} times")
        lines.append("")
        lines.append(f"> \"{best_original}\"")
        lines.append("")
        
        # Attribution
        if known_source:
            lines.append(f"**Source:** {known_source}")
            if explanation:
                lines.append(f"")
                lines.append(f"*{explanation}*")
        elif speaker_counts:
            top_speaker = speaker_counts.most_common(1)[0][0]
            lines.append(f"**Attributed to:** {top_speaker}")
        
        lines.append("")
        year_range = f"{min(years)}–{max(years)}" if len(years) > 1 else str(years[0])
        lines.append(f"**Years:** {year_range} | **Countries:** {len(countries)}")
        
        # Show which countries
        if len(countries) <= 5:
            lines.append(f"")
            lines.append(f"*Quoted by: {', '.join(countries[:5])}*")
        
        lines.append("")
        lines.append("---")
        lines.append("")
    
    # Statistics
    lines.append("## Statistics")
    lines.append("")
    total_occurrences = sum(len(g) for g in quote_groups)
    lines.append(f"- **Unique repeated quotes:** {len(quote_groups)}")
    lines.append(f"- **Total quote occurrences:** {total_occurrences}")
    if quote_groups:
        lines.append(f"- **Most repeated quote:** {len(quote_groups[0])} times")
    
    lines.append("")
    lines.append("## Methodology")
    lines.append("")
    lines.append("Quotes were extracted using pattern matching for common attribution phrases")
    lines.append("(said, wrote, quoted, etc.) and fuzzy matching to group similar variations.")
    lines.append("Minimum quote length: 20 characters. Similarity threshold: 85%.")
    
    report = "\n".join(lines)
    
    if output_path:
        with open(output_path, 'w') as f:
            f.write(report)
        print(f"Report saved to {output_path}")
    
    return report

if __name__ == "__main__":
    print("Starting enhanced quotation analysis...")
    quote_groups = analyze_quotes()
    
    print(f"\nFound {len(quote_groups)} unique quotes that appear 2+ times")
    
    # Generate report
    output_path = Path(__file__).parent / "quotation_analysis_report.md"
    report = generate_report(quote_groups, output_path)
    
    # Print top 10
    print("\n" + "="*60)
    print("TOP 10 MOST QUOTED QUOTATIONS:")
    print("="*60)
    
    for i, group in enumerate(quote_groups[:10], 1):
        count = len(group)
        originals = Counter(q['original'] for q in group)
        best_original = originals.most_common(1)[0][0]
        
        # Get attribution
        normalized = group[0]['normalized']
        known_source, _ = get_quote_source(normalized)
        
        speakers = [q['quoted_person'] for q in group if q['quoted_person']]
        speaker_counts = Counter(speakers)
        
        attribution = known_source or (speaker_counts.most_common(1)[0][0] if speaker_counts else "Unknown")
        
        print(f"\n{i}. ({count} times) — {attribution}")
        display = best_original[:80] + ('...' if len(best_original) > 80 else '')
        print(f"   \"{display}\"")
