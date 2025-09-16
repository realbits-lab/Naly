import { Suspense } from 'react'
import { SignInForm } from '@/components/auth/signin-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-bull">Naly</h1>
          <p className="text-muted-foreground mt-2">AI-Powered Financial Intelligence</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse h-32 bg-secondary rounded-md" />}>
              <SignInForm />
            </Suspense>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" className="font-medium text-bull hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}