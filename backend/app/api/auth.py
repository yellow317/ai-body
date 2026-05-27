from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.crud.user import (
    authenticate_user,
    create_user,
    get_profile,
    get_user_by_email,
    get_user_by_username,
    upsert_profile,
)
from app.db.database import get_db
from app.models.user import User, UserProfile
from app.schemas.user import (
    CalculationResult,
    TokenResponse,
    UserLogin,
    UserProfileResponse,
    UserProfileUpdate,
    UserRegister,
    UserResponse,
)
from app.services.health_calc import full_calculation

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/auth/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = create_user(db, data)
    token = create_access_token({"sub": str(user.id)})

    return TokenResponse(user=UserResponse.model_validate(user), token=token)


@router.post("/auth/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(user=UserResponse.model_validate(user), token=token)


@router.get("/users/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_profile(db, current_user.id)
    profile_data = None
    if profile:
        profile_data = UserProfileResponse.model_validate(profile).model_dump()
    return {
        "user": UserResponse.model_validate(current_user).model_dump(),
        "profile": profile_data,
    }


@router.put("/users/profile", response_model=UserProfileResponse)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = upsert_profile(db, current_user.id, data)

    # Recalculate health metrics if we have enough data
    if (
        profile.height
        and profile.weight
        and profile.age
        and profile.gender
        and profile.activity_level
        and profile.goal
    ):
        calc = full_calculation(
            float(profile.weight),
            float(profile.height),
            profile.age,
            profile.gender,
            profile.activity_level,
            profile.goal,
        )
        profile.bmi = calc["bmi"]
        profile.bmr = calc["bmr"]
        profile.tdee = calc["tdee"]
        profile.target_calories = calc["target_calories"]
        profile.body_fat = calc.get("body_fat")
        db.commit()
        db.refresh(profile)

    return UserProfileResponse.model_validate(profile)


@router.get("/users/calculator", response_model=CalculationResult)
def calculate(
    weight: float,
    height: float,
    age: int,
    gender: str,
    activity_level: str,
    goal: str,
    current_user: User = Depends(get_current_user),
):
    return full_calculation(weight, height, age, gender, activity_level, goal)
