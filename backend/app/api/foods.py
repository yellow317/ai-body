from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.food import (
    add_favorite_food,
    create_custom_food,
    create_food_entry,
    create_food_entry_from_data,
    delete_food_entry,
    get_daily_summary,
    get_favorite_foods,
    get_stats,
    is_favorite_food_ids,
    remove_favorite_food,
    search_foods,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.food import (
    FavoriteFoodListResponse,
    FoodCreate,
    FoodEntryCreate,
    FoodEntryResponse,
    FoodResponse,
    FoodSearchResult,
    ImageFoodEntryCreate,
)

router = APIRouter(prefix="/api", tags=["foods"])


@router.get("/foods/search", response_model=FoodSearchResult)
def search(
    q: str | None = Query(None),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    foods, total = search_foods(db, q, category, page, limit)
    # Mark which foods are favorited by current user
    food_ids = [f.id for f in foods]
    fav_ids = is_favorite_food_ids(db, current_user.id, food_ids) if food_ids else set()
    result = []
    for f in foods:
        resp = FoodResponse.model_validate(f)
        resp.is_favorited = f.id in fav_ids
        result.append(resp)
    return FoodSearchResult(
        foods=result,
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/foods/custom", response_model=FoodResponse)
def add_custom_food(
    data: FoodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    food = create_custom_food(db, data, current_user.id)
    return FoodResponse.model_validate(food)


# ── Favorites ──────────────────────────────────────────────

@router.get("/foods/favorites", response_model=FavoriteFoodListResponse)
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    foods = get_favorite_foods(db, current_user.id)
    return FavoriteFoodListResponse(
        foods=[FoodResponse.model_validate(f) for f in foods],
        total=len(foods),
    )


@router.post("/foods/{food_id}/favorite")
def favorite_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        added = add_favorite_food(db, current_user.id, food_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"is_favorited": True, "added": added}


@router.delete("/foods/{food_id}/favorite")
def unfavorite_food(
    food_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    removed = remove_favorite_food(db, current_user.id, food_id)
    return {"is_favorited": False, "removed": removed}


# ── Food Entries ───────────────────────────────────────────

@router.post("/food-entries", response_model=FoodEntryResponse)
def add_food_entry(
    data: FoodEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        entry = create_food_entry(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return FoodEntryResponse.model_validate(entry)


@router.post("/food-entries/from-image", response_model=FoodEntryResponse)
def add_food_entry_from_image(
    data: ImageFoodEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = create_food_entry_from_data(
        db=db,
        user_id=current_user.id,
        entry_date=data.entry_date,
        meal_type=data.meal_type,
        food_name=data.food_name,
        food_category=data.food_category,
        calories_per_100g=data.calories_per_100g,
        protein=data.protein,
        carbs=data.carbs,
        fat=data.fat,
        quantity=data.quantity,
    )
    return FoodEntryResponse.model_validate(entry)


@router.get("/food-entries/daily/{entry_date}", response_model=dict)
def get_daily(
    entry_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_daily_summary(db, current_user.id, entry_date)


@router.delete("/food-entries/{entry_id}")
def remove_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = delete_food_entry(db, entry_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Deleted"}


@router.get("/food-entries/stats", response_model=list[dict])
def get_food_stats(
    start_date: date = Query(),
    end_date: date = Query(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_stats(db, current_user.id, start_date, end_date)
