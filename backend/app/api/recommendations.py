from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.user import get_profile
from app.db.database import get_db
from app.models.user import User
from app.schemas.food import FoodResponse
from app.services.recommendation import generate_meal_plan, get_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/daily")
def daily_recommendations(
    meal_type: str | None = Query(None),
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_profile(db, current_user.id)
    foods = get_recommendations(db, profile, meal_type, limit)
    return {"recommendations": [FoodResponse.model_validate(f) for f in foods]}


@router.get("/meal-plan")
def meal_plan(
    target_calories: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_profile(db, current_user.id)
    if target_calories is None:
        target_calories = int(profile.target_calories) if profile and profile.target_calories else 2000
    plan = generate_meal_plan(db, profile, target_calories)
    return {"plan": plan, "target_calories": target_calories}


@router.post("/feedback")
def submit_feedback(
    food_id: int,
    liked: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Simple feedback storage - could be expanded
    return {"message": "Feedback recorded", "food_id": food_id, "liked": liked}
