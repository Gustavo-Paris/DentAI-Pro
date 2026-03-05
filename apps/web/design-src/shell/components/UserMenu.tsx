interface ProductUserMenuProps {
  user: { name: string; email?: string; image?: string }
  onSignOut?: () => void
}

export function ProductUserMenu({ user, onSignOut }: ProductUserMenuProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        {user.image ? (
          <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
        ) : (
          user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
      </div>
      {onSignOut && (
        <button onClick={onSignOut} className="text-xs text-muted-foreground hover:text-foreground">
          Sair
        </button>
      )}
    </div>
  )
}
