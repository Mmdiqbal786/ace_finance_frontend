"use client";

import type { ReactNode } from "react";

/** Full-bleed auth artwork — no side/top/bottom empty space. Form on the white right side. */
export default function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="portal-page login-page relative min-h-0 w-full flex-1 overflow-hidden bg-[#eaf4fd]">
      {/* Edge-to-edge image: fills every pixel between header and footer */}
      <img
        src="/open/login.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-left lg:block"
      />

      {/* Form over the white right side of the image */}
      <div className="relative z-10 flex h-full min-h-[calc(100dvh-7.5rem)] w-full items-center justify-center px-4 py-8 sm:px-8 lg:ml-[50%] lg:w-1/2 lg:justify-center lg:px-12 xl:px-16">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
