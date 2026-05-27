"""Intelligent food recommendation engine."""

from sqlalchemy.orm import Session

from app.models.food import Food, FoodEntry
from app.models.user import UserProfile

MEL_TARGETS = {
    "breakfast": {"protein": 0.25, "carbs": 0.45, "fat": 0.30},
    "lunch": {"protein": 0.30, "carbs": 0.40, "fat": 0.30},
    "dinner": {"protein": 0.35, "carbs": 0.30, "fat": 0.35},
    "snack": {"protein": 0.20, "carbs": 0.50, "fat": 0.30},
}

GOAL_CATEGORIES = {
    "lose": ["vegetable", "fruit", "protein"],
    "gain": ["protein", "staple", "fat"],
    "maintain": ["protein", "staple", "vegetable", "fruit", "beverage"],
}


def score_food(food: Food, profile: UserProfile | None, meal_type: str) -> float:
    """Score a food item based on user profile and meal type."""
    score = 50.0
    goal = profile.goal if profile else "maintain"
    ideal_ratio = MEL_TARGETS.get(meal_type, MEL_TARGETS["snack"])

    if food.protein and food.calories:
        protein_pct = (float(food.protein) * 4) / float(food.calories) * 100
        score += min(protein_pct, 30) * 0.5

    if food.carbs and food.calories:
        carbs_pct = (float(food.carbs) * 4) / float(food.calories) * 100
        if meal_type == "dinner" and carbs_pct > 50:
            score -= 10

    preferred = GOAL_CATEGORIES.get(goal, GOAL_CATEGORIES["maintain"])
    if food.category in preferred:
        score += 20

    if goal == "lose" and food.calories:
        cal_per_serving = float(food.calories) * float(food.serving_size) / 100
        if cal_per_serving < 150:
            score += 15

    if goal == "gain" and food.calories:
        cal_per_serving = float(food.calories) * float(food.serving_size) / 100
        if cal_per_serving > 200:
            score += 15

    return score


def get_recommendations(
    db: Session,
    profile: UserProfile | None,
    meal_type: str | None = None,
    limit: int = 10,
) -> list[Food]:
    """Get food recommendations for a user."""
    foods = db.query(Food).all()
    scored = [(food, score_food(food, profile, meal_type or "snack")) for food in foods]
    scored.sort(key=lambda x: x[1], reverse=True)

    recent_food_ids: set[int] = set()
    if profile:
        recent = (
            db.query(FoodEntry.food_id)
            .filter(FoodEntry.user_id == profile.user_id)
            .order_by(FoodEntry.created_at.desc())
            .limit(20)
            .all()
        )
        recent_food_ids = {r[0] for r in recent}

    result = []
    for food, _ in scored:
        if len(result) >= limit:
            break
        if food.id not in recent_food_ids:
            result.append(food)

    return result


def generate_meal_plan(
    db: Session,
    profile: UserProfile | None,
    target_calories: int,
) -> dict:
    """Generate a daily meal plan."""
    meals = {
        "breakfast": int(target_calories * 0.30),
        "lunch": int(target_calories * 0.35),
        "dinner": int(target_calories * 0.25),
        "snack": int(target_calories * 0.10),
    }

    plan = {}
    for meal_type, cal_target in meals.items():
        recommendations = get_recommendations(db, profile, meal_type, limit=15)
        selected = []
        current_cal = 0
        for food in recommendations:
            if current_cal >= cal_target:
                break
            grams = min(float(food.serving_size), 200)
            cal = float(food.calories) * grams / 100
            if current_cal + cal > cal_target * 1.2:
                continue
            selected.append({
                "food_id": food.id,
                "name": food.name,
                "quantity": grams,
                "calories": round(cal, 1),
            })
            current_cal += cal
        plan[meal_type] = {"items": selected, "total_calories": round(current_cal, 1)}

    return plan
