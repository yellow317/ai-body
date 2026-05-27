export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/register/index',
    'pages/diary/index',
    'pages/foods/index',
    'pages/calculator/index',
    'pages/chat/index',
    'pages/recommendations/index',
    'pages/reports/index',
    'pages/settings/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'AI 健康饮食',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页', iconPath: 'assets/tab-home-u.png', selectedIconPath: 'assets/tab-home.png' },
      { pagePath: 'pages/diary/index', text: '记录', iconPath: 'assets/tab-diary-u.png', selectedIconPath: 'assets/tab-diary.png' },
      { pagePath: 'pages/chat/index', text: 'AI助手', iconPath: 'assets/tab-chat-u.png', selectedIconPath: 'assets/tab-chat.png' },
      { pagePath: 'pages/settings/index', text: '设置', iconPath: 'assets/tab-settings-u.png', selectedIconPath: 'assets/tab-settings.png' },
    ],
  },
})
