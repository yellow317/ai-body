from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    food_entries = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    favorite_foods = relationship("UserFavoriteFood", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    height = Column(Numeric(5, 2))  # cm
    weight = Column(Numeric(5, 2))  # kg
    age = Column(Integer)
    gender = Column(String(10))  # male/female/other
    activity_level = Column(String(20))  # sedentary/light/moderate/active/very_active
    goal = Column(String(20))  # lose/gain/maintain
    target_calories = Column(Integer)
    bmr = Column(Numeric(8, 2))
    tdee = Column(Numeric(8, 2))
    bmi = Column(Numeric(5, 2))
    body_fat = Column(Numeric(5, 2))
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="profile")
