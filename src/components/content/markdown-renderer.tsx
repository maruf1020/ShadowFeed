import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-4 text-sm leading-7 text-secondary-foreground last:mb-0">{children}</p>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary underline decoration-primary/40 underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-secondary-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-secondary-foreground">{children}</ol>,
        code({ className, children, ...props }: { className?: string; children?: ReactNode }) {
          const match = /language-(\w+)/.exec(className || "");

          if (!match) {
            return (
              <code
                className="rounded-md bg-black/30 px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
                {...props}
              >
                {children}
              </code>
            );
          }

          return (
            <SyntaxHighlighter
              PreTag="div"
              language={match[1]}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: 16,
                background: "rgba(0,0,0,0.35)",
                padding: 16,
              }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
