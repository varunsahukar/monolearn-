# Monolearn Backend Scaffold

A production-ready FastAPI scaffold with a modern asynchronous stack.

## Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (0.110.0+)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector)
- **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) (Async)
- **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
- **Task Queue:** [Celery](https://docs.celeryq.dev/) + [Redis](https://redis.io/)
- **Authentication & Storage:** [Supabase](https://supabase.com/)
- **AI Integration:** [OpenAI SDK](https://github.com/openai/openai-python)
- **Logging:** [structlog](https://www.structlog.org/)
- **Validation:** [Pydantic v2](https://docs.pydantic.dev/latest/)
- **Infrastructure:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## Project Structure

```text
backend/
├── app/
│   ├── main.py              # Application entry point and configuration
│   ├── config.py            # Settings management using Pydantic
│   ├── dependencies.py      # Global FastAPI dependencies
│   ├── api/v1/router.py     # API routing and versioning
│   ├── services/            # Business logic layer
│   ├── ai/                  # AI service implementations and prompts
│   ├── workers/             # Celery application and background tasks
│   ├── db/
│   │   ├── session.py       # Database connection and session management
│   │   ├── models/          # SQLAlchemy database models
│   │   └── repositories/    # Data access layer using Repository pattern
│   ├── schemas/             # Pydantic models for data validation
│   └── core/                # Core exceptions and utility functions
├── alembic/                 # Database migration scripts
├── tests/                   # Automated test suite
├── docker-compose.yml       # Orchestration for local development
└── requirements.txt         # Project dependencies with pinned versions
```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system.
- Python 3.11+ (optional, for local IDE support).

### Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/varunsahukar/monolearn-.git
   cd monolearn-/backend
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and provide the necessary configuration values (Supabase keys, OpenAI API key, etc.).

3. **Launch the Application:**
   ```bash
   docker-compose up --build
   ```

The API will be accessible at `http://localhost:8000`.  
Interactive API documentation (Swagger UI) is available at `http://localhost:8000/docs`.

## Development Workflow

### Database Migrations

Use Alembic to manage database schema changes:

```bash
# Generate a new migration script based on model changes
docker-compose exec api alembic revision --autogenerate -m "Add user table"

# Apply migrations to the database
docker-compose exec api alembic upgrade head
```

### Background Tasks

Celery workers are automatically started by Docker Compose. To verify the worker is functional, you can trigger a test task:

```bash
docker-compose exec api python -c "from app.workers.celery_app import test_task; test_task.delay('Developer')"
```

## License

This project is licensed under the MIT License.
