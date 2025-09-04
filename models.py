# models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Связь с расходами: один пользователь -> много расходов
    expenses = relationship("Expense", back_populates="owner")
    categories = relationship("Category", back_populates="owner")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, index=True)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Связь с пользователем (уже была)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="expenses")
    
    # --- НОВАЯ СВЯЗЬ С КАТЕГОРИЕЙ ---
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True) # nullable=True, т.к. расход может быть и без категории
    category = relationship("Category", back_populates="expenses")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    # Связь с пользователем
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="categories")

    # Связь с расходами
    expenses = relationship("Expense", back_populates="category")    

