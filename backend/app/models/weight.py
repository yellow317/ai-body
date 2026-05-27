from sqlalchemy import Column, DateTime, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    weight = Column(Numeric(5, 2), nullable=False)
    body_fat = Column(Numeric(5, 2))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="weight_logs")
