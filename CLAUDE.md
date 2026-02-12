# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A simple Bun-based web application that demonstrates deployment with Relayability. The app serves a styled HTML page displaying:
- Time formatting with dayjs
- String manipulation with lodash-es
- PostgreSQL database connectivity with sample users and posts

## Technology Stack

- **Runtime**: Bun (JavaScript runtime)
- **Database**: PostgreSQL 15
- **Dependencies**: chalk, dayjs, lodash-es, pg
- **Deployment**: Relayability (relay.yaml configuration)
- **Containerization**: Docker (app + db containers)

## Development Commands

### Running Locally

```bash
# Install dependencies
cd app && bun install

# Run development server (with hot reload)
bun dev

# Run production server
bun start
```

The server runs on port 3000 and expects a PostgreSQL database connection.

### Database Connection

Default connection string: `postgres://postgres:postgres@localhost:5432/method_test`

Override via environment variable:
```bash
DATABASE_URL=postgres://user:pass@host:port/dbname bun start
```

### Docker & Relay Deployment

This project is configured for deployment with Relayability. The `relay.yaml` defines:

- **app container**: Bun application (port 3000)
- **db container**: PostgreSQL 15 with init.sql seed data
- **web service**: HTTP service exposed on port 3000
- **database service**: PostgreSQL on port 5432 (mapped to 5433 in prod deploy)
- **prod deploy**: Routes to localhost:443 (web) and method-test-db.relay:5433 (database)

Standard Docker Compose is also available but currently has the database service commented out:

```bash
docker-compose up --build
```

## Architecture

### Application Structure

```
app/
├── src/
│   └── index.ts          # Main server entry point
├── package.json          # Bun project config
└── Dockerfile            # App container definition

db/
├── init.sql              # Database schema and seed data
└── Dockerfile            # PostgreSQL container definition

relay.yaml                # Relayability deployment configuration
docker-compose.yml        # Docker Compose setup (db service commented out)
```

### Main Application Flow (app/src/index.ts)

1. **Database Connection**: Creates a PostgreSQL connection pool using the pg library
2. **Data Fetching**: `getDbData()` queries users and posts tables with JOIN
3. **HTTP Server**: Bun.serve creates an HTTP server on port 3000
4. **Route Handler**: GET / renders HTML with:
   - Current timestamp (dayjs)
   - Lodash string transformations (capitalize, kebabCase)
   - Database connection status
   - Rendered users and posts from database

### Database Schema (db/init.sql)

- **users** table: id, email, name, created_at
- **posts** table: id, user_id (FK to users), title, content, created_at
- Sample data: 2 users (Alice, Bob) and 2 posts

## Relay Deployment Details

The project uses Relayability for deployment orchestration. Key concepts:

- **Containers**: Defined in relay.yaml, built from Dockerfiles
- **Services**: Network services exposed by containers (web, database)
- **Deploys**: Named environments (prod) that map services to hosts/ports
- **Zero-downtime**: Relay starts new containers before stopping old ones

Relay uses a config store (SQLite), manager service, and worker nodes. See RELAY-TUTORIAL.md for detailed deployment flow.

## Common Patterns

### Adding Database Tables

1. Modify `db/init.sql` with new table definitions
2. Rebuild the db container to apply changes
3. Update `app/src/index.ts` to query and render new data

### Environment Variables

The app reads `DATABASE_URL` from environment. For local development, default is localhost:5432. In production (relay.yaml), it's configured to use host.docker.internal:5433.

### Styling

The application uses inline CSS with a dark gradient theme and glassmorphism effects. All styles are embedded in the HTML template string in index.ts.
