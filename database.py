import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Загружаем переменные окружения из файла .env
load_dotenv()

# Получаем URL базы данных из переменных окружения
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance_tracker.db")

# Создаем "движок" SQLAlchemy. Это точка входа в нашу базу данных.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Создаем класс SessionLocal. Экземпляры этого класса будут сессиями (подключениями) к БД.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем базовый класс Base. Все наши модели (таблицы) будут наследоваться от него.
Base = declarative_base()

# --- Функция-зависимость для получения сессии БД ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()