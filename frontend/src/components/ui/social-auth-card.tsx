"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FaGoogle, FaGithub, FaLinkedin } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export default function SocialAuthCard({ className }: { className?: string }) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมลหรือชื่อผู้ใช้");
      return;
    }
    if (!password) {
      toast.error("กรุณากรอกรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialClick = (provider: string) => {
    toast(
      `ระบบ ${provider} Login อยู่ระหว่างการเตรียมการ (ต้องตั้งค่า ${provider} OAuth Client ID ใน Backend ก่อน)`,
      { icon: "ℹ️", duration: 4000 }
    );
  };

  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6",
        className
      )}
    >
      {/* Social Login Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={() => handleSocialClick("Google")}
          className="w-full h-10 flex items-center justify-center gap-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition shadow-sm"
        >
          <FaGoogle size={15} /> Continue with Google
        </Button>
        <Button
          type="button"
          onClick={() => handleSocialClick("GitHub")}
          className="w-full h-10 flex items-center justify-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition shadow-sm"
        >
          <FaGithub size={16} /> Continue with GitHub
        </Button>
        <Button
          type="button"
          onClick={() => handleSocialClick("LinkedIn")}
          className="w-full h-10 flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <FaLinkedin size={16} /> Continue with LinkedIn
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 text-gray-400 dark:text-gray-400 text-xs uppercase tracking-wider">
        <span className="flex-1 border-t border-gray-200 dark:border-gray-700"></span>
        <span>or continue with email</span>
        <span className="flex-1 border-t border-gray-200 dark:border-gray-700"></span>
      </div>

      {/* Traditional Login Form */}
      <form onSubmit={handleTraditionalLogin} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email or Username
          </Label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com หรือ username"
            className="mt-1.5 h-10 rounded-xl"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 h-10 rounded-xl"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Don’t have an account?{" "}
        <Link href="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
