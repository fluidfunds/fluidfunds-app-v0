interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  icon?: React.ReactNode
}

export function Button({ variant = 'primary', icon, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        w-full px-4 py-3 rounded-lg font-medium transition-all duration-200
        flex items-center justify-center gap-2
        ${variant === 'primary' 
          ? 'bg-fluid-primary text-white hover:bg-fluid-primary/90' 
          : 'bg-white/[0.05] text-white hover:bg-white/[0.08]'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {icon}
      {children}
    </button>
  )
} 