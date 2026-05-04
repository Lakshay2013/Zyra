import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { MdxPre } from "@/components/docs/mdx-pre";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="text-3xl md:text-4xl font-black tracking-tight text-white mb-6 scroll-mt-28"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="text-xl md:text-2xl font-bold text-gray-100 mt-12 mb-4 scroll-mt-28 border-b border-white/[0.06] pb-2"
        {...props}
      />
    ),
    h3: (props) => (
      <h3 className="text-lg font-semibold text-gray-200 mt-8 mb-3 scroll-mt-28" {...props} />
    ),
    h4: (props) => (
      <h4 className="text-[15px] font-semibold text-gray-300 mt-6 mb-2 scroll-mt-28" {...props} />
    ),
    p: (props) => (
      <p className="text-[15px] leading-relaxed text-gray-400 mb-4 [&+p]:mt-[-0.25rem]" {...props} />
    ),
    ul: (props) => (
      <ul className="list-disc pl-6 text-[15px] text-gray-400 space-y-2 mb-4 marker:text-brand-accent/80" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal pl-6 text-[15px] text-gray-400 space-y-2 mb-4 marker:text-brand-accent/80" {...props} />
    ),
    li: (props) => <li className="leading-relaxed [&>p]:mb-0" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="border-l-2 border-brand-accent/50 pl-4 my-6 text-gray-400 text-[14px] italic"
        {...props}
      />
    ),
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      if (isExternal) {
        return (
          <a
            href={href}
            className="text-brand-accent hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href ?? "#"} className="text-brand-accent hover:underline underline-offset-2">
          {children}
        </Link>
      );
    },
    table: (props) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-left text-[13px] text-gray-400 font-mono" {...props} />
      </div>
    ),
    th: (props) => (
      <th
        className="bg-brand-surface-high px-4 py-3 font-semibold text-gray-200 border-b border-white/[0.06]"
        {...props}
      />
    ),
    td: (props) => <td className="px-4 py-3 border-b border-white/[0.04]" {...props} />,
    hr: (props) => <hr className="my-10 border-white/[0.06]" {...props} />,
    strong: (props) => <strong className="font-semibold text-gray-200" {...props} />,
    code: ({ className, children, ...props }) => {
      const isBlock = typeof className === "string" && className.includes("language-");
      if (isBlock) {
        return (
          <code className={`${className ?? ""} font-mono text-[13px]`} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded-md bg-brand-surface-high px-1.5 py-0.5 text-[13px] font-mono text-brand-accent/95"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: (props) => <MdxPre {...props} />,
    ...components,
  };
}
