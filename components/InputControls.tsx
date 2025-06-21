
import React from 'react';

interface PromptControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onUpdate: () => void;
  isLoading: boolean;
}

const PromptControls: React.FC<PromptControlsProps> = ({ prompt, setPrompt, onUpdate, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && prompt.trim()) {
        onUpdate();
      }
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
      <label htmlFor="userPrompt" className="block text-lg font-semibold text-slate-700 mb-3">
        Describe your changes or additions
      </label>
      <textarea
        id="userPrompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., Add an introduction section about AI ethics.&#10;Create a new frame with a bullet list: item 1, item 2.&#10;Change the theme to Madrid."
        className="w-full h-40 p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out resize-y text-slate-700 placeholder-slate-400"
        disabled={isLoading}
        aria-label="User prompt for LaTeX modifications"
      />
      <button
        onClick={onUpdate}
        disabled={isLoading || !prompt.trim()}
        className={`
          mt-6 w-full sm:w-auto flex items-center justify-center px-8 py-3 
          text-base font-medium rounded-md text-white 
          transition duration-150 ease-in-out transform hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${isLoading || !prompt.trim()
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }
        `}
        aria-live="polite"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </>
        ) : (
          'Update Presentation'
        )}
      </button>
       <p className="mt-3 text-xs text-slate-500">
        Tip: Press Enter to submit, Shift+Enter for a new line in the prompt.
      </p>
    </div>
  );
};

export default PromptControls;
