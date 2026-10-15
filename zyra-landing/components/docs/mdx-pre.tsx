"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useRef } from "react";
import { CopyButton } from "@/components/ui/copy-button";

type PreProps = ComponentPropsWithoutRef<"pre">;

export function MdxPre({ children, className = "", ...props }: PreProps) {
  const ref = useRef<HTMLPreElement>(null);

  return (
    <pre
      ref={ref}
      className={`relative my-6 overflow-x-auto rounded-xl border border-white/[0.06] bg-brand-surface p-5 pt-12 font-mono text-[13px] leading-relaxed [&_code]:bg-transparent [&_code]:p-0 ${className}`}
      {...props}
    >
      <CopyButton text={() => ref.current?.innerText ?? ""} />
      {children}
    </pre>
  );
}
