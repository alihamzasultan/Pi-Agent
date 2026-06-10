import React, { useState } from "react";
import { Sparkles, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import usersData from "../data/users.json";

interface User {
  username: string;
  email: string;
  password: string;
}

const USERS: User[] = usersData as User[];

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your username / email and password.");
      triggerShake();
      return;
    }

    setIsLoading(true);
    setError(null);

    // Small artificial delay so the spinner is visible
    await new Promise((r) => setTimeout(r, 400));

    try {
      const matched = USERS.find(
        (u) =>
          (u.username.toLowerCase() === identifier.trim().toLowerCase() ||
            u.email.toLowerCase() === identifier.trim().toLowerCase()) &&
          u.password === password
      );

      if (matched) {
        onLogin(matched.username);
      } else {
        setError("Invalid username / email or password.");
        triggerShake();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />

      <div className={`login-card ${shake ? "login-shake" : ""}`}>
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Sparkles size={28} />
          </div>
          <div>
            <h1 className="login-title">Personal Injury Law</h1>
            <span className="login-subtitle">PI Intake AI Suite</span>
          </div>
        </div>

        <div className="login-divider" />

        <h2 className="login-heading">Welcome back</h2>
        <p className="login-desc">Sign in to access your dashboard</p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Username / Email */}
          <div className="login-field">
            <label htmlFor="login-identifier" className="login-label">
              Username or Email
            </label>
            <input
              id="login-identifier"
              type="text"
              className="login-input"
              placeholder="Enter username or email"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              autoComplete="username"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="login-password" className="login-label">
              Password
            </label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="login-input login-input-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-spinner" />
            ) : (
              <LogIn size={16} />
            )}
            <span>{isLoading ? "Signing in…" : "Sign In"}</span>
          </button>
        </form>

        <p className="login-footer-text">
          Personal Injury Law &mdash; Secure Access Portal
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
