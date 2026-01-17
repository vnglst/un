import sqlite3

db_path = 'un_speeches.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check tables
print("Tables:")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cursor.fetchall())

# Check years available in chunks
print("\nYears in chunks:")
try:
    cursor.execute("""
        SELECT MIN(s.year), MAX(s.year), COUNT(DISTINCT s.year)
        FROM chunks c JOIN speeches s ON c.speech_id = s.id;
    """)
    print(cursor.fetchall())
except Exception as e:
    print(f"Error checking years: {e}")

# Check columns in chunks
print("\nColumns in chunks:")
try:
    cursor.execute("PRAGMA table_info(chunks);")
    cols = cursor.fetchall()
    for col in cols:
        print(col)
except Exception as e:
    print(f"Error checking chunks columns: {e}")

# Check if entities column has data
print("\nSample entities (if JSON/string):")
try:
    cursor.execute("""
        SELECT entities 
        FROM chunks 
        WHERE entities IS NOT NULL AND entities != '' AND entities != '[]'
        LIMIT 5
    """)
    print(cursor.fetchall())
except Exception as e:
    print(f"Error checking sample: {e}")

conn.close()
