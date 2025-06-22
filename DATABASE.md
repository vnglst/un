# Database Setup

This project uses a large SQLite database containing UN speech data. The database is distributed manually rather than downloaded automatically.

## Development Setup

1. **Get the database locally** (one of these methods):

   - Ask for a copy of `un_speeches.db`
   - Download from your data source
   - Copy from the production server

2. **Place the database**:

   ```bash
   # Put the database file here:
   data/un_speeches.db
   ```

3. **Create indexes** (if needed):

   ```bash
   npm run db:indexes
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

## Production Deployment

For production on Coolify:

1. **Upload database to server**:

   ```bash
   ./update-db.sh
   ```

2. **Deploy**: The persistent volume will contain the database

## Database File

- **Size**: ~2.5GB
- **Location**:
  - Development: `./data/un_speeches.db`
  - Production: `/app/data/un_speeches.db` (mounted volume)
- **Distribution**: Manual copy only (no automatic downloads)

## Scripts

- `./update-db.sh` - Upload database to production server
- `npm run db:indexes` - Create database indexes for better performance
- `npm run dev` - Start development (requires database to be present)
