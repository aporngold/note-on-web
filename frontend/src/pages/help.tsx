import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, ShieldCheck } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import HelpModal from '@/components/modals/HelpModal';

export default function HelpPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <Layout showSearch={false}>
      <Head>
        <title>วิธีใช้งานและคำแนะนำ (Help & Guide) — NoteAll</title>
      </Head>

      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Breadcrumb Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft size={16} />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>คู่มือการใช้งานระบบ Note on Web</span>
          </span>
        </div>

        {/* Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-slate-800 shadow-md mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
              <BookOpen size={24} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              วิธีใช้งานและคำแนะนำ (Help & Guide)
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            ศูนย์รวมคำแนะนำและแนวทางแก้ไขจุดที่ผู้ใช้งานใหม่มักจะสงสัย ทั้งกฎกระดาน 56 แผ่น, การเลือก 4 มุมมอง, ระบบห้องนิรภัยความปลอดภัยสูง Zero-Knowledge, และการสำรองข้อมูล
          </p>
          <div className="mt-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95"
            >
              เปิดหน้าต่างค้นหาคำแนะนำ
            </button>
          </div>
        </div>
      </div>

      <HelpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Layout>
  );
}
