import React, { useState, useRef } from 'react';
import { SortOption } from '@/types';
import { SORT_OPTIONS } from '@/utils/sortHelper';
import ViewportPopover from './ViewportPopover';
import {
  ArrowUpDown,
  Check,
  Clock,
  Calendar,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
  variant?: 'board' | 'dashboard';
  className?: string;
  isArranging?: boolean;
}

export default function SortDropdown({
  value,
  onChange,
  variant = 'dashboard',
  className = '',
  isArranging = false,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const currentOption = SORT_OPTIONS.find((o) => o.value === value) || SORT_OPTIONS[0];

  const getOptionIcon = (val: SortOption) => {
    switch (val) {
      case 'updated_desc':
      case 'updated_asc':
        return <Clock size={15} className="text-indigo-500 shrink-0" />;
      case 'created_desc':
      case 'created_asc':
        return <Calendar size={15} className="text-emerald-500 shrink-0" />;
      case 'title_asc':
        return <ArrowDownAZ size={15} className="text-blue-500 shrink-0" />;
      case 'title_desc':
        return <ArrowUpAZ size={15} className="text-amber-500 shrink-0" />;
      default:
        return <ArrowUpDown size={15} className="text-slate-500 shrink-0" />;
    }
  };

  const handleSelect = (optionValue: SortOption) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isArranging}
        className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs transition select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === 'board'
            ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700'
            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700'
        } ${isOpen ? 'ring-2 ring-indigo-500/30 border-indigo-400' : ''}`}
        title={`จัดเรียงโน้ต (ปัจจุบัน: ${currentOption.label} - ${currentOption.subLabel})`}
        aria-label="เมนูจัดเรียงโน้ต"
      >
        {variant === 'board' ? (
          <Sparkles size={14} className={`text-amber-500 shrink-0 ${isArranging ? 'animate-spin' : ''}`} />
        ) : (
          <ArrowUpDown size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
        )}
        <span className="hidden sm:inline">
          {variant === 'board' ? 'จัดเรียงอัตโนมัติ' : 'จัดเรียง:'}
        </span>
        <span className="hidden sm:inline font-semibold text-slate-600 dark:text-slate-300 max-w-[110px] truncate">
          {currentOption.label}
        </span>
        <ChevronDown size={13} className={`hidden sm:inline text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu via ViewportPopover (immune to screen overflow) */}
      <ViewportPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={buttonRef}
        placement="bottom-end"
        offset={6}
        className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-1.5 z-50 animate-fade-in"
      >
        <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {variant === 'board' ? 'เลือกรูปแบบจัดเรียงบนกระดาน' : 'จัดเรียงโน้ตตาม'}
          </span>
          <span className="text-[10px] text-indigo-500 font-semibold">📌 ปักหมุดบนสุด</span>
        </div>

        <div className="py-1 space-y-0.5">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getOptionIcon(opt.value)}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight truncate">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                      {opt.subLabel}
                    </div>
                  </div>
                </div>

                {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </ViewportPopover>
    </div>
  );
}
