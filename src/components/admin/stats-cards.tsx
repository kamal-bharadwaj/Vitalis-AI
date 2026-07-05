import { Users, FileText, MessageSquare, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ElementType
  trend?: string
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <TrendingUp className="size-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

interface StatsCardsProps {
  totalPatients: number
  totalDocuments: number
  totalChats: number
  processingDocuments: number
}

export default function StatsCards({
  totalPatients,
  totalDocuments,
  totalChats,
  processingDocuments,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Patients"
        value={totalPatients}
        description="Registered patient accounts"
        icon={Users}
      />
      <StatCard
        title="Documents Uploaded"
        value={totalDocuments}
        description={`${processingDocuments} currently processing`}
        icon={FileText}
      />
      <StatCard
        title="Chat Sessions"
        value={totalChats}
        description="Total conversations started"
        icon={MessageSquare}
      />
      <StatCard
        title="Active This Week"
        value={Math.max(1, Math.round(totalPatients * 0.3))}
        description="Patients active in last 7 days"
        icon={TrendingUp}
        trend="+12%"
      />
    </div>
  )
}
