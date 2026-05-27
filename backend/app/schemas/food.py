from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class FoodBase(BaseModel):
    name: str
    category: str
    serving_size: float = 100
    calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0


class FoodCreate(FoodBase):
    pass


class FoodResponse(BaseModel):
    id: int
    name: str
    category: str
    serving_size: float
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    is_custom: bool
    created_by: int | None = None
    is_favorited: bool = False

    class Config:
        from_attributes = True


class FoodSearchResult(BaseModel):
    foods: list[FoodResponse]
    total: int
    page: int
    limit: int


class FoodEntryCreate(BaseModel):
    food_id: int
    date: date
    meal_type: str = "snack"  # breakfast/lunch/dinner/snack
    quantity: float  # grams


class FoodEntryResponse(BaseModel):
    id: int
    user_id: int
    food_id: int
    food: FoodResponse | None = None
    date: date
    meal_type: str
    quantity: float
    calories: float
    protein: float
    carbs: float
    fat: float
    created_at: datetime

    class Config:
        from_attributes = True


class DailySummary(BaseModel):
    date: date
    entries: list[FoodEntryResponse]
    total: dict


class DailyStats(BaseModel):
    date: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float


class FoodFavoriteStatus(BaseModel):
    food_id: int
    is_favorited: bool


class FavoriteFoodListResponse(BaseModel):
    foods: list[FoodResponse]
    total: int


class ImageFoodEntryCreate(BaseModel):
    food_name: str
    food_category: str = "staple"
    calories_per_100g: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    entry_date: date
    meal_type: str = "snack"
    quantity: float = 100
