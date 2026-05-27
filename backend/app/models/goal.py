from sqlalchemy import Boolean, Column, DateTime, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String(50))  # weight/calories/protein
    target_value = Column(Numeric(10, 2))
    current_value = Column(Numeric(10, 2))
    start_date = Column(Date)
    end_date = Column(Date)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="goals")
