"use client";

import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface BlogPostContentProps {
  content: string;
  className?: string;
}

export const BlogPostContent: FC<BlogPostContentProps> = ({ content, className }) => {
  return (
    <Card className="mt-6">
      <CardContent className={cn('prose prose-lg dark:prose-invert p-6', className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
}; 