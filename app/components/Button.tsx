interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

export function Button({ variant = 'primary', icon, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
        variant === 'primary'
          ? 'bg-fluid-primary text-white hover:bg-fluid-primary/90'
          : 'bg-white/[0.05] text-white hover:bg-white/[0.08]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {icon}
      {children}
    </button>
  );
}
