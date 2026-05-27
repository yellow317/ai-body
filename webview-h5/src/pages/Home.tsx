import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="max-w-lg mx-auto text-center px-4 pt-8 pb-20">
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl text-white font-bold">AI</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 健康饮食</h1>
        <p className="text-gray-500 text-sm">智能追踪身体数据，科学管理饮食，达成理想健康</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <FeatureCard icon="🧮" title="指标计算" desc="BMI/BMR/TDEE" />
        <FeatureCard icon="📝" title="饮食记录" desc="营养摄入追踪" />
        <FeatureCard icon="🤖" title="AI推荐" desc="智能饮食计划" />
      </div>

      {!user ? (
        <div className="space-y-3">
          <Link to="/register" className="block w-full bg-primary-600 text-white py-3.5 rounded-xl text-base font-medium active:bg-primary-700 transition-colors">
            免费开始使用
          </Link>
          <Link to="/login" className="block w-full border border-primary-300 text-primary-600 py-3.5 rounded-xl text-base font-medium active:bg-primary-50 transition-colors">
            已有账号？登录
          </Link>
        </div>
      ) : (
        <Link to="/dashboard" className="block w-full bg-primary-600 text-white py-3.5 rounded-xl text-base font-medium active:bg-primary-700 transition-colors">
          进入仪表盘
        </Link>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="text-2xl mb-1.5">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{title}</h3>
      <p className="text-[11px] text-gray-500">{desc}</p>
    </div>
  )
}
