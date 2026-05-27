from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.food import Food, FoodEntry, UserFavoriteFood
from app.schemas.food import FoodCreate, FoodEntryCreate, FoodEntryResponse, FoodResponse


def search_foods(
    db: Session,
    q: str | None = None,
    category: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Food], int]:
    query = db.query(Food)
    if q:
        query = query.filter(Food.name.ilike(f"%{q}%"))
    if category:
        query = query.filter(Food.category == category)

    total = query.count()
    foods = query.offset((page - 1) * limit).limit(limit).all()
    return foods, total


def create_custom_food(db: Session, data: FoodCreate, user_id: int) -> Food:
    food = Food(**data.model_dump(), is_custom=True, created_by=user_id)
    db.add(food)
    db.commit()
    db.refresh(food)
    return food


def get_food_by_id(db: Session, food_id: int) -> Food | None:
    return db.query(Food).filter(Food.id == food_id).first()


def create_food_entry(db: Session, data: FoodEntryCreate, user_id: int) -> FoodEntry:
    food = get_food_by_id(db, data.food_id)
    if not food:
        raise ValueError("Food not found")

    ratio = data.quantity / 100
    entry = FoodEntry(
        user_id=user_id,
        food_id=data.food_id,
        date=data.date,
        meal_type=data.meal_type,
        quantity=data.quantity,
        calories=round(float(food.calories) * ratio, 2),
        protein=round(float(food.protein or 0) * ratio, 2),
        carbs=round(float(food.carbs or 0) * ratio, 2),
        fat=round(float(food.fat or 0) * ratio, 2),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_daily_entries(db: Session, user_id: int, entry_date: date) -> list[FoodEntry]:
    return (
        db.query(FoodEntry)
        .options(joinedload(FoodEntry.food))
        .filter(FoodEntry.user_id == user_id, FoodEntry.date == entry_date)
        .order_by(FoodEntry.meal_type, FoodEntry.created_at)
        .all()
    )


def get_daily_summary(db: Session, user_id: int, entry_date: date) -> dict:
    entries = get_daily_entries(db, user_id, entry_date)
    serialized = []
    for e in entries:
        entry_data = FoodEntryResponse.model_validate(e).model_dump()
        serialized.append(entry_data)
    return {
        "date": entry_date,
        "entries": serialized,
        "total": {
            "calories": round(sum(float(e.calories or 0) for e in entries), 1),
            "protein": round(sum(float(e.protein or 0) for e in entries), 1),
            "carbs": round(sum(float(e.carbs or 0) for e in entries), 1),
            "fat": round(sum(float(e.fat or 0) for e in entries), 1),
        },
    }


def get_stats(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
) -> list[dict]:
    results = (
        db.query(
            FoodEntry.date,
            func.sum(FoodEntry.calories).label("total_calories"),
            func.sum(FoodEntry.protein).label("total_protein"),
            func.sum(FoodEntry.carbs).label("total_carbs"),
            func.sum(FoodEntry.fat).label("total_fat"),
        )
        .filter(
            FoodEntry.user_id == user_id,
            FoodEntry.date >= start_date,
            FoodEntry.date <= end_date,
        )
        .group_by(FoodEntry.date)
        .order_by(FoodEntry.date)
        .all()
    )
    return [
        {
            "date": r.date.isoformat(),
            "total_calories": float(r.total_calories or 0),
            "total_protein": float(r.total_protein or 0),
            "total_carbs": float(r.total_carbs or 0),
            "total_fat": float(r.total_fat or 0),
        }
        for r in results
    ]


def delete_food_entry(db: Session, entry_id: int, user_id: int) -> bool:
    entry = (
        db.query(FoodEntry)
        .filter(FoodEntry.id == entry_id, FoodEntry.user_id == user_id)
        .first()
    )
    if not entry:
        return False
    db.delete(entry)
    db.commit()
    return True


# ── Favorites ──────────────────────────────────────────────

def add_favorite_food(db: Session, user_id: int, food_id: int) -> bool:
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise ValueError("Food not found")
    existing = (
        db.query(UserFavoriteFood)
        .filter(UserFavoriteFood.user_id == user_id, UserFavoriteFood.food_id == food_id)
        .first()
    )
    if existing:
        return False
    fav = UserFavoriteFood(user_id=user_id, food_id=food_id)
    db.add(fav)
    db.commit()
    return True


def remove_favorite_food(db: Session, user_id: int, food_id: int) -> bool:
    fav = (
        db.query(UserFavoriteFood)
        .filter(UserFavoriteFood.user_id == user_id, UserFavoriteFood.food_id == food_id)
        .first()
    )
    if not fav:
        return False
    db.delete(fav)
    db.commit()
    return True


def get_favorite_foods(db: Session, user_id: int) -> list[Food]:
    return (
        db.query(Food)
        .join(UserFavoriteFood, UserFavoriteFood.food_id == Food.id)
        .filter(UserFavoriteFood.user_id == user_id)
        .order_by(UserFavoriteFood.created_at.desc())
        .all()
    )


def is_favorite_food_ids(db: Session, user_id: int, food_ids: list[int]) -> set[int]:
    rows = (
        db.query(UserFavoriteFood.food_id)
        .filter(
            UserFavoriteFood.user_id == user_id,
            UserFavoriteFood.food_id.in_(food_ids),
        )
        .all()
    )
    return {r.food_id for r in rows}


# ── Image-based entry ──────────────────────────────────────

def create_food_entry_from_data(
    db: Session,
    user_id: int,
    entry_date: date,
    meal_type: str,
    food_name: str,
    food_category: str,
    calories_per_100g: float,
    protein: float,
    carbs: float,
    fat: float,
    quantity: float,
) -> FoodEntry:
    # Create a custom food from the recognized data
    food = Food(
        name=food_name,
        category=food_category,
        serving_size=100,
        calories=calories_per_100g,
        protein=protein,
        carbs=carbs,
        fat=fat,
        fiber=0,
        sugar=0,
        is_custom=True,
        created_by=user_id,
    )
    db.add(food)
    db.flush()

    ratio = quantity / 100
    entry = FoodEntry(
        user_id=user_id,
        food_id=food.id,
        date=entry_date,
        meal_type=meal_type,
        quantity=quantity,
        calories=round(float(food.calories) * ratio, 2),
        protein=round(float(food.protein or 0) * ratio, 2),
        carbs=round(float(food.carbs or 0) * ratio, 2),
        fat=round(float(food.fat or 0) * ratio, 2),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
