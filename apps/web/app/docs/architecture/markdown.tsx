import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-4 text-2xl font-semibold tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-8 mb-3 border-b pb-2 text-lg font-semibold tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => <h3 className="mt-6 mb-2 text-base font-semibold">{children}</h3>,
        p: ({ children }) => <p className="my-3 text-sm leading-relaxed">{children}</p>,
        ul: ({ children }) => (
          <ul className="my-3 list-disc space-y-1.5 pl-6 text-sm leading-relaxed">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-3 list-decimal space-y-1.5 pl-6 text-sm leading-relaxed">{children}</ol>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline underline-offset-2">
            {children}
          </a>
        ),
        em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
        code: ({ className, children }) =>
          className ? (
            <code className={`${className} font-mono text-xs`}>{children}</code>
          ) : (
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{children}</code>
          ),
        pre: ({ children }) => (
          <pre className="bg-muted my-4 overflow-x-auto rounded-lg p-4 text-xs leading-relaxed">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-muted-foreground border-b px-3 py-2 text-left text-xs font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b px-3 py-2 align-top text-sm leading-relaxed">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-primary/30 text-muted-foreground my-4 border-l-2 pl-4">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-6" />,
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
