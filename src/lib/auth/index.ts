// Authentication Module Exports

export { auth, signIn, signOut } from './config'

// Re-export types from user types
export type { UserRole, AudienceType, InvestmentExperience } from '@/types/user'

// Authentication utilities
export const getServerSession = async () => {
  const { auth } = await import('./config')
  return await auth()
}

export const requireAuth = async () => {
  const session = await getServerSession()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  return session
}

export const requireRole = async (allowedRoles: string[]) => {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Insufficient permissions')
  }

  return session
}

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getServerSession()
  return !!session?.user
}

export const getUserId = async (): Promise<string | null> => {
  const session = await getServerSession()
  return session?.user?.id || null
}

export const getUserRole = async (): Promise<string | null> => {
  const session = await getServerSession()
  return session?.user?.role || null
}

// Client-side authentication hooks
export const createAuthHooks = () => {
  return {
    useSession: () => {
      // This would be implemented with React context or state management
      // For now, return a placeholder
      return {
        data: null,
        status: 'loading' as const,
        update: async () => {}
      }
    },

    useUser: () => {
      // This would return the current user from session
      return {
        user: null,
        isLoading: true,
        error: null
      }
    }
  }
}

// Authentication error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  PROVIDER_ERROR: 'PROVIDER_ERROR'
} as const

// Constants
export const AUTH_CONSTANTS = {
  SESSION_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  COOKIE_NAME: 'naly-session',
  REDIRECT_COOKIE: 'naly-redirect',
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_RESET_EXPIRY: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
} as const

// Route protection helpers
export const protectedPaths = [
  '/dashboard',
  '/portfolio',
  '/narratives/personal',
  '/settings',
  '/api/user',
  '/api/portfolios',
  '/api/recommendations'
]

export const adminPaths = [
  '/admin',
  '/api/admin'
]

export const institutionalPaths = [
  '/institutional',
  '/api/institutional'
]

export const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/about',
  '/contact',
  '/privacy',
  '/terms'
]

export const isProtectedPath = (pathname: string): boolean => {
  return protectedPaths.some(path => pathname.startsWith(path))
}

export const isAdminPath = (pathname: string): boolean => {
  return adminPaths.some(path => pathname.startsWith(path))
}

export const isInstitutionalPath = (pathname: string): boolean => {
  return institutionalPaths.some(path => pathname.startsWith(path))
}

export const isPublicPath = (pathname: string): boolean => {
  return publicPaths.includes(pathname) ||
         pathname.startsWith('/api/auth/') ||
         pathname.startsWith('/narratives/') && !pathname.startsWith('/narratives/personal') ||
         pathname.startsWith('/visualizations/') ||
         pathname.startsWith('/market/')
}

// Session management utilities
export const createSessionMetadata = (userAgent?: string, ip?: string) => ({
  userAgent: userAgent || 'Unknown',
  ip: ip || 'Unknown',
  createdAt: new Date(),
  lastActivity: new Date()
})

export const validateSessionAge = (sessionStart: Date, maxAge: number): boolean => {
  const now = Date.now()
  const sessionAge = now - sessionStart.getTime()
  return sessionAge <= maxAge
}

export const shouldRefreshSession = (lastActivity: Date, refreshThreshold: number): boolean => {
  const now = Date.now()
  const timeSinceActivity = now - lastActivity.getTime()
  return timeSinceActivity >= refreshThreshold
}

// Password validation utilities
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`)
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// OAuth provider configurations
export const getOAuthConfig = (provider: string) => {
  switch (provider) {
    case 'google':
      return {
        name: 'Google',
        icon: 'google',
        scopes: ['openid', 'email', 'profile'],
        buttonText: 'Continue with Google'
      }
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`)
  }
}

// Error message helpers
export const getAuthErrorMessage = (error: string): string => {
  switch (error) {
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.'
    case AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND:
      return 'No account found with this email address.'
    case AUTH_ERROR_CODES.ACCOUNT_DISABLED:
      return 'Your account has been disabled. Please contact support.'
    case AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED:
      return 'Please verify your email address before signing in.'
    case AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS:
      return 'Too many login attempts. Please try again later.'
    case AUTH_ERROR_CODES.SESSION_EXPIRED:
      return 'Your session has expired. Please sign in again.'
    case AUTH_ERROR_CODES.INVALID_TOKEN:
      return 'Invalid or expired token. Please request a new one.'
    case AUTH_ERROR_CODES.PROVIDER_ERROR:
      return 'Authentication provider error. Please try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}