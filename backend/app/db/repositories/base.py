from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db_session: AsyncSession):
        self.model = model
        self.db_session = db_session

    async def get(self, id: Any) -> Optional[ModelType]:
        query = select(self.model).where(self.model.id == id)
        result = await self.db_session.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        query = select(self.model).offset(skip).limit(limit)
        result = await self.db_session.execute(query)
        return list(result.scalars().all())

    async def create(self, obj_in: Any) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db_session.add(db_obj)
        await self.db_session.flush()
        return db_obj

    async def update(self, db_obj: ModelType, obj_in: Any) -> ModelType:
        for field in obj_in:
            if hasattr(db_obj, field):
                setattr(db_obj, field, obj_in[field])
        self.db_session.add(db_obj)
        await self.db_session.flush()
        return db_obj

    async def remove(self, id: Any) -> Optional[ModelType]:
        obj = await self.get(id)
        if obj:
            await self.db_session.delete(obj)
            await self.db_session.flush()
        return obj
