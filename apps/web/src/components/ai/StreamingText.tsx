import { useEffect, useState } from 'react';

interface StreamingTextProps {
  content: string;
}

export function StreamingText({ content }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < content.length) {
      const timer = setTimeout(() => {
        setDisplayed(content.slice(0, index + 1));
        setIndex(index + 1);
      }, 8);
      return () => clearTimeout(timer);
    } else {
      setDisplayed(content);
    }
  }, [content, index]);

  useEffect(() => {
    setDisplayed('');
    setIndex(0);
  }, [content]);

  return <span className="text-sm text-fg-primary">{displayed}<span className="animate-pulse">▋</span></span>;
}
