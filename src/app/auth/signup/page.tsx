"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignUpPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess(false);

		// Validate passwords match
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		// Validate password strength
		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					email,
					password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to create account");
				return;
			}

			setSuccess(true);

			// Auto sign in after successful registration
			setTimeout(async () => {
				const result = await signIn("credentials", {
					email,
					password,
					redirect: false,
				});

				if (result?.ok) {
					router.push("/");
					router.refresh();
				} else {
					router.push("/auth/signin");
				}
			}, 1000);

		} catch (error) {
			setError("An error occurred. Please try again.");
			console.error("Sign up error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
					<CardDescription className="text-center">
						Enter your information to create your Naly account
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{success && (
						<Alert className="mb-4 border-green-200 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800">
								Account created successfully! Signing you in...
							</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSignUp} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								placeholder="John Doe"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={isLoading || success}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="email@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={isLoading || success}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Minimum 8 characters"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading || success}
								minLength={8}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm Password</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder="Re-enter your password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading || success}
							/>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={isLoading || success}
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : success ? (
								<>
									<CheckCircle className="mr-2 h-4 w-4" />
									Account created!
								</>
							) : (
								"Sign up"
							)}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col space-y-2">
					<div className="text-sm text-muted-foreground text-center">
						Already have an account?{" "}
						<a href="/auth/signin" className="text-primary hover:underline">
							Sign in
						</a>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}