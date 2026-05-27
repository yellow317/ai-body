"""Seed the database with 130+ common food items including beverages and alcohol."""

from sqlalchemy.orm import Session

from app.db.database import SessionLocal, engine
from app.models.food import Food  # noqa: F401
from app.models.goal import Goal  # noqa: F401
from app.models.user import User, UserProfile  # noqa: F401
from app.models.weight import WeightLog  # noqa: F401
from app.db.database import Base

# Create all tables
Base.metadata.create_all(bind=engine)

FOODS = [
    # ============ 主食 Staple ============
    {"name": "白米饭", "category": "staple", "calories": 116, "protein": 2.6, "carbs": 25.6, "fat": 0.3, "fiber": 0.3, "sugar": 0.1},
    {"name": "馒头", "category": "staple", "calories": 223, "protein": 7.0, "carbs": 44.2, "fat": 1.1, "fiber": 1.3, "sugar": 1.2},
    {"name": "全麦面包", "category": "staple", "calories": 246, "protein": 10.4, "carbs": 41.3, "fat": 3.4, "fiber": 6.0, "sugar": 4.2},
    {"name": "面条(煮)", "category": "staple", "calories": 138, "protein": 4.5, "carbs": 25.0, "fat": 1.4, "fiber": 0.7, "sugar": 0.3},
    {"name": "燕麦片", "category": "staple", "calories": 367, "protein": 13.5, "carbs": 61.6, "fat": 6.7, "fiber": 10.1, "sugar": 1.0},
    {"name": "糙米饭", "category": "staple", "calories": 123, "protein": 2.7, "carbs": 23.5, "fat": 0.9, "fiber": 1.8, "sugar": 0.3},
    {"name": "红薯", "category": "staple", "calories": 86, "protein": 1.6, "carbs": 20.1, "fat": 0.1, "fiber": 3.0, "sugar": 4.2},
    {"name": "玉米", "category": "staple", "calories": 112, "protein": 3.3, "carbs": 19.0, "fat": 1.2, "fiber": 2.4, "sugar": 3.2},
    {"name": "藜麦", "category": "staple", "calories": 120, "protein": 4.4, "carbs": 21.3, "fat": 1.9, "fiber": 2.8, "sugar": 0.9},
    {"name": "土豆", "category": "staple", "calories": 76, "protein": 2.0, "carbs": 17.5, "fat": 0.1, "fiber": 2.2, "sugar": 0.8},
    {"name": "小米粥", "category": "staple", "calories": 46, "protein": 1.4, "carbs": 8.4, "fat": 0.7, "fiber": 0.5, "sugar": 0.2},
    {"name": "饺子(猪肉)", "category": "staple", "calories": 220, "protein": 8.5, "carbs": 25.0, "fat": 9.5, "fiber": 0.8, "sugar": 1.0},
    {"name": "包子(肉馅)", "category": "staple", "calories": 226, "protein": 8.0, "carbs": 28.0, "fat": 8.5, "fiber": 1.0, "sugar": 1.5},
    {"name": "白粥", "category": "staple", "calories": 30, "protein": 0.7, "carbs": 6.5, "fat": 0.1, "fiber": 0.1, "sugar": 0.1},
    {"name": "糯米", "category": "staple", "calories": 116, "protein": 2.4, "carbs": 25.0, "fat": 0.3, "fiber": 0.5, "sugar": 0.2},
    {"name": "方便面", "category": "staple", "calories": 440, "protein": 9.0, "carbs": 57.0, "fat": 18.0, "fiber": 1.5, "sugar": 2.0},
    {"name": "年糕", "category": "staple", "calories": 154, "protein": 2.7, "carbs": 33.0, "fat": 0.5, "fiber": 0.4, "sugar": 0.5},

    # ============ 蛋白质 Protein ============
    {"name": "鸡胸肉", "category": "protein", "calories": 133, "protein": 31.0, "carbs": 0, "fat": 1.2, "fiber": 0, "sugar": 0},
    {"name": "鸡蛋", "category": "protein", "calories": 144, "protein": 13.3, "carbs": 1.5, "fat": 9.5, "fiber": 0, "sugar": 1.5},
    {"name": "三文鱼", "category": "protein", "calories": 208, "protein": 20.4, "carbs": 0, "fat": 13.4, "fiber": 0, "sugar": 0},
    {"name": "瘦牛肉", "category": "protein", "calories": 125, "protein": 22.3, "carbs": 0, "fat": 4.0, "fiber": 0, "sugar": 0},
    {"name": "猪里脊", "category": "protein", "calories": 155, "protein": 20.2, "carbs": 0, "fat": 7.9, "fiber": 0, "sugar": 0},
    {"name": "虾仁", "category": "protein", "calories": 93, "protein": 20.6, "carbs": 0.4, "fat": 0.6, "fiber": 0, "sugar": 0},
    {"name": "豆腐", "category": "protein", "calories": 76, "protein": 8.1, "carbs": 1.9, "fat": 4.2, "fiber": 0.3, "sugar": 0.4},
    {"name": "希腊酸奶", "category": "protein", "calories": 97, "protein": 9.0, "carbs": 3.6, "fat": 5.0, "fiber": 0, "sugar": 3.2},
    {"name": "牛奶(全脂)", "category": "protein", "calories": 65, "protein": 3.2, "carbs": 5.1, "fat": 3.6, "fiber": 0, "sugar": 5.1},
    {"name": "巴沙鱼柳", "category": "protein", "calories": 80, "protein": 15.0, "carbs": 0, "fat": 1.8, "fiber": 0, "sugar": 0},
    {"name": "鳕鱼", "category": "protein", "calories": 82, "protein": 17.8, "carbs": 0, "fat": 0.7, "fiber": 0, "sugar": 0},
    {"name": "火鸡肉", "category": "protein", "calories": 135, "protein": 24.6, "carbs": 0, "fat": 3.7, "fiber": 0, "sugar": 0},
    {"name": "鸡腿肉", "category": "protein", "calories": 181, "protein": 19.0, "carbs": 0, "fat": 11.0, "fiber": 0, "sugar": 0},
    {"name": "猪排骨", "category": "protein", "calories": 264, "protein": 18.3, "carbs": 0, "fat": 20.0, "fiber": 0, "sugar": 0},
    {"name": "培根", "category": "protein", "calories": 541, "protein": 12.0, "carbs": 1.5, "fat": 53.0, "fiber": 0, "sugar": 0},
    {"name": "鲫鱼", "category": "protein", "calories": 108, "protein": 17.1, "carbs": 0, "fat": 4.5, "fiber": 0, "sugar": 0},
    {"name": "金枪鱼(罐头)", "category": "protein", "calories": 116, "protein": 26.0, "carbs": 0, "fat": 0.8, "fiber": 0, "sugar": 0},
    {"name": "鱿鱼", "category": "protein", "calories": 75, "protein": 15.5, "carbs": 0.8, "fat": 1.0, "fiber": 0, "sugar": 0},
    {"name": "螃蟹", "category": "protein", "calories": 95, "protein": 17.5, "carbs": 0.6, "fat": 2.3, "fiber": 0, "sugar": 0},
    {"name": "牛奶(脱脂)", "category": "protein", "calories": 35, "protein": 3.4, "carbs": 5.0, "fat": 0.1, "fiber": 0, "sugar": 5.0},
    {"name": "酸奶(原味)", "category": "protein", "calories": 63, "protein": 3.5, "carbs": 7.0, "fat": 2.5, "fiber": 0, "sugar": 7.0},
    {"name": "芝士片", "category": "protein", "calories": 320, "protein": 18.0, "carbs": 2.0, "fat": 26.0, "fiber": 0, "sugar": 1.0},
    {"name": "鸭蛋", "category": "protein", "calories": 180, "protein": 12.6, "carbs": 3.1, "fat": 13.6, "fiber": 0, "sugar": 0},
    {"name": "毛豆", "category": "protein", "calories": 131, "protein": 12.0, "carbs": 10.0, "fat": 5.5, "fiber": 5.0, "sugar": 0},
    {"name": "黄豆", "category": "protein", "calories": 390, "protein": 35.0, "carbs": 34.0, "fat": 16.0, "fiber": 15.0, "sugar": 7.0},

    # ============ 蔬菜 Vegetables ============
    {"name": "西兰花", "category": "vegetable", "calories": 34, "protein": 2.8, "carbs": 6.6, "fat": 0.4, "fiber": 2.6, "sugar": 1.7},
    {"name": "菠菜", "category": "vegetable", "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "fiber": 2.2, "sugar": 0.4},
    {"name": "番茄", "category": "vegetable", "calories": 18, "protein": 0.9, "carbs": 3.9, "fat": 0.2, "fiber": 1.2, "sugar": 2.6},
    {"name": "黄瓜", "category": "vegetable", "calories": 15, "protein": 0.7, "carbs": 2.9, "fat": 0.1, "fiber": 0.5, "sugar": 1.7},
    {"name": "胡萝卜", "category": "vegetable", "calories": 37, "protein": 0.9, "carbs": 8.8, "fat": 0.2, "fiber": 2.8, "sugar": 4.7},
    {"name": "生菜", "category": "vegetable", "calories": 13, "protein": 1.3, "carbs": 2.2, "fat": 0.3, "fiber": 1.3, "sugar": 0.9},
    {"name": "洋葱", "category": "vegetable", "calories": 40, "protein": 1.1, "carbs": 9.3, "fat": 0.1, "fiber": 1.7, "sugar": 4.2},
    {"name": "青椒", "category": "vegetable", "calories": 20, "protein": 0.9, "carbs": 4.6, "fat": 0.2, "fiber": 1.7, "sugar": 2.4},
    {"name": "芹菜", "category": "vegetable", "calories": 16, "protein": 0.7, "carbs": 3.0, "fat": 0.2, "fiber": 1.6, "sugar": 1.3},
    {"name": "南瓜", "category": "vegetable", "calories": 22, "protein": 1.0, "carbs": 5.3, "fat": 0.1, "fiber": 1.1, "sugar": 1.4},
    {"name": "茄子", "category": "vegetable", "calories": 25, "protein": 1.0, "carbs": 5.9, "fat": 0.2, "fiber": 3.0, "sugar": 3.5},
    {"name": "白菜", "category": "vegetable", "calories": 13, "protein": 1.5, "carbs": 2.2, "fat": 0.2, "fiber": 1.0, "sugar": 1.2},
    {"name": "卷心菜", "category": "vegetable", "calories": 25, "protein": 1.3, "carbs": 5.8, "fat": 0.1, "fiber": 2.5, "sugar": 3.2},
    {"name": "豆芽", "category": "vegetable", "calories": 24, "protein": 2.5, "carbs": 3.8, "fat": 0.3, "fiber": 1.0, "sugar": 0.8},
    {"name": "香菇", "category": "vegetable", "calories": 34, "protein": 3.1, "carbs": 5.3, "fat": 0.3, "fiber": 2.5, "sugar": 2.0},
    {"name": "金针菇", "category": "vegetable", "calories": 32, "protein": 2.8, "carbs": 5.0, "fat": 0.5, "fiber": 2.7, "sugar": 1.2},
    {"name": "莲藕", "category": "vegetable", "calories": 73, "protein": 2.6, "carbs": 16.4, "fat": 0.1, "fiber": 3.0, "sugar": 0.5},
    {"name": "苦瓜", "category": "vegetable", "calories": 19, "protein": 1.0, "carbs": 3.5, "fat": 0.2, "fiber": 2.8, "sugar": 0.4},
    {"name": "冬瓜", "category": "vegetable", "calories": 12, "protein": 0.4, "carbs": 2.6, "fat": 0.1, "fiber": 0.8, "sugar": 1.0},

    # ============ 水果 Fruits ============
    {"name": "苹果", "category": "fruit", "calories": 52, "protein": 0.3, "carbs": 13.8, "fat": 0.2, "fiber": 2.4, "sugar": 10.4},
    {"name": "香蕉", "category": "fruit", "calories": 89, "protein": 1.1, "carbs": 22.8, "fat": 0.3, "fiber": 2.6, "sugar": 12.2},
    {"name": "橙子", "category": "fruit", "calories": 47, "protein": 0.9, "carbs": 11.8, "fat": 0.1, "fiber": 2.4, "sugar": 9.4},
    {"name": "葡萄", "category": "fruit", "calories": 69, "protein": 0.7, "carbs": 18.1, "fat": 0.2, "fiber": 0.9, "sugar": 15.5},
    {"name": "蓝莓", "category": "fruit", "calories": 57, "protein": 0.7, "carbs": 14.5, "fat": 0.3, "fiber": 2.4, "sugar": 10.0},
    {"name": "草莓", "category": "fruit", "calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3, "fiber": 2.0, "sugar": 4.9},
    {"name": "奇异果", "category": "fruit", "calories": 61, "protein": 1.1, "carbs": 14.7, "fat": 0.5, "fiber": 3.0, "sugar": 9.0},
    {"name": "圣女果", "category": "fruit", "calories": 22, "protein": 1.0, "carbs": 4.0, "fat": 0.2, "fiber": 1.2, "sugar": 2.6},
    {"name": "柚子", "category": "fruit", "calories": 38, "protein": 0.7, "carbs": 9.6, "fat": 0.2, "fiber": 1.1, "sugar": 6.0},
    {"name": "桃子", "category": "fruit", "calories": 42, "protein": 0.9, "carbs": 10.5, "fat": 0.1, "fiber": 1.5, "sugar": 8.4},
    {"name": "梨", "category": "fruit", "calories": 51, "protein": 0.4, "carbs": 13.1, "fat": 0.1, "fiber": 3.1, "sugar": 9.8},
    {"name": "西瓜", "category": "fruit", "calories": 30, "protein": 0.6, "carbs": 7.6, "fat": 0.2, "fiber": 0.4, "sugar": 6.2},
    {"name": "芒果", "category": "fruit", "calories": 60, "protein": 0.8, "carbs": 15.0, "fat": 0.4, "fiber": 1.6, "sugar": 13.7},
    {"name": "樱桃", "category": "fruit", "calories": 63, "protein": 1.1, "carbs": 16.0, "fat": 0.2, "fiber": 2.1, "sugar": 12.8},
    {"name": "火龙果", "category": "fruit", "calories": 55, "protein": 1.1, "carbs": 13.0, "fat": 0.4, "fiber": 2.8, "sugar": 8.0},
    {"name": "榴莲", "category": "fruit", "calories": 147, "protein": 1.5, "carbs": 27.1, "fat": 5.3, "fiber": 3.8, "sugar": 0},
    {"name": "荔枝", "category": "fruit", "calories": 66, "protein": 0.8, "carbs": 16.5, "fat": 0.4, "fiber": 1.3, "sugar": 15.2},
    {"name": "菠萝", "category": "fruit", "calories": 44, "protein": 0.5, "carbs": 10.8, "fat": 0.1, "fiber": 1.4, "sugar": 9.9},

    # ============ 脂肪/坚果 Fats & Nuts ============
    {"name": "牛油果", "category": "fat", "calories": 160, "protein": 2.0, "carbs": 8.5, "fat": 14.7, "fiber": 6.7, "sugar": 0.7},
    {"name": "杏仁", "category": "fat", "calories": 579, "protein": 21.2, "carbs": 21.6, "fat": 49.9, "fiber": 12.5, "sugar": 4.4},
    {"name": "核桃", "category": "fat", "calories": 654, "protein": 15.2, "carbs": 13.7, "fat": 65.2, "fiber": 6.7, "sugar": 2.6},
    {"name": "橄榄油", "category": "fat", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "sugar": 0},
    {"name": "花生酱", "category": "fat", "calories": 588, "protein": 25.1, "carbs": 20.0, "fat": 50.0, "fiber": 6.0, "sugar": 9.0},
    {"name": "芝麻", "category": "fat", "calories": 573, "protein": 17.7, "carbs": 23.4, "fat": 49.7, "fiber": 11.8, "sugar": 0.3},
    {"name": "腰果", "category": "fat", "calories": 553, "protein": 18.2, "carbs": 30.2, "fat": 43.9, "fiber": 3.3, "sugar": 5.9},
    {"name": "开心果", "category": "fat", "calories": 560, "protein": 20.2, "carbs": 27.2, "fat": 45.3, "fiber": 10.6, "sugar": 7.7},
    {"name": "花生", "category": "fat", "calories": 567, "protein": 25.8, "carbs": 16.1, "fat": 49.2, "fiber": 8.5, "sugar": 4.7},
    {"name": "葵花籽", "category": "fat", "calories": 584, "protein": 20.8, "carbs": 20.0, "fat": 51.5, "fiber": 8.6, "sugar": 2.6},
    {"name": "奇亚籽", "category": "fat", "calories": 486, "protein": 16.5, "carbs": 42.1, "fat": 30.7, "fiber": 34.4, "sugar": 0},
    {"name": "花生油", "category": "fat", "calories": 884, "protein": 0, "carbs": 0, "fat": 100, "fiber": 0, "sugar": 0},
    {"name": "芝麻酱", "category": "fat", "calories": 595, "protein": 18.0, "carbs": 22.0, "fat": 52.0, "fiber": 10.0, "sugar": 0.5},
    {"name": "黄油", "category": "fat", "calories": 717, "protein": 0.9, "carbs": 0.1, "fat": 81.1, "fiber": 0, "sugar": 0.1},

    # ============ 饮品/酒类 Beverages & Alcohol ============
    # 水/茶/咖啡
    {"name": "矿泉水", "category": "beverage", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "美式咖啡(黑)", "category": "beverage", "calories": 2, "protein": 0.1, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "拿铁咖啡", "category": "beverage", "calories": 56, "protein": 2.8, "carbs": 4.8, "fat": 3.0, "fiber": 0, "sugar": 4.5},
    {"name": "卡布奇诺", "category": "beverage", "calories": 38, "protein": 1.8, "carbs": 3.2, "fat": 1.8, "fiber": 0, "sugar": 3.0},
    {"name": "摩卡咖啡", "category": "beverage", "calories": 78, "protein": 2.5, "carbs": 10.5, "fat": 3.2, "fiber": 0.5, "sugar": 8.5},
    {"name": "绿茶", "category": "beverage", "calories": 1, "protein": 0.1, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "红茶", "category": "beverage", "calories": 1, "protein": 0, "carbs": 0.2, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "乌龙茶", "category": "beverage", "calories": 1, "protein": 0, "carbs": 0.1, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "茉莉花茶", "category": "beverage", "calories": 1, "protein": 0, "carbs": 0.1, "fat": 0, "fiber": 0, "sugar": 0},

    # 果汁/饮料
    {"name": "橙汁", "category": "beverage", "calories": 45, "protein": 0.7, "carbs": 10.4, "fat": 0.2, "fiber": 0.2, "sugar": 8.4},
    {"name": "苹果汁", "category": "beverage", "calories": 46, "protein": 0.1, "carbs": 11.3, "fat": 0.1, "fiber": 0.2, "sugar": 9.6},
    {"name": "葡萄汁", "category": "beverage", "calories": 60, "protein": 0.4, "carbs": 14.8, "fat": 0.1, "fiber": 0.1, "sugar": 14.2},
    {"name": "西瓜汁", "category": "beverage", "calories": 30, "protein": 0.6, "carbs": 7.2, "fat": 0.1, "fiber": 0.1, "sugar": 6.0},
    {"name": "椰子水", "category": "beverage", "calories": 19, "protein": 0.7, "carbs": 3.7, "fat": 0.2, "fiber": 1.1, "sugar": 2.6},
    {"name": "可乐", "category": "beverage", "calories": 42, "protein": 0, "carbs": 10.6, "fat": 0, "fiber": 0, "sugar": 10.6},
    {"name": "无糖可乐", "category": "beverage", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "雪碧", "category": "beverage", "calories": 41, "protein": 0, "carbs": 10.2, "fat": 0, "fiber": 0, "sugar": 10.2},
    {"name": "芬达", "category": "beverage", "calories": 44, "protein": 0, "carbs": 11.0, "fat": 0, "fiber": 0, "sugar": 11.0},
    {"name": "苏打水", "category": "beverage", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "柠檬水", "category": "beverage", "calories": 25, "protein": 0, "carbs": 6.5, "fat": 0, "fiber": 0, "sugar": 6.0},
    {"name": "运动饮料(佳得乐)", "category": "beverage", "calories": 26, "protein": 0, "carbs": 6.4, "fat": 0, "fiber": 0, "sugar": 5.8},

    # 奶茶/奶制品饮品
    {"name": "珍珠奶茶", "category": "beverage", "calories": 80, "protein": 0.8, "carbs": 12.5, "fat": 2.8, "fiber": 0.2, "sugar": 9.5},
    {"name": "奶盖茶", "category": "beverage", "calories": 95, "protein": 1.2, "carbs": 8.0, "fat": 6.5, "fiber": 0, "sugar": 7.0},
    {"name": "红豆奶茶", "category": "beverage", "calories": 72, "protein": 1.0, "carbs": 11.5, "fat": 2.0, "fiber": 0.5, "sugar": 8.5},
    {"name": "豆奶", "category": "beverage", "calories": 44, "protein": 3.3, "carbs": 3.0, "fat": 1.8, "fiber": 0.6, "sugar": 2.5},
    {"name": "巧克力奶", "category": "beverage", "calories": 83, "protein": 3.2, "carbs": 10.5, "fat": 3.4, "fiber": 0.5, "sugar": 9.5},

    # 功能性饮品
    {"name": "红牛", "category": "beverage", "calories": 46, "protein": 0, "carbs": 11.0, "fat": 0, "fiber": 0, "sugar": 11.0},
    {"name": "魔爪能量", "category": "beverage", "calories": 42, "protein": 0, "carbs": 10.5, "fat": 0, "fiber": 0, "sugar": 10.1},
    {"name": "蜂蜜水", "category": "beverage", "calories": 30, "protein": 0, "carbs": 7.5, "fat": 0, "fiber": 0, "sugar": 7.2},

    # 酒类
    {"name": "啤酒(5%)", "category": "beverage", "calories": 43, "protein": 0.5, "carbs": 3.6, "fat": 0, "fiber": 0, "sugar": 0.1},
    {"name": "精酿啤酒(7%)", "category": "beverage", "calories": 60, "protein": 0.8, "carbs": 5.0, "fat": 0, "fiber": 0, "sugar": 0.1},
    {"name": "淡啤酒(Light)", "category": "beverage", "calories": 29, "protein": 0.3, "carbs": 1.6, "fat": 0, "fiber": 0, "sugar": 0.1},
    {"name": "红葡萄酒", "category": "beverage", "calories": 85, "protein": 0.1, "carbs": 2.6, "fat": 0, "fiber": 0, "sugar": 0.6},
    {"name": "白葡萄酒", "category": "beverage", "calories": 82, "protein": 0.1, "carbs": 2.6, "fat": 0, "fiber": 0, "sugar": 1.4},
    {"name": "香槟", "category": "beverage", "calories": 82, "protein": 0.1, "carbs": 2.8, "fat": 0, "fiber": 0, "sugar": 1.0},
    {"name": "白酒(52度)", "category": "beverage", "calories": 298, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "黄酒", "category": "beverage", "calories": 88, "protein": 1.2, "carbs": 6.0, "fat": 0, "fiber": 0, "sugar": 2.0},
    {"name": "清酒", "category": "beverage", "calories": 112, "protein": 0.5, "carbs": 4.5, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "威士忌", "category": "beverage", "calories": 250, "protein": 0, "carbs": 0.1, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "伏特加", "category": "beverage", "calories": 231, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "朗姆酒", "category": "beverage", "calories": 231, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "金酒(杜松子酒)", "category": "beverage", "calories": 263, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0},
    {"name": "鸡尾酒(玛格丽特)", "category": "beverage", "calories": 153, "protein": 0.1, "carbs": 11.0, "fat": 0.1, "fiber": 0, "sugar": 9.0},
    {"name": "鸡尾酒(莫吉托)", "category": "beverage", "calories": 98, "protein": 0.1, "carbs": 7.0, "fat": 0, "fiber": 0.1, "sugar": 5.5},
    {"name": "鸡尾酒(长岛冰茶)", "category": "beverage", "calories": 186, "protein": 0, "carbs": 13.5, "fat": 0, "fiber": 0, "sugar": 12.0},
    {"name": "米酒", "category": "beverage", "calories": 65, "protein": 1.0, "carbs": 9.0, "fat": 0, "fiber": 0, "sugar": 5.0},
    {"name": "百利甜酒", "category": "beverage", "calories": 327, "protein": 3.0, "carbs": 25.0, "fat": 13.0, "fiber": 0, "sugar": 20.0},

    # 零食/其他
    {"name": "黑巧克力(70%)", "category": "fat", "calories": 598, "protein": 7.8, "carbs": 45.9, "fat": 42.6, "fiber": 10.9, "sugar": 24.0},
    {"name": "牛奶巧克力", "category": "fat", "calories": 535, "protein": 7.6, "carbs": 59.4, "fat": 29.7, "fiber": 3.4, "sugar": 51.5},
    {"name": "薯片", "category": "fat", "calories": 536, "protein": 6.5, "carbs": 49.0, "fat": 34.0, "fiber": 4.0, "sugar": 1.5},
    {"name": "饼干(苏打)", "category": "staple", "calories": 430, "protein": 8.5, "carbs": 70.0, "fat": 12.0, "fiber": 2.5, "sugar": 4.0},
    {"name": "冰淇淋(香草)", "category": "fat", "calories": 207, "protein": 3.5, "carbs": 23.6, "fat": 11.0, "fiber": 0.7, "sugar": 21.2},
    {"name": "蛋糕(奶油)", "category": "staple", "calories": 357, "protein": 4.5, "carbs": 48.0, "fat": 16.0, "fiber": 0.5, "sugar": 30.0},
    {"name": "蜂蜜", "category": "beverage", "calories": 304, "protein": 0.3, "carbs": 82.4, "fat": 0, "fiber": 0.2, "sugar": 82.1},
    {"name": "白糖", "category": "staple", "calories": 387, "protein": 0, "carbs": 100, "fat": 0, "fiber": 0, "sugar": 100},
]


def seed(db: Session):
    # Check if already seeded with the full set
    existing = db.query(Food).count()
    if existing >= len(FOODS):
        return

    # Clear existing data and re-seed for clean state
    db.query(Food).delete()
    db.commit()

    for food_data in FOODS:
        food = Food(**food_data)
        db.add(food)
    db.commit()
    print(f"Seeded {len(FOODS)} foods.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
