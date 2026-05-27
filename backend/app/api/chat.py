import base64

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.chat import clear_chat_history, get_chat_history, save_message
from app.db.database import get_db
from app.models.user import User
from app.schemas.chat import ChatHistoryResponse, ChatMessageRequest, ChatMessageResponse
from app.services.ai_chat import analyze_food_image, get_chat_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/send", response_model=ChatMessageResponse)
def send_message(
    req: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_chat_response(db, current_user.id, req.content)
    return result


@router.get("/history", response_model=ChatHistoryResponse)
def chat_history(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = get_chat_history(db, current_user.id, limit)
    return {"messages": messages}


@router.delete("/history")
def delete_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = clear_chat_history(db, current_user.id)
    return {"message": f"已清除 {count} 条对话记录"}


@router.post("/analyze-image", response_model=ChatMessageResponse)
async def analyze_image(
    image: UploadFile = File(...),
    description: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Read and encode image to base64
    image_bytes = await image.read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    # Save user message
    display_text = description or "📷 分析食物图片"
    save_message(db, current_user.id, "user", display_text)

    # Call AI image analysis
    reply, food_data = analyze_food_image(image_base64, description)

    msg = save_message(db, current_user.id, "assistant", reply)
    return {
        "id": msg.id,
        "role": msg.role,
        "content": msg.content,
        "created_at": msg.created_at,
        "food_analysis": food_data,
    }
