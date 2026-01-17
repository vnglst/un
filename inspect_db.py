import sqlite3
import pandas as pd

db_path = 'un_speeches.db'
conn = sqlite3.connect(db_path)

# Check tables
print("Tables:")
print(pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn))

# Check years available in chunks
print("\nYears in chunks:")
try:
    print(pd.read_sql("""
        SELECT MIN(s.year), MAX(s.year), COUNT(DISTINCT s.year)
        FROM chunks c JOIN speeches s ON c.speech_id = s.id;
    """, conn))
except Exception as e:
    print(f"Error checking years: {e}")

# Check columns in chunks
print("\nColumns in chunks:")
try:
    print(pd.read_sql("PRAGMA table_info(chunks);", conn))
except Exception as e:
    print(f"Error checking chunks columns: {e}")

# Sample entities and text
print("\nSample entities and text (first 5 chunks with 'said'):")
try:
    print(pd.read_sql("""
        SELECT SUBSTR(text, 1, 100) as snippet, entities 
        FROM chunks 
        WHERE text LIKE '%said%' 
        LIMIT 5
    """, conn))
except Exception as e:
    print(f"Error checking sample: {e}")

conn.close()
