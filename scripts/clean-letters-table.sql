-- Clean all letters from the letters table
DELETE FROM letters;

-- Reset the auto-increment counter
DELETE FROM sqlite_sequence WHERE name='letters';

-- Display confirmation
SELECT 'Letters table cleaned successfully' as result;
