
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl mx-auto text-center py-6 px-4">
      <h1 className="text-4xl font-bold text-blue-700 sm:text-5xl">
        Interactive Gujarati LaTeX Beamer Editor
      </h1>
      <p className="mt-2 text-lg text-slate-600">
        Craft your Beamer presentation in Gujarati step-by-step with AI assistance.
      </p>
    </header>
  );
};

export default Header;
