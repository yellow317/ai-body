from datetime import date, timedelta

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.chat import get_chat_history, save_message
from app.crud.user import get_profile
from app.models.weight import WeightLog


def build_system_prompt(db: Session, user_id: int) -> str:
    profile = get_profile(db, user_id)

    lines = [
        "你是一个专业的AI健康与营养教练，名为「AI健康饮食助手」。你的职责是提供科学、个性化的饮食和健康建议。",
        "",
    ]

    if profile and profile.height and profile.weight and profile.age:
        goal_map = {"lose": "减脂", "gain": "增肌", "maintain": "维持体重"}
        activity_map = {
            "sedentary": "久坐不动",
            "light": "轻度活动（每周1-2次运动）",
            "moderate": "中度活动（每周3-5次运动）",
            "active": "高度活动（每周6-7次运动）",
            "very_active": "极高活动（高强度体力劳动或运动员）",
        }
        gender_map = {"male": "男", "female": "女"}

        lines.append("## 用户当前身体数据")
        lines.append(f"- 身高: {profile.height} cm")
        lines.append(f"- 体重: {profile.weight} kg")
        lines.append(f"- 年龄: {profile.age} 岁")
        lines.append(f"- 性别: {gender_map.get(profile.gender, profile.gender or '未设置')}")
        lines.append(f"- 活动水平: {activity_map.get(profile.activity_level, profile.activity_level or '未设置')}")
        lines.append(f"- 健身目标: {goal_map.get(profile.goal, profile.goal or '未设置')}")
        lines.append("")

        if profile.bmi:
            bmi = float(profile.bmi)
            if bmi < 18.5:
                cat = "偏瘦"
            elif bmi < 24:
                cat = "正常"
            elif bmi < 28:
                cat = "超重"
            else:
                cat = "肥胖"
            lines.append("## 计算指标")
            if profile.bmr:
                lines.append(f"- BMR (基础代谢): {profile.bmr} kcal")
            if profile.tdee:
                lines.append(f"- TDEE (每日总消耗): {profile.tdee} kcal")
            lines.append(f"- BMI: {bmi} ({cat})")
            if profile.body_fat:
                lines.append(f"- 体脂率: {profile.body_fat}%")
            if profile.target_calories:
                lines.append(f"- 目标每日摄入: {profile.target_calories} kcal")
            lines.append("")

        # Today's food diary
        today = date.today()
        from app.crud.food import get_daily_entries

        today_entries = get_daily_entries(db, user_id, today)
        if today_entries:
            lines.append("## 今日饮食记录")
            meal_order = {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐", "snack": "加餐"}
            total_cals = 0.0
            total_protein = 0.0
            total_carbs = 0.0
            total_fat = 0.0

            for meal_key, meal_label in meal_order.items():
                meal_entries = [e for e in today_entries if e.meal_type == meal_key]
                if meal_entries:
                    for e in meal_entries:
                        food_name = e.food.name if e.food else "未知食物"
                        cals = float(e.calories or 0)
                        protein = float(e.protein or 0)
                        carbs = float(e.carbs or 0)
                        fat = float(e.fat or 0)
                        lines.append(
                            f"  {meal_label}: {food_name} x{e.quantity}g, "
                            f"{cals:.0f} kcal (蛋白质{protein:.1f}g / 碳水{carbs:.1f}g / 脂肪{fat:.1f}g)"
                        )
                        total_cals += cals
                        total_protein += protein
                        total_carbs += carbs
                        total_fat += fat

            lines.append(
                f"  总计: {total_cals:.0f} kcal (蛋白质{total_protein:.1f}g / 碳水{total_carbs:.1f}g / 脂肪{total_fat:.1f}g)"
            )

            if profile and profile.target_calories:
                target = float(profile.target_calories)
                if total_cals > target:
                    lines.append(f"  已超出目标摄入 {total_cals - target:.0f} kcal")
                else:
                    lines.append(f"  距离目标还差 {target - total_cals:.0f} kcal")
            lines.append("")
        else:
            lines.append("## 今日饮食记录")
            lines.append("暂无饮食记录")
            lines.append("")

        # Recent weight trend
        seven_days_ago = today - timedelta(days=7)
        weight_logs = (
            db.query(WeightLog)
            .filter(
                WeightLog.user_id == user_id,
                WeightLog.date >= seven_days_ago,
            )
            .order_by(WeightLog.date.desc())
            .all()
        )
        if weight_logs:
            lines.append("## 近期体重趋势（最近7天）")
            for wl in weight_logs:
                lines.append(f"  {wl.date.isoformat()}: {wl.weight} kg")
            if len(weight_logs) >= 2:
                first = float(weight_logs[0].weight)
                last = float(weight_logs[-1].weight)
                change = first - last
                if change > 0.3:
                    trend = f"上升 {change:.1f} kg"
                elif change < -0.3:
                    trend = f"下降 {abs(change):.1f} kg"
                else:
                    trend = "基本稳定"
                lines.append(f"  趋势: {trend}")
            lines.append("")
    else:
        lines.append("## 用户身体数据尚未完整设置")
        lines.append("用户还未完善身高、体重、年龄等基本数据。请温和地建议用户先完善个人资料，这样才能提供更精准的建议。")
        lines.append("")

    lines.append("## 行为准则")
    lines.append("1. 使用简体中文回答，语气友好、专业、鼓励")
    lines.append("2. 提供基于科学的建议，引用营养学和运动科学原理")
    lines.append("3. 根据用户的健身目标（减脂/增肌/维持）调整建议方向")
    lines.append("4. 如果用户问及医疗问题，提醒用户咨询专业医生")
    lines.append("5. 鼓励可持续的健康习惯，反对极端节食或不安全的训练方法")
    lines.append("6. 回答要具体、可执行，而不是泛泛而谈")
    lines.append("7. 回答简洁精炼，控制在300字以内，除非用户明确要求详细说明")

    return "\n".join(lines)


def call_deepseek(messages: list[dict]) -> str:
    if not settings.DEEPSEEK_API_KEY:
        return "AI 服务尚未配置，请在 .env 中设置 DEEPSEEK_API_KEY。"

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                f"{settings.DEEPSEEK_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            return "AI 服务繁忙，请稍后再试。"
        return f"AI 服务请求失败 (HTTP {e.response.status_code})，请检查 API Key 是否正确。"
    except httpx.TimeoutException:
        return "AI 服务响应超时，请稍后再试。"
    except httpx.RequestError:
        return "无法连接到 AI 服务，请检查网络连接。"


def analyze_food_image(image_base64: str, description: str) -> tuple[str, dict | None]:
    """Analyze food image using Cloudflare Workers AI vision + GPT for nutrition.
    Returns (reply_text, food_data_dict_or_None)."""
    vision_prompt = "请描述这张食物图片：列出看到的食物名称、估计的份量大小。如果是中餐，请特别注意识别常见的中国菜品。用中文简短回复，不超过100字。"

    # Step 1: Get image description from Cloudflare Workers AI (free vision model)
    image_description = None
    if settings.CLOUDFLARE_ACCOUNT_ID and settings.CLOUDFLARE_API_TOKEN:
        try:
            with httpx.Client(timeout=45) as client:
                resp = client.post(
                    f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct",
                    headers={
                        "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": vision_prompt},
                                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                                ],
                            }
                        ],
                        "max_tokens": 200,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    image_description = data["result"]["response"]
                else:
                    body = resp.json()
                    if "Model Agreement" in str(body):
                        client.post(
                            f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct",
                            headers={
                                "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
                                "Content-Type": "application/json",
                            },
                            json={"prompt": "agree", "max_tokens": 5},
                        )
                        resp2 = client.post(
                            f"https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct",
                            headers={
                                "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
                                "Content-Type": "application/json",
                            },
                            json={
                                "messages": [
                                    {
                                        "role": "user",
                                        "content": [
                                            {"type": "text", "text": vision_prompt},
                                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
                                        ],
                                    }
                                ],
                                "max_tokens": 200,
                            },
                        )
                        if resp2.status_code == 200:
                            data = resp2.json()
                            image_description = data["result"]["response"]
        except Exception:
            pass

    # Step 2: Build nutrition analysis prompt (with JSON data request)
    user_prompt = description or ""
    if image_description:
        nutrition_prompt = (
            f"根据以下食物图片的描述，分析营养成分：\n\n图片内容：{image_description}"
        )
        if user_prompt:
            nutrition_prompt += f"\n用户补充说明：{user_prompt}"
        nutrition_prompt += (
            "\n\n请提供：\n1. 食物名称和份量\n2. 估算总热量（kcal）\n3. 蛋白质、碳水、脂肪含量估算\n4. 健康建议"
            "\n\n最后，请用以下JSON格式输出营养成分数据（仅数值，不要包含单位）："
            "\n```json\n{\"food_name\":\"食物名称\",\"calories_per_100g\":热量每100g,"
            "\"protein\":蛋白质g每100g,\"carbs\":碳水g每100g,\"fat\":脂肪g每100g,"
            "\"estimated_quantity\":估算的份量g,\"category\":\"staple|protein|vegetable|fruit|fat|beverage\"}\n```"
            "\n用中文回复，控制在300字以内。"
        )
    else:
        nutrition_prompt = f"用户上传了一张食物图片，请根据以下信息分析："
        if user_prompt:
            nutrition_prompt += f"\n用户描述：{user_prompt}\n\n请根据描述估算食物热量和营养成分，用中文回复。"
        else:
            nutrition_prompt += "\n用户没有提供描述。请友好地告诉用户目前图片识别暂不可用，请用文字描述食物，你会帮忙分析。"

    # Step 3: Get nutrition analysis from DeepSeek
    if not settings.DEEPSEEK_API_KEY:
        if image_description:
            return f"图片识别结果：{image_description}\n\n（AI 营养分析服务未配置，请在 .env 中设置 DEEPSEEK_API_KEY。）", None
        return "AI 服务尚未配置，请在 .env 中设置 DEEPSEEK_API_KEY。", None

    reply = call_deepseek([{"role": "user", "content": nutrition_prompt}])

    # Step 4: Parse JSON food data from the reply
    food_data = _parse_food_json(reply)

    return reply, food_data


