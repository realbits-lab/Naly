'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Icons } from '@/components/ui/icons'
import { Loader2 } from 'lucide-react'

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams?.get('error')

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      setError(null)

      const result = await signIn('google', {
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError('Failed to sign in with Google. Please try again.')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        switch (result.error) {
          case 'CredentialsSignin':
            setError('Invalid email or password. Please try again.')
            break
          case 'CallbackRouteError':
            setError('Authentication service error. Please try again.')
            break
          default:
            setError('Failed to sign in. Please try again.')
        }
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (err) {
      console.error('Email sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Display URL parameter error if present
  const displayError = error || (errorParam && getErrorMessage(errorParam))

  return (
    <div className="space-y-6">
      {displayError && (
        <Alert variant="destructive">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {/* Google Sign In */}
      <Button
        variant="outline"
        type="button"
        disabled={isGoogleLoading || isLoading}
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      {/* Email Sign In Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            disabled={isLoading || isGoogleLoading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading || isGoogleLoading}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in with Email'
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <a
          href="/auth/forgot-password"
          className="text-muted-foreground hover:text-primary underline underline-offset-4"
        >
          Forgot your password?
        </a>
      </div>
    </div>
  )
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'OAuthSignin':
      return 'Error occurred during OAuth sign in.'
    case 'OAuthCallback':
      return 'Error occurred in OAuth callback.'
    case 'OAuthCreateAccount':
      return 'Could not create OAuth account.'
    case 'EmailCreateAccount':
      return 'Could not create email account.'
    case 'Callback':
      return 'Error occurred in callback.'
    case 'OAuthAccountNotLinked':
      return 'Email already exists with different provider.'
    case 'EmailSignin':
      return 'Error occurred during email sign in.'
    case 'CredentialsSignin':
      return 'Invalid credentials provided.'
    case 'SessionRequired':
      return 'Please sign in to access this page.'
    case 'AccessDenied':
      return 'Access denied. Please contact support.'
    default:
      return 'An error occurred during authentication.'
  }
}