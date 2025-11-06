"use client";

import React, { useState, useCallback } from 'react';
import LoginForm from './login-form';
import RegisterForm from './register-form';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const switchToRegister = useCallback(() => setIsLogin(false), []);
  const switchToLogin = useCallback(() => setIsLogin(true), []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm key="login" onSwitchToRegister={switchToRegister} />
        ) : (
          <RegisterForm key="register" onSwitchToLogin={switchToLogin} />
        )}
      </div>
    </div>
  );
}
