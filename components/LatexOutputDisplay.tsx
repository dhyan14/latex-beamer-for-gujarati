
import React, { useState, useEffect, useRef } from 'react';

interface LatexCodeViewProps {
  latexCode: string;
}

const LatexCodeView: React.FC<LatexCodeViewProps> = ({ latexCode }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const codeContainerRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(latexCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy LaTeX code: ', err);
      alert('Failed to copy code. Please try manually.');
    }
  };

  useEffect(() => {
    // Optional: Scroll to bottom when code updates, if desired.
    // For now, let user control scroll.
    // if (codeContainerRef.current) {
    //   codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    // }
  }, [latexCode]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-semibold text-slate-700">LaTeX Code</h2>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
            ${copied 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
            }`}
          aria-label={copied ? "LaTeX code copied to clipboard" : "Copy LaTeX code to clipboard"}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre 
        ref={codeContainerRef}
        className="bg-slate-900 text-slate-100 p-4 flex-grow overflow-auto text-sm font-mono"
        aria-live="assertive"
        aria-atomic="true"
        role="log"
        tabIndex={0}
      >
        <code>{latexCode}</code>
      </pre>
    </div>
  );
};

export default LatexCodeView;
