import { ProductShell } from './components'
import { getDefaultNavigation } from './components/MainNav'

export default function ShellPreview() {
  const navigation = getDefaultNavigation()

  const user = {
    name: 'Dr. Ana Silva',
    email: 'ana.silva@clinica.com',
    image: undefined,
  }

  return (
    <ProductShell
      navigationItems={navigation}
      user={user}
      onSignOut={() => console.log('Sign out')}
    >
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Content Area</h1>
        <p className="text-muted-foreground">
          Section content will render here. The shell provides sidebar navigation,
          brand identity, user menu, and credit tracking.
        </p>
      </div>
    </ProductShell>
  )
}
