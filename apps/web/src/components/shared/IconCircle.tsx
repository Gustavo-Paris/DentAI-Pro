interface IconCircleProps {
  children: React.ReactNode;
  className?: string;
}

export function IconCircle({ children, className = '' }: IconCircleProps) {
  return (
    <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 ${className}`}>
      {children}
    </div>
  );
}
