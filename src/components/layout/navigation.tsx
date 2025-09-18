"use client";

import {
  BarChart3,
  Check,
  ChevronDown,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Newspaper,
  Palette,
  PenTool,
  Settings,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/theme-provider";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { toast } from "sonner";
import { useScreenSize } from "@/hooks/use-screen-size";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

// Navigation items will be updated with locale prefix in the component
const navigationItems = [
  {
    name: "News",
    href: "news", // Remove leading slash to be prefixed with locale
    icon: Newspaper,
  },
  {
    name: "Monitor",
    href: "monitor", // Remove leading slash to be prefixed with locale
    icon: Monitor,
  },
];

const adminNavigationItems = [
  {
    name: "Write",
    href: "write", // Remove leading slash to be prefixed with locale
    icon: PenTool,
  },
  {
    name: "Settings",
    href: "settings", // Remove leading slash to be prefixed with locale
    icon: Settings,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isPending, startTransition] = useTransition();
  const screenSize = useScreenSize();
  const { isMobile, desktopClasses, mobileClasses } = useResponsiveLayout();

  // Get current locale from pathname
  const getCurrentLocale = (): Locale => {
    const localeInPath = locales.find((locale) =>
      pathname.startsWith(`/${locale}`)
    );
    return localeInPath || "en";
  };

  const currentLocale = getCurrentLocale();

  // Helper function to build localized path
  const getLocalizedPath = (path: string) => {
    return `/${currentLocale}/${path}`;
  };

  // Check if user is manager
  const isManager = session?.user && session.user.role === "manager";

  const switchLanguage = (newLocale: Locale) => {
    startTransition(() => {
      // Store preference in localStorage
      localStorage.setItem("user-locale", newLocale);

      // Store preference in cookie for server-side access
      document.cookie = `user-locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // Update URL with new locale
      let newPathname = pathname;

      // Remove current locale from pathname if it exists
      const currentLocaleInPath = locales.find((locale) =>
        pathname.startsWith(`/${locale}`)
      );
      if (currentLocaleInPath) {
        newPathname = pathname.slice(`/${currentLocaleInPath}`.length) || "/";
      }

      // Add new locale prefix if it's not the default locale
      if (newLocale !== "en") {
        newPathname = `/${newLocale}${newPathname}`;
      }

      // Navigate to new URL
      router.push(newPathname);
      router.refresh();

      // Show success message
      toast.success("Language changed successfully!");
    });
  };


  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 flex">
          <Link href={getLocalizedPath("news")} className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">Naly</span>
          </Link>
        </div>

        {/* Screen Size Display for Manager */}
        {isManager && screenSize.width > 0 && (
          <div className="mr-4 hidden md:flex items-center space-x-2 text-xs text-muted-foreground border border-border rounded px-2 py-1">
            <Monitor className="h-3 w-3" />
            <span>
              {screenSize.width} × {screenSize.height}
            </span>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Mobile Icon-Only Navigation */}
            <div className={cn("space-x-4", mobileClasses)}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const localizedHref = getLocalizedPath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={localizedHref}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-muted",
                      pathname === localizedHref
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground"
                    )}
                    title={item.name}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
              {(session?.user?.role === "manager" || session?.user?.role === "writer") &&
                adminNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const localizedHref = getLocalizedPath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={localizedHref}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md transition-colors hover:bg-muted",
                        pathname === localizedHref
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground"
                      )}
                      title={item.name}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  );
                })}
            </div>

            {/* Desktop Navigation with Text */}
            <div className={cn("space-x-6", desktopClasses)}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const localizedHref = getLocalizedPath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={localizedHref}
                    className={cn(
                      "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === localizedHref
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              {(session?.user?.role === "manager" || session?.user?.role === "writer") &&
                adminNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const localizedHref = getLocalizedPath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={localizedHref}
                      className={cn(
                        "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                        pathname === localizedHref
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          </div>


          {/* Language Switcher */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 text-sm font-medium"
                  disabled={isPending}
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden md:inline">Language</span>
                  <ChevronDown className="h-3 w-3 hidden md:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white border border-gray-200 shadow-lg"
              >
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Select Language
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {locales.map((locale) => (
                  <DropdownMenuItem
                    key={locale}
                    onClick={() => switchLanguage(locale)}
                    className="flex items-center justify-between cursor-pointer"
                    disabled={isPending}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {localeLabels[locale].nativeName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {localeLabels[locale].name}
                      </span>
                    </div>
                    {currentLocale === locale && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Authentication - Profile Icon at the rightmost position */}
          <div className="flex items-center space-x-2">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white border border-gray-200 shadow-lg"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.email}
                      </p>
                      {session.user.role === "manager" && (
                        <p className="text-xs text-blue-600 font-medium">
                          MANAGER
                        </p>
                      )}
                      {session.user.role === "writer" && (
                        <p className="text-xs text-green-600 font-medium">
                          WRITER
                        </p>
                      )}
                      {session.user.role === "reader" && (
                        <p className="text-xs text-gray-600 font-medium">
                          READER
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => signIn("google")}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Sign in with Google</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
