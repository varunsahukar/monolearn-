from celery import Celery
from app.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
)

# Autodiscover tasks from app.workers.tasks (or other modules)
# celery_app.autodiscover_tasks(["app.workers"])

@celery_app.task(name="test_task")
def test_task(name: str):
    return f"Hello, {name}!"
