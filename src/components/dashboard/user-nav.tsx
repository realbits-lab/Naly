'use client'

import { signOut, useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, User, CreditCard, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserNav() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => router.push('/auth/signin')}
      >
        <User className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    )
  }

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/'
    })
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator'
      case 'INSTITUTIONAL':
        return 'Institutional'
      case 'PREMIUM':
        return 'Premium'
      case 'RETAIL_INDIVIDUAL':
        return 'Individual'
      case 'RETAIL_ADVISOR':
        return 'Advisor'
      default:
        return 'User'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
          <div className="flex items-center space-x-3 w-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
              <AvatarFallback className="text-xs">
                {getInitials(session.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start space-y-1 flex-1 min-w-0">
              <p className="text-sm font-medium truncate w-full">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {getRoleLabel(session.user.role)}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push('/settings/billing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>

        {session.user.role === 'ADMIN' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}