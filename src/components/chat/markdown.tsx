"use client";

// Singurul loc care randează markdown din chat.
// Conținutul modelului e necontrolat: fără rehype-raw și fără dangerouslySetInnerHTML
// (un <img onerror=…> din răspuns ar deveni XSS).
import type { Root, Element, ElementContent, Text } from "hast";
import type { Components } from "react-markdown";
import { Component, createElement, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createLowlight } from "lowlight";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { splitBySearchHighlight, tryCompileSearchRegex } from "@/lib/conversation-search";
import { isClipboardAvailable } from "@/lib/message-utils";
import { cn } from "@/lib/utils";

// Temă din librărie — nu CSS scris de mână; tokenii hljs-* vin de aici.
import "highlight.js/styles/github-dark.css";

/**
 * Doar limbajele folosite în chat.
 * Evităm rehype-highlight: importă static `common` din lowlight și umflă bundle-ul
 * chiar dacă îi treci o listă restrânsă la runtime.
 */
const lowlight = createLowlight({
  bash,
  javascript,
  json,
  python,
  sql,
  typescript
});

lowlight.registerAlias({
  typescript: ["ts", "tsx"],
  javascript: ["js", "jsx"],
  bash: ["shell", "sh"],
  python: ["py"]
});

const remarkPlugins = [remarkGfm];

function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    const element = node as { props?: { children?: ReactNode } };
    return getNodeText(element.props?.children);
  }
  return "";
}

function getCodeLanguage(node: ReactNode): string | null {
  if (!node || typeof node !== "object" || !("props" in node)) return null;
  const element = node as { props?: { className?: string | string[] } };
  const className = element.props?.className;
  const joined = Array.isArray(className) ? className.join(" ") : (className ?? "");
  const match = /language-([A-Za-z0-9_+-]+)/.exec(joined);
  return match?.[1] ?? null;
}

/** hast → React (fără innerHTML): highlight pe text, nu pe HTML venit de la model. */
function hastChildToReact(node: ElementContent, key: number): ReactNode {
  if (node.type === "text") {
    return (node as Text).value;
  }
  if (node.type === "element") {
    const el = node as Element;
    const className = Array.isArray(el.properties?.className)
      ? el.properties.className.join(" ")
      : (el.properties?.className as string | undefined);
    return createElement(
      el.tagName,
      { key, className },
      el.children.map((child, index) => hastChildToReact(child, index))
    );
  }
  return null;
}

function highlightToReact(code: string, language: string | null): ReactNode {
  if (!language || !lowlight.registered(language)) {
    return code;
  }
  try {
    // Markdown-ul din stream poate fi pe jumătate — highlight nu trebuie să dărâme UI-ul.
    const tree: Root = lowlight.highlight(language, code);
    return tree.children
      .filter((child): child is ElementContent => child.type === "text" || child.type === "element")
      .map((child, index) => hastChildToReact(child, index));
  } catch {
    return code;
  }
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    setCanCopy(isClipboardAvailable());
  }, []);

  const codeText = getNodeText(children).replace(/\n$/, "");
  const language = getCodeLanguage(children);
  const highlighted = highlightToReact(codeText, language);

  const handleCopy = async () => {
    if (!canCopy) {
      toast.error("Copierea nu e disponibilă în acest context (necesită HTTPS sau localhost)");
      return;
    }
    try {
      await navigator.clipboard.writeText(codeText);
      toast.success("Cod copiat în clipboard");
    } catch {
      toast.error("Nu am putut copia codul");
    }
  };

  return (
    <div className="group/code relative my-3">
      <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-sm text-zinc-100">
        <code className={cn("hljs", language && `language-${language}`)}>{highlighted}</code>
      </pre>
      {canCopy && codeText && (
        <Tooltip>
          <TooltipTrigger
            className="absolute top-2 right-2 rounded-md bg-zinc-800/90 p-1.5 text-zinc-200 opacity-0 transition-opacity group-hover/code:opacity-100 hover:bg-zinc-700"
            onClick={handleCopy}
            type="button"
          >
            <Copy className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Copiază codul</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

const markdownComponents: Components = {
  // Link-uri externe: blank + noopener ca pagina țintă să nu poată naviga înapoi spre noi (tabnabbing).
  a: ({ href, children, ...props }) => (
    <a {...props} href={href} rel="noopener noreferrer" target="_blank">
      {children}
    </a>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  // Mark din rehypeSearchHighlight — nu din HTML-ul modelului (fără rehype-raw).
  mark: ({ children }) => (
    <mark className="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-500/40">{children}</mark>
  )
};

/** Nu întrerupem tokenizarea din code / link-uri — highlight doar pe textul vizibil. */
function isSearchHighlightSkipped(tagName: string): boolean {
  return tagName === "code" || tagName === "pre" || tagName === "a";
}

function highlightHastChildren(children: ElementContent[], query: string): ElementContent[] {
  if (!tryCompileSearchRegex(query)) return children;

  return children.flatMap((node): ElementContent[] => {
    if (node.type === "text") {
      return splitBySearchHighlight((node as Text).value, query).map((segment): ElementContent => {
        if (!segment.match) {
          return { type: "text", value: segment.text };
        }
        return {
          type: "element",
          tagName: "mark",
          properties: {},
          children: [{ type: "text", value: segment.text }]
        };
      });
    }

    if (node.type === "element") {
      const el = node as Element;
      if (isSearchHighlightSkipped(el.tagName)) {
        return [el];
      }
      return [
        {
          ...el,
          children: highlightHastChildren(el.children, query)
        }
      ];
    }

    return [node];
  });
}

/** rehype: înfășoară potrivirile Search for în <mark> (generat de noi, nu din răspunsul modelului). */
function createSearchHighlightRehype(query: string) {
  return () => (tree: Root) => {
    tree.children = highlightHastChildren(tree.children as ElementContent[], query) as Root["children"];
  };
}

/** În streaming markdown-ul e incomplet; dacă parserul aruncă, arătăm textul brut — UI-ul nu cade. */
class MarkdownErrorBoundary extends Component<{ content: string; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Markdown render failed during stream:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: { content: string }) {
    // Conținut nou după eroare: reîncercăm — stream-ul poate deveni valid la tokenul următor.
    if (this.state.hasError && prevProps.content !== this.props.content) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <p className="whitespace-pre-wrap">{this.props.content}</p>;
    }
    return this.props.children;
  }
}

interface MarkdownProps {
  content: string;
  className?: string;
  /** Query settled din Search for — goale = fără highlight. */
  highlightQuery?: string;
}

export function Markdown({ content, className, highlightQuery = "" }: MarkdownProps) {
  const rehypePlugins = useMemo(() => {
    const trimmed = highlightQuery.trim();
    if (!trimmed || !tryCompileSearchRegex(trimmed)) return undefined;
    return [createSearchHighlightRehype(trimmed)];
  }, [highlightQuery]);

  return (
    <MarkdownErrorBoundary content={content}>
      <div
        className={cn(
          "prose prose-sm max-w-none dark:prose-invert",
          "prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0",
          "prose-code:before:content-none prose-code:after:content-none",
          className
        )}
      >
        <ReactMarkdown
          components={markdownComponents}
          // Fără rehype-raw / fără rehypePlugins care injectează HTML din răspuns.
          // rehypeSearchHighlight doar înfășoară text existent în <mark> generat local.
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
        >
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
