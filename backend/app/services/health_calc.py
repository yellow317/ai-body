"""Health calculation service: BMI, BMR, TDEE, body fat estimation."""


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 2)


def bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "偏瘦"
    elif bmi < 24:
        return "正常"
    elif bmi < 28:
        return "超重"
    else:
        return "肥胖"


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    if gender == "male":
        bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
    return round(bmr, 2)


ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}


def calculate_tdee(bmr: float, activity_level: str) -> float:
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level, 1.2)
    return round(bmr * multiplier, 2)


def calculate_target_calories(tdee: float, goal: str) -> int:
    if goal == "lose":
        return int(tdee * 0.8)
    elif goal == "gain":
        return int(tdee * 1.1)
    else:
        return int(tdee)


def estimate_body_fat(bmi: float, age: int, gender: str) -> float:
    # Deurenberg formula
    if gender == "male":
        body_fat = (1.20 * bmi) + (0.23 * age) - 16.2
    else:
        body_fat = (1.20 * bmi) + (0.23 * age) - 5.4
    return round(max(body_fat, 3), 2)


def calculate_macros(target_calories: int) -> dict:
    protein_cal = target_calories * 0.30
    carbs_cal = target_calories * 0.45
    fat_cal = target_calories * 0.25
    return {
        "protein_target": round(protein_cal / 4, 1),
        "carbs_target": round(carbs_cal / 4, 1),
        "fat_target": round(fat_cal / 9, 1),
    }


def full_calculation(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
    goal: str,
) -> dict:
    bmi = calculate_bmi(weight_kg, height_cm)
    body_fat = estimate_body_fat(bmi, age, gender)
    bmr = calculate_bmr(weight_kg, height_cm, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    target_calories = calculate_target_calories(tdee, goal)
    macros = calculate_macros(target_calories)

    return {
        "bmi": bmi,
        "bmi_category": bmi_category(bmi),
        "body_fat": body_fat,
        "bmr": bmr,
        "tdee": tdee,
        "target_calories": target_calories,
        **macros,
    }
