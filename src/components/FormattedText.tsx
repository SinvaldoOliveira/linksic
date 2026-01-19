import React from 'react';
import { cn } from '@/lib/utils';

interface FormattedTextProps {
    text?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className, style }) => {
    if (!text) return null;

    // Simple parser function
    const parseText = (inputText: string) => {
        // Split by newlines first to handle lists or paragraphs
        const lines = inputText.split('\n');

        return lines.map((line, lineIndex) => {
            // Handle list items
            if (line.trim().startsWith('- ')) {
                const content = line.trim().substring(2);
                return (
                    <div key={lineIndex} className="flex items-start gap-2 ml-2">
                        <span className="mt-2 w-1 h-1 rounded-full bg-current opacity-70 flex-shrink-0" />
                        <span>{parseInline(content)}</span>
                    </div>
                );
            }

            // Regular line
            return (
                <div key={lineIndex} className={lineIndex > 0 ? "mt-1" : ""}>
                    {parseInline(line) || <br />}
                </div>
            );
        });
    };

    // Helper to parse inline formatting (bold, italic)
    const parseInline = (text: string): React.ReactNode => {
        // We'll use a regex to split by markers: **bold**, *italic*
        // Note: This is a very basic parser and might not handle nested complex cases perfectly
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                return <em key={index} className="italic">{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };

    return (
        <div className={cn("whitespace-pre-wrap break-words", className)} style={style}>
            {parseText(text)}
        </div>
    );
};
