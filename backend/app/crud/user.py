from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User, UserProfile
from app.schemas.user import UserProfileUpdate, UserRegister


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, data: UserRegister) -> User:
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def get_profile(db: Session, user_id: int) -> UserProfile | None:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()


def upsert_profile(db: Session, user_id: int, data: UserProfileUpdate) -> UserProfile:
    profile = get_profile(db, user_id)
    update_data = data.model_dump(exclude_unset=True)

    if profile is None:
        profile = UserProfile(user_id=user_id, **update_data)
        db.add(profile)
    else:
        for key, value in update_data.items():
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile
