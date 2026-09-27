"use client";

import React, { useState, useId } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
}

/**
 * Reusable, theme-aware, cross-browser AuthInput component.
 * Ensures input text, placeholder, and autofill are fully readable in Chrome, Edge, Safari, Firefox, and mobile.
 */
export function AuthInput({
  id: providedId,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  icon,
  error,
  showPasswordToggle = true,
  className = "",
  autoComplete,
  ...rest
}: AuthInputProps) {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`auth-input-group ${className}`}>
      <label htmlFor={inputId} className="auth-input-label">
        {label}
        {required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
      </label>

      <div className="auth-input-wrapper">
        {icon && <span className="auth-input-icon">{icon}</span>}

        <input
          id={inputId}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`auth-input-element ${icon ? "has-icon" : ""} ${isPassword && showPasswordToggle ? "has-toggle" : ""} ${error ? "is-invalid" : ""}`}
          {...rest}
        />

        {isPassword && showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="auth-input-toggle"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {error && (
        <div id={`${inputId}-error`} className="auth-input-error" role="alert">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default AuthInput;
