import React from 'react';
import { InputMethodType } from '../types';

interface InputMethodSelectorProps {
  selectedMethod: InputMethodType;
  onMethodChange: (method: InputMethodType) => void;
  isLoading: boolean;
}

const InputMethodSelector: React.FC<InputMethodSelectorProps> = ({ selectedMethod, onMethodChange, isLoading }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onMethodChange(event.target.value as InputMethodType);
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
      <label htmlFor="inputMethod" className="block text-lg font-semibold text-slate-700 mb-3">
        Choose Input Method
      </label>
      <select
        id="inputMethod"
        value={selectedMethod}
        onChange={handleChange}
        disabled={isLoading}
        className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 ease-in-out text-slate-700 bg-white appearance-none"
        aria-label="Select input method"
      >
        <option value="prompt">General Prompt</option>
        <option value="image">From Image</option>
        <option value="pdf">From PDF</option>
      </select>
      <p className="mt-3 text-xs text-slate-500">
        Select how you want to provide input to the AI.
      </p>
    </div>
  );
};

export default InputMethodSelector;