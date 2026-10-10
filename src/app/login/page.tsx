"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Hammer, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--color-main-bg)" }}
    >
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--color-sidebar)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ background: "var(--color-primary)" }}
            >
              <Hammer size={24} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>TripleS ERP</h1>
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Construction Management</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6" style={{ color: "var(--color-text-primary)" }}>
            Build Smarter.<br />
            <span style={{ color: "var(--color-primary)" }}>Manage Better.</span><br />
            Deliver Faster.
          </h2>

          <p className="text-lg max-w-md" style={{ color: "var(--color-text-secondary)" }}>
            The complete construction management platform for tracking projects, 
            managing budgets, coordinating teams, and delivering excellence.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { label: "Projects Managed", value: "500+" },
            { label: "Budget Tracked", value: "₹200 Cr+" },
            { label: "Team Members", value: "1000+" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                {stat.value}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Background decoration */}
        <div
          className="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "var(--color-primary)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "var(--color-primary)" }}
        />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "var(--color-primary)" }}
            >
              <Hammer size={20} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              TripleS ERP
            </h1>
          </div>

          <div className="text-center mb-8">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Welcome back
            </h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                background: "var(--color-error-light)",
                color: "var(--color-error)",
                border: "1px solid var(--color-error)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="form-input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="var(--color-text-muted)" />
                  ) : (
                    <Eye size={16} color="var(--color-text-muted)" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg justify-center"
              style={{ fontWeight: 600, fontSize: "15px" }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p
            className="text-center text-xs mt-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            Construction ERP Demo &middot; For authorized users only
          </p>
        </div>
      </div>
    </div>
  );
}
