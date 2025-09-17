"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signIn, signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart3,
  Newspaper,
  Menu,
  Palette,
  Monitor,
  Sun,
  Moon,
  Check,
  Settings,
  PenTool,
  User,
  LogOut
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"

const navigationItems = [
  {
    name: "News",
    href: "/news",
    icon: Newspaper,
  },
]

const adminNavigationItems = [
  {
    name: "Write",
    href: "/write",
    icon: PenTool,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()

  const themes = [
    { name: "Light", value: "light", icon: Sun },
    { name: "Dark", value: "dark", icon: Moon },
    { name: "System", value: "system", icon: Monitor },
    { name: "Blue", value: "blue", icon: Palette },
    { name: "Green", value: "green", icon: Palette },
    { name: "Purple", value: "purple", icon: Palette },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/news" className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Naly
            </span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="hidden md:flex md:space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              {session?.user?.role === 'admin' && adminNavigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Authentication */}
          <div className="flex items-center space-x-2">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                      {session.user.role === 'admin' && (
                        <p className="text-xs text-blue-600 font-medium">ADMIN</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => signIn('google')} variant="outline" size="sm">
                Sign in with Google
              </Button>
            )}
          </div>

          {/* Settings Menu */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon
                  return (
                    <DropdownMenuItem
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as any)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{themeOption.name}</span>
                      </div>
                      {theme === themeOption.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}