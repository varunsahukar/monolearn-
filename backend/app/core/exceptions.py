from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class AppBaseException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: Any = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundException(AppBaseException):
    def __init__(self, detail: Any = "Resource not found") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(AppBaseException):
    def __init__(self, detail: Any = "Unauthorized access") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(AppBaseException):
    def __init__(self, detail: Any = "Forbidden access") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(AppBaseException):
    def __init__(self, detail: Any = "Bad request") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class InternalServerErrorException(AppBaseException):
    def __init__(self, detail: Any = "Internal server error") -> None:
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
