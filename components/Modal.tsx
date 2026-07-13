"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-lg",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full ${maxWidthClass} max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white text-lg font-bold p-1 cursor-pointer transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 pr-8">
          {title}
        </h3>

        <div className="mt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}
