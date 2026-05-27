from sqlalchemy import Boolean, Column, DateTime, Date, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50))  # staple/protein/vegetable/fruit/fat
    serving_size = Column(Numeric(8, 2), default=100)  # standard serving in grams
    calories = Column(Numeric(8, 2))  # per 100g
    protein = Column(Numeric(8, 2))  # g per 100g
    carbs = Column(Numeric(8, 2))
    fat = Column(Numeric(8, 2))
    fiber = Column(Numeric(8, 2))
    sugar = Column(Numeric(8, 2))
    is_custom = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    favorited_by = relationship("UserFavoriteFood", back_populates="food", cascade="all, delete-orphan")


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    meal_type = Column(String(20))  # breakfast/lunch/dinner/snack
    quantity = Column(Numeric(8, 2), nullable=False)  # grams
    calories = Column(Numeric(8, 2))
    protein = Column(Numeric(8, 2))
    carbs = Column(Numeric(8, 2))
    fat = Column(Numeric(8, 2))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="food_entries")
    food = relationship("Food")


class UserFavoriteFood(Base):
    __tablename__ = "user_favorite_foods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="favorite_foods")
    food = relationship("Food", back_populates="favorited_by")

    __table_args__ = (
        UniqueConstraint("user_id", "food_id", name="uq_user_food_favorite"),
    )
