"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Check
} from "lucide-react";

interface PasswordInputProps {
  onPasswordSubmit: (password: string) => void;
  onCancel: () => void;
  isVisible: boolean;
  className?: string;
}

export default function PasswordInput({
  onPasswordSubmit,
  onCancel,
  isVisible,
  className = "",
}: PasswordInputProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsSubmitting(true);
    try {
      await onPasswordSubmit(password.trim());
      setPassword("");
    } catch (error) {
      console.error("Password submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  if (!isVisible) return null;

  return (
    <Card className={`bg-background border border-orange-500/50 ${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Lock size={20} className="text-orange-500" />
          <div>
            <h3 className="font-medium text-sm">Password Required</h3>
            <p className="text-xs text-muted-foreground">
              This PDF is password-protected. Please enter the password to continue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">PDF Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter PDF password"
                className="pr-10"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={14} className="mr-2" />
                  Submit Password
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <AlertCircle size={12} />
          <span>Password will be used only for this PDF processing</span>
        </div>
      </CardContent>
    </Card>
  );
}
