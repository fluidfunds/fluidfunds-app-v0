interface DashboardCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  loading?: boolean
}

export function DashboardCard({ title, icon, children, loading }: DashboardCardProps) {
  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] 
                    border border-white/[0.08] backdrop-blur-sm hover:border-white/[0.15] 
                    transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-fluid-primary/10 flex items-center justify-center 
                         group-hover:bg-fluid-primary/20 transition-all duration-300">
            {icon}
          </span>
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-fluid-primary"></div>
        )}
      </div>
      {children}
    </div>
  )
} 