from pydantic import BaseModel, EmailStr, field_validator
import re
from typing import Optional, List, Any
from datetime import date, datetime
# --- Схемы для пользователей ---

# Схема для создания пользователя (что мы ожидаем получить в запросе)
class UserCreate(BaseModel):
    email: str  # Pydantic проверит, что это валидный email
    password: str
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v

# Схема для отображения пользователя (что мы будем возвращать в ответе)
# Мы не хотим возвращать пароль, даже хешированный!
class UserOut(BaseModel):
    id: int
    email: str
    expenses: List["ExpenseOut"] = []

    class Config:
        from_attributes = True # Позволяет Pydantic работать с моделями SQLAlchemy

class Token(BaseModel):
    access_token: str
    token_type: str

# --- НОВЫЕ СХЕМЫ ДЛЯ РАСХОДОВ ---

# Базовая схема, от которой будут наследоваться остальные
class ExpenseBase(BaseModel):
    amount: float
    description: Optional[str] = None # Описание - опционально
    date: Optional[Any] = None
    category_id: Optional[int] = None # <-- ДОБАВЛЯЕМ category_id

# Схема для создания расхода (что приходит от клиента)
class ExpenseCreate(ExpenseBase):
    pass

# Схема для отображения расхода (что мы отдаем клиенту)
class ExpenseOut(ExpenseBase):
    id: int
    date: datetime
    owner_id: int
    category: Optional["CategoryOut"] = None # <-- ПОКАЗЫВАЕМ ВСЮ КАТЕГОРИЮ

    class Config:
        from_attributes = True

# --- НОВЫЕ СХЕМЫ ДЛЯ КАТЕГОРИЙ ---
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True

UserOut.model_rebuild()
ExpenseOut.model_rebuild()