"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { InlineNote } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_ACCOUNTS } from "@/services/demoService";
import { userRepository } from "@/repositories";
import { validateEmail, validatePassword, hasErrors, type FieldErrors } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login, loginAs } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectForRole = (role: string) => {
    router.push(role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/dashboard");
    router.refresh();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors: FieldErrors = {};
    validateEmail(email, nextErrors);
    validatePassword(password, nextErrors);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    const result = login(email, password);
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast.success("Welcome back", `You are logged in as ${result.data.name}.`);
    redirectForRole(result.data.role);
  };

  const quickDemo = (demoEmail: string) => {
    const demoUser = userRepository.findOne((user) => user.email === demoEmail);
    if (!demoUser) return;
    const result = loginAs(demoUser.id);
    if (result.ok) {
      toast.success("Demo session started", `You are now acting as ${result.data.name}.`);
      redirectForRole(result.data.role);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-line bg-white p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink">Log in to HadaLink</h1>
            <p className="mt-1.5 text-sm text-muted">
              Access your bookings, listings, and marketplace tools.
            </p>

            <div className="mt-4">
              <InlineNote tone="info">
                This is a prototype with simulated authentication. Use a demo account below or
                create your own local account.
              </InlineNote>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Quick demo login
              </p>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => quickDemo(account.email)}
                  className="flex w-full items-center gap-3 rounded-md border border-line px-3.5 py-3 text-left hover:border-primary hover:bg-primary-soft"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon
                      name={account.role === "FARMER" ? "user" : account.role === "PROVIDER" ? "tractor" : "shield"}
                      size={18}
                    />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-ink">{account.label}</span>
                    <span className="block text-xs text-muted">{account.description}</span>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              ))}
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs text-muted">or log in with email</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-4">
              {formError ? (
                <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                  {formError}
                </p>
              ) : null}
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                error={errors.email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.ng"
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                error={errors.password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />
              <Button type="submit" fullWidth size="lg" disabled={busy}>
                {busy ? "Logging in..." : "Log in"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted">
              New to HadaLink?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Demo credentials: farmer@hadalink.ng, provider@hadalink.ng, admin@hadalink.ng
            (password: demo1234)
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
