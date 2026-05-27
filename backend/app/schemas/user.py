from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def username_min_length(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    user: UserResponse
    token: str


class UserProfileUpdate(BaseModel):
    height: float | None = None
    weight: float | None = None
    age: int | None = None
    gender: str | None = None
    activity_level: str | None = None
    goal: str | None = None


class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    height: float | None = None
    weight: float | None = None
    age: int | None = None
    gender: str | None = None
    activity_level: str | None = None
    goal: str | None = None
    target_calories: int | None = None
    bmr: float | None = None
    tdee: float | None = None
    bmi: float | None = None
    body_fat: float | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalculationResult(BaseModel):
    bmi: float
    bmi_category: str
    body_fat: float | None = None
    bmr: float
    tdee: float
    target_calories: int
    protein_target: float
    carbs_target: float
    fat_target: float
