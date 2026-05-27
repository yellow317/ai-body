from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class FoodImageAnalysisData(BaseModel):
    food_name: str = ""
    calories_per_100g: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    estimated_quantity: float = 200
    category: str = "staple"


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    food_analysis: Optional[FoodImageAnalysisData] = None

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