def _parse_food_json(text: str) -> dict | None:
    """Extract food nutritional JSON from AI response."""
    import json
    import re

    # Try ```json ... ``` block first
    json_match = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
    if not json_match:
        # Try standalone JSON object
        json_match = re.search(r'\{[^{}]*"food_name"[^{}]*\}', text, re.DOTALL)

    if json_match:
        try:
            data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
            category_map = {
                "主食": "staple", "staple": "staple",
                "蛋白质": "protein", "protein": "protein",
                "蔬菜": "vegetable", "vegetable": "vegetable",
                "水果": "fruit", "fruit": "fruit",
                "脂肪": "fat", "fat": "fat",
                "饮品": "beverage", "beverage": "beverage",
            }
            cat = data.get("category", "staple")
            return {
                "food_name": data.get("food_name", "未知食物"),
                "calories_per_100g": float(data.get("calories_per_100g", 0)),
                "protein": float(data.get("protein", 0)),
                "carbs": float(data.get("carbs", 0)),
                "fat": float(data.get("fat", 0)),
                "estimated_quantity": float(data.get("estimated_quantity", 200)),
                "category": category_map.get(cat, cat),
            }
        except (json.JSONDecodeError, ValueError, TypeError):
            pass
    return None


def get_chat_response(db: Session, user_id: int, user_content: str) -> dict:
    system_prompt = build_system_prompt(db, user_id)
    history = get_chat_history(db, user_id, limit=20)

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": user_content})

    save_message(db, user_id, "user", user_content)

    reply = call_deepseek(messages)

    msg = save_message(db, user_id, "assistant", reply)
    return {"id": msg.id, "role": msg.role, "content": msg.content, "created_at": msg.created_at}
