# main.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, date, timezone
from fastapi.security import OAuth2PasswordRequestForm
# --- Сначала импортируем компоненты БД ---
from database import engine, SessionLocal, Base, get_db
from typing import List
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
# --- Затем импортируем модели ---
# Это важно, чтобы SQLAlchemy "узнал" о наших таблицах перед их созданием
import models

# --- Теперь, когда все импортировано, создаем таблицы ---
Base.metadata.create_all(bind=engine)

# Импортируем оставшиеся части
import schemas
import security


app = FastAPI()
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error: " + str(exc)},
    )
# --- НАСТРОЙКА CORS ---
# Это "белый список" адресов, которым разрешено обращаться к нашему API
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "https://finance-tracker-app-two-omega.vercel.app",
    # Важно для открытия файла index.html напрямую в браузере
    "null", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Разрешаем эти источники
    allow_credentials=True,
    allow_methods=["*"], # Разрешаем все методы (GET, POST, и т.д.)
    allow_headers=["*"], # Разрешаем все заголовки
)

# ... остальной код твоего приложения ...

# --- Эндпоинт для создания пользователя ---
@app.post("/users/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

# ... код эндпоинта create_user ...

# --- Эндпоинт для логина и получения токена ---
@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Теперь мы берем email из form_data.username (Swagger использует это поле для email)
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # А пароль из form_data.password
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Дальше все по-старому
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# ... код эндпоинта login ...

# --- НАШ ПЕРВЫЙ ЗАЩИЩЕННЫЙ ЭНДПОИНТ ---
@app.post("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(security.get_current_user)):
    # current_user - это уже не просто email, а полноценный объект пользователя из БД,
    # который нам вернула функция get_current_user.
    # Мы просто возвращаем его. FastAPI и Pydantic сделают все остальное.
    return current_user

# ... код эндпоинта read_root ...

# --- ЭНДПОИНТ ДЛЯ СОЗДАНИЯ РАСХОДА ---
# main.py

@app.post("/expenses/", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    expense_data = expense.dict()
    
    # --- РУЧНАЯ ОБРАБОТКА ДАТЫ ---
    raw_date = expense_data.get("date")
    
    if isinstance(raw_date, str) and raw_date:
        try:
            # Пытаемся распарсить строку в дату
            final_date = datetime.strptime(raw_date.split('T')[0], '%Y-%m-%d').date()
        except ValueError:
            # Если не получилось, ставим сегодняшнюю
            final_date = date.today()
    else:
        # Если дата не пришла, или это не строка, ставим сегодняшнюю
        final_date = date.today()
        
    expense_data['date'] = final_date
    
    new_expense = models.Expense(
        **expense_data,
        owner_id=current_user.id
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return new_expense

# ... код эндпоинта / ...
@app.post("/categories/", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    db_category = models.Category(**category.dict(), owner_id=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/categories/", response_model=List[schemas.CategoryOut])
def read_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    return db.query(models.Category).filter(models.Category.owner_id == current_user.id).all()
# ... код эндпоинта POST /expenses/ ...

# --- ЭНДПОИНТ ДЛЯ ПОЛУЧЕНИЯ СПИСКА РАСХОДОВ ---
@app.get("/expenses/", response_model=List[schemas.ExpenseOut])
def read_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Это магия SQLAlchemy! Мы просто возвращаем атрибут .expenses
    # нашего текущего пользователя. SQLAlchemy сам сходит в базу
    # и достанет все расходы, связанные с этим user.id.
    return current_user.expenses

# ... код эндпоинта GET /expenses/ ...

# --- ЭНДПОИНТ ДЛЯ ОБНОВЛЕНИЯ РАСХОДА ---
@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # --- ВОТ НЕДОСТАЮЩИЙ КУСОК ---
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()

    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if db_expense.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this expense")
    # -----------------------------

    update_data = expense_update.dict(exclude_unset=True)

    if "date" in update_data:
        raw_date = update_data.get("date")
        if isinstance(raw_date, str) and raw_date:
            try:
                update_data['date'] = datetime.strptime(raw_date.split('T')[0], '%Y-%m-%d').date()
            except ValueError:
                del update_data['date'] 
        else:
            del update_data['date'] 

    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    
    return db_expense

# --- ЭНДПОИНТ ДЛЯ УДАЛЕНИЯ РАСХОДА ---
@app.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Логика поиска и проверки владельца - точно такая же
    expense_query = db.query(models.Expense).filter(models.Expense.id == expense_id)
    db_expense = expense_query.first()

    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if db_expense.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this expense")

    # Удаляем запись
    expense_query.delete(synchronize_session=False)
    db.commit()
    
    # При успешном удалении не возвращаем ничего (статус 204)
    return

# ... код эндпоинта / ...

@app.get("/")
def read_root():
    # Можешь вернуть старое сообщение или оставить это, чтобы убедиться, что все заработало
    return {"message": "ПОБЕДА! НОВЫЙ СЕРВЕР РАБОТАЕТ!"}