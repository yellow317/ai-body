from sqlalchemy.orm import Session

from app.models.chat import ChatMessage


def save_message(db: Session, user_id: int, role: str, content: str) -> ChatMessage:
    msg = ChatMessage(user_id=user_id, role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_chat_history(db: Session, user_id: int, limit: int = 50) -> list[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )


def clear_chat_history(db: Session, user_id: int) -> int:
    count = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .delete()
    )
    db.commit()
    return count
