# Monolearn Backend Scaffold

A production-ready FastAPI scaffold with a modern asynchronous stack.

## 🚀 Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (0.110.0+)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector)
- **ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) (Async)
- **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
- **Task Queue:** [Celery](https://docs.celeryq.dev/) + [Redis](https://redis.io/)
- **Auth & Storage:** [Supabase](https://supabase.com/)
- **AI:** [OpenAI SDK](https://github.com/openai/openai-python)
- **Logging:** [structlog](https://www.structlog.org/)
- **Validation:** [Pydantic v2](https://docs.pydantic.dev/latest/)
- **Containerization:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

## 📁 Project Structure

```text
backend/
├── app/
│   ├── main.py              # Entry point & app configuration
│   ├── config.py            # Pydantic settings & env management
│   ├── dependencies.py      # FastAPI dependencies (DB, etc.)
│   ├── api/v1/router.py     # API routing logic
│   ├── services/            # Business logic layer
│   ├── ai/                  # AI base classes and prompts
│   ├── workers/             # Celery app and tasks
│   ├── db/
│   │   ├── session.py       # SQLAlchemy engine & session setup
│   │   ├── models/          # Database models
│   │   └── repositories/    # Data access layer (Repository pattern)
│   ├── schemas/             # Pydantic models for validation
│   └── core/                # Global exceptions & utilities
├── alembic/                 # Database migrations
├── tests/                   # Test suite
├── docker-compose.yml       # Local development setup
└── requirements.txt         # Project dependencies
```

## 🛠️ Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/varunsahukar/monolearn-.git
   cd monolearn-/backend
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in the required keys in `.env` (Supabase, OpenAI, etc.).

3. **Launch with Docker:**
   ```bash
   docker-compose up --build
   ```

The API will be available at `http://localhost:8000`.  
Swagger documentation is available at `http://localhost:8000/docs`.

## 🧪 Development

### Database Migrations
```bash
# Generate a new migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Run migrations
docker-compose exec api alembic upgrade head
```

### Running Tasks (Celery)
The worker starts automatically with Docker Compose. To test tasks manually:
```bash
docker-compose exec api python -c "from app.workers.celery_app import test_task; test_task.delay('Developer')"
```

## 📝 License
MIT
