from fastapi import APIRouter

api_router = APIRouter()

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "version": "v1"}

# Import and include more routers here
# api_router.include_router(user.router, prefix="/users", tags=["users"])
