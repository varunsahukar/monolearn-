import structlog
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import AppBaseException

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Application starting up", environment=settings.ENVIRONMENT)
    yield
    # Shutdown logic
    logger.info("Application shutting down")

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "dev" else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        method=request.method,
        path=request.url.path,
        query_params=str(request.query_params),
        client_ip=request.client.host if request.client else None,
    )
    
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
        process_time = time.perf_counter() - start_time
        logger.info(
            "Request processed",
            status_code=response.status_code,
            duration=f"{process_time:.4f}s",
        )
        return response
    except Exception as e:
        process_time = time.perf_counter() - start_time
        logger.exception(
            "Request failed",
            error=str(e),
            duration=f"{process_time:.4f}s",
        )
        raise

# Exception handlers
@app.exception_handler(AppBaseException)
async def app_exception_handler(request: Request, exc: AppBaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception occurred", error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

# Routers
app.include_router(api_router, prefix="/api/v1")
