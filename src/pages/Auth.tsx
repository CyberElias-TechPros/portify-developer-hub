import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Za-z]/, "Password must include a letter").regex(/\d/, "Password must include a number");
const loginSchema = z.object({ email: z.string().email("Please enter a valid email address"), password: passwordSchema });
const registerSchema = z.object({ email: z.string().email("Please enter a valid email address"), password: passwordSchema, confirmPassword: z.string() }).refine((data) => data.password === data.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });
type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") return (error as { message: string }).message;
  return "Something went wrong. Please try again.";
}

export default function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const requestedFrom = (location.state as { from?: unknown } | null)?.from;
  const from = typeof requestedFrom === "string" && requestedFrom.startsWith("/") && !requestedFrom.startsWith("//") ? requestedFrom : "/";

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "", confirmPassword: "" } });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    const result = await signIn(data.email, data.password) as { error?: unknown };
    setIsLoading(false);
    if (result.error) {
      toast({ title: "Unable to sign in", description: errorMessage(result.error), variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back", description: "You have successfully signed in." });
    navigate(from, { replace: true });
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    const result = await signUp(data.email, data.password) as { error?: unknown };
    setIsLoading(false);
    if (result.error) {
      toast({ title: "Could not create account", description: errorMessage(result.error), variant: "destructive" });
      return;
    }
    toast({ title: "Account created", description: "Your portfolio workspace is ready." });
    navigate("/profile", { replace: true });
  };

  const handlePasswordReset = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      toast({ title: "Email required", description: "Enter your email address first.", variant: "destructive" });
      return;
    }
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast({ title: "Invalid email", description: "Enter a valid email address first.", variant: "destructive" });
      return;
    }
    setResetting(true);
    const result = await resetPassword(email) as { error?: unknown };
    setResetting(false);
    if (result.error) {
      toast({ title: "Unable to request reset", description: errorMessage(result.error), variant: "destructive" });
      return;
    }
    toast({ title: "Check your inbox", description: "If an account exists for that email, reset instructions are on their way." });
  };

  return (
    <Layout>
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{activeTab === "login" ? "Sign in to Portify" : "Create your workspace"}</CardTitle>
            <CardDescription className="text-center">{activeTab === "login" ? "Manage your portfolio from one secure workspace." : "Publish your work with an edge-backed portfolio."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8"><TabsTrigger value="login">Sign in</TabsTrigger><TabsTrigger value="register">Register</TabsTrigger></TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" className="pl-10" {...field} /></FormControl></div><FormMessage /></FormItem>} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => <FormItem><FormLabel>Password</FormLabel><div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><FormControl><Input type="password" autoComplete="current-password" placeholder="Your password" className="pl-10" {...field} /></FormControl></div><FormMessage /></FormItem>} />
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing in…" : "Sign in"}</Button>
                  </form>
                </Form>
                <Button variant="link" className="px-0 mt-3 text-sm" onClick={() => void handlePasswordReset()} disabled={resetting || isLoading}>{resetting ? "Sending reset link…" : "Forgot your password?"}</Button>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField control={registerForm.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={registerForm.control} name="password" render={({ field }) => <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={registerForm.control} name="confirmPassword" render={({ field }) => <FormItem><FormLabel>Confirm password</FormLabel><FormControl><Input type="password" autoComplete="new-password" placeholder="Repeat your password" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Creating account…" : "Create account"}</Button>
                  </form>
                </Form>
                <p className="text-xs text-muted-foreground mt-4">By registering, you agree to keep your account details accurate and your portfolio content respectful.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
