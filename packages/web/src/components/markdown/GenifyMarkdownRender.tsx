// MIT License
//
// Copyright (c) 2020 Mustafa Turhan
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";
import MermaidWrapper from "@/components/markdown/mermaid/MermaidWrapper";
import PlantUMLRenderer from "@/components/markdown/plantuml/PlantUMLRenderer";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const defaults = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: (props: any) => {
    const { children } = props;
    return <p className="markdown-paragraph">{children}</p>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  em: (props: any) => {
    const { children } = props;
    return <em>{children}</em>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: (props: any) => {
    const { children } = props;
    return (
      <blockquote className="markdown-blockquote">{children}</blockquote>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  del: (props: any) => {
    const { children } = props;
    return <del>{children}</del>;
  },
  hr: () => <hr className="markdown-hr" />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: (props: any) => <a className="markdown-link" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  img: (props: any) => {
    const { src, className, ...rest } = props;
    return (
      <Image 
        src={src} 
        className={`markdown-image ${className || ""}`} 
        alt={props.alt || "Markdown内容图片"}
        width={500}
        height={300}
        style={{ width: 'auto', height: 'auto' }}
        {...rest}
      />
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: (props: any) => {
    const { children } = props;
    return <span>{children}</span>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ul: (props: any) => {
    const { children, depth } = props;
    let listClass = "markdown-list";
    if (depth === 1) listClass += " markdown-list-nested";
    return (
      <ul className={listClass} {...props}>
        {children}
      </ul>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ol: (props: any) => {
    const { children, depth } = props;
    let listClass = "markdown-list markdown-list-ordered";
    if (depth === 1) listClass += " markdown-list-nested";
    return (
      <ol className={listClass} {...props}>
        {children}
      </ol>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  li: (props: any) => {
    const { children, checked } = props;
    let itemClass = "markdown-list-item";

    if (checked !== null) {
      // 对于任务列表项，添加特定的类，但不使用自定义span元素
      itemClass += checked ? " markdown-task-checked" : " markdown-task-unchecked";
    }

    return (
      <li className={itemClass}>
        {children}
      </li>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heading: (props: any) => {
    const { children } = props;
    const level = parseInt(props.node.tagName.replace("h", ""), 10);
    const HeadingTag = `h${level}`;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return <HeadingTag className={`markdown-heading markdown-heading-${level}`}>
      {children}
    </HeadingTag>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pre: (props: any) => {
    const { children } = props;
    return <pre className="markdown-pre">{children}</pre>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: (props: any) => <table className="markdown-table" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thead: (props: any) => <thead className="markdown-thead" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tbody: (props: any) => <tbody className="markdown-tbody" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tr: (props: any) => <tr className="markdown-tr" {...props} />,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  td: (props: any) => {
    const { children } = props;
    const renderedChildren = React.Children.map(children, child => {
      if (typeof child === "string") {
        return child.split("<br>").map((text, index) => (
          <React.Fragment key={index}>
            {text}
            {index < child.split("<br>").length - 1 && <br />}
          </React.Fragment>
        ));
      }
      return child;
    });

    return <td className="markdown-td">{renderedChildren}</td>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  th: (props: any) => <th className="markdown-th" {...props} />,
};

export default function GenifyMarkdownRender({ content, isShowCopyButton: isShowCopyButton = false }: {
  content: string,
  isShowCopyButton?: boolean
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getHighlighter(match: RegExpExecArray, props: any, children: any) {
    const language = match[1];

    if (language == "mermaid") {
      return <MermaidWrapper graphDefinition={children} />;
    }

    if (language == "plantuml" || language == "puml" || language == "uml") {
      return <PlantUMLRenderer value={children} />;
    }

    return (
      <SyntaxHighlighter language={language} wrapLongLines={true} {...props}>
        {children}
      </SyntaxHighlighter>
    );
  }

  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast({
        title: "已复制",
        description: "内容已复制到剪贴板",
      });

      // Reset copy icon after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error("复制文本失败: ", err);
      toast({
        title: "复制失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {isShowCopyButton && (
        <Button
          variant="ghost"
          size="icon"
          className="markdown-copy-button"
          onClick={copyToClipboard}
        >
          {isCopied ? (
            <Check className="markdown-icon" />
          ) : (
            <Copy className="markdown-icon" />
          )}
        </Button>
      )}
      <ReactMarkdown
        unwrapDisallowed={true}
        remarkPlugins={[remarkGfm]}
        components={{
          p: defaults.p,
          em: defaults.em,
          blockquote: defaults.blockquote,
          del: defaults.del,
          hr: defaults.hr,
          a: defaults.a,
          img: defaults.img,
          text: defaults.text,
          ul: defaults.ul,
          ol: defaults.ol,
          li: defaults.li,
          h1: defaults.heading,
          h2: defaults.heading,
          h3: defaults.heading,
          h4: defaults.heading,
          h5: defaults.heading,
          h6: defaults.heading,
          table: defaults.table,
          thead: defaults.thead,
          tbody: defaults.tbody,
          tr: defaults.tr,
          td: defaults.td,
          th: defaults.th,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code(props: any) {
            const { inline, className, children } = props;
            const match = /language-(\w+)/.exec(className || "");
            // we had replace \n to \n\n for markdown to works, but it will cause a bug in syntax highlighter, so we need to return it back.
            const code = String(children)?.replace(/\n$/, "");

            return !inline && match ? (getHighlighter(match, props, code)) : (
              <code className={className + " " + "plaintext"} {...props}>
                {code}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </>
  );
}

