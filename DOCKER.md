# Docker Deployment Guide

This guide covers how to deploy the UN Speeches application using Docker.

## Quick Start

### Build and run with Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f un-speeches

# Stop the application
docker-compose down
```

The application will be available at http://localhost:3000

### Build and run with Docker directly

```bash
# Build the image
docker build -t un-speeches .

# Run the container
docker run -p 3000:3000 \
  --name un-speeches \
  un-speeches

# Run in background
docker run -d -p 3000:3000 \
  --name un-speeches \
  un-speeches
```

## Production Deployment

### With Nginx Reverse Proxy

For production deployments with SSL and improved performance:

```bash
# Start with nginx reverse proxy
docker-compose --profile production up -d --build
```

This will:

- Run the application on internal port 3000
- Serve through Nginx on ports 80/443
- Enable gzip compression
- Add security headers
- Implement rate limiting

### Environment Variables

You can customize the deployment with environment variables:

```bash
# Custom port
docker run -p 8080:8080 -e PORT=8080 un-speeches

# Production mode
docker run -p 3000:3000 -e NODE_ENV=production un-speeches
```

## Database

The UN Speeches application uses a SQLite database that is bundled directly into the Docker image during the build process. The database file (`un_speeches.db`) is copied into the container at build time, so no external volume mounting is required.

This approach ensures:
- The database is always available with the application
- No external file dependencies during deployment
- Simplified container orchestration
- Consistent deployments across environments

**Note**: Since the database is read-only for this application (displaying historical UN speeches), the bundled approach is ideal. Any database updates would require rebuilding the Docker image.

## Health Checks

The Docker image includes a health check that verifies the application is responding:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' un-speeches

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' un-speeches
```

## Troubleshooting

### Check logs

```bash
# Docker Compose
docker-compose logs un-speeches

# Docker directly
docker logs un-speeches
```

### Interactive shell

```bash
# Docker Compose
docker-compose exec un-speeches sh

# Docker directly
docker exec -it un-speeches sh
```

### Database issues

If you're having database issues, ensure:

1. The database was properly bundled during the Docker build process
2. The `un_speeches.db` file exists in your project directory when building
3. The build process completed successfully without errors
4. Check the Dockerfile to verify the database copy step succeeded

### Port conflicts

If port 3000 is already in use:

```bash
# Use a different port
docker run -p 8080:3000 un-speeches
```

## SSL/HTTPS Setup

To enable HTTPS with the nginx setup:

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in an `ssl/` directory
3. Uncomment the SSL server block in `nginx.conf`
4. Update the server_name with your domain
5. Restart the services

```bash
# Example with Let's Encrypt certificates
mkdir ssl
# Copy your certificates to ssl/cert.pem and ssl/key.pem
docker-compose --profile production up -d --build
```

## Resource Requirements

Minimum requirements:

- **RAM**: 512MB
- **CPU**: 1 core
- **Disk**: 100MB (plus space for database)

Recommended for production:

- **RAM**: 1GB
- **CPU**: 2 cores
- **Disk**: 1GB (plus space for database and logs)

## Scaling

For high-traffic deployments, consider:

1. Running multiple container instances behind a load balancer
2. Using a CDN for static assets
3. Implementing database read replicas if needed
4. Adding container orchestration (Kubernetes, Docker Swarm)

## Security Considerations

- The container runs as a non-root user
- Database is bundled within the image (read-only by design)
- Nginx includes security headers
- Rate limiting is configured
- Regular updates of base images recommended
