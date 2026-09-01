import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Za-z]/, "Password must include a letter").regex(/\d/, "Password must include a number");

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast({ title: "Choose a stronger password", description: result.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    if (password !== confirmation) {
      toast({ title: "Passwords do not match", description: "Enter the same password in both fields.", variant: "destructive" });
      return;
    }
    if (!token) {
      setInvalid(true);
      return;
    }
    setSubmitting(true);
    const response = await api.auth.completePasswordReset(token, password);
    setSubmitting(false);
    if (response.error) {
      setInvalid(true);
      toast({ title: "Reset link unavailable", description: response.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    navigate("/auth", { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>{invalid ? "This reset link may be expired. Request a new one from the sign-in page." : "Use at least eight characters, including a letter and a number."}</CardDescription>
          </CardHeader>
          <CardContent>
            {invalid ? (
              <Button className="w-full" onClick={() => navigate("/auth")}>Back to sign in</Button>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                </div>
                <Button className="w-full" type="submit" disabled={submitting}>{submitting ? "Updating…" : "Update password"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
