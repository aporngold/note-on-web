import React from "react";
import Head from "next/head";
import Link from "next/link";
import SocialAuthCard from "@/components/ui/social-auth-card";
import { ArrowLeft } from "lucide-react";

export default function TestAuthPage() {
  return (
    <>
      <Head>
        <title>Social Auth Card - Test Page | SecureNote</title>
      </Head>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200">
        <div className="w-full max-w-md mb-4 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <ArrowLeft size={14} /> กลับหน้า Login หลัก
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
            Test Preview
          </span>
        </div>

        {/* Target Component */}
        <SocialAuthCard />
      </div>
    </>
  );
}
