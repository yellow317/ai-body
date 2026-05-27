import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        AI 健康饮食
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        智能追踪你的身体数据，科学管理饮食，达成理想健康
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          icon="🧮"
          title="身体指标计算"
          desc="BMI、体脂率、BMR、TDEE 一键计算"
        />
        <FeatureCard
          icon="📝"
          title="饮食记录追踪"
          desc="记录每餐饮食，自动计算营养摄入"
        />
        <FeatureCard
          icon="🤖"
          title="智能饮食推荐"
          desc="AI 根据你的目标推荐最佳食物和饮食计划"
        />
      </div>

      {!user ? (
        <div className="space-x-4">
          <Link to="/register" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-primary-700 inline-block">
            免费开始使用
          </Link>
          <Link to="/login" className="border border-primary-600 text-primary-600 px-8 py-3 rounded-lg text-lg hover:bg-primary-50 inline-block">
            已有账号？登录
          </Link>
        </div>
      ) : (
        <Link to="/dashboard" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-primary-700 inline-block">
          进入仪表盘
        </Link>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{desc}</p>
    </div>
  )
}
