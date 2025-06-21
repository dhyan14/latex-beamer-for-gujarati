
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import PromptControls from './components/PromptControls';
import LatexCodeView from './components/LatexCodeView';
import ErrorMessage from './components/ErrorMessage';
import ImageInputArea from './components/ImageInputArea';
import PdfInputArea from './components/PdfInputArea';
import InputMethodSelector from './components/InputMethodSelector';
import { updateBeamerPresentation, rewriteSelectedLatex, generateLatexFromImageAndPrompt, generateLatexFromPdfAndPrompt } from './services/geminiService';
import { ActiveActionType, InputMethodType } from './types';

const initialLatexCode = `\\documentclass[aspectratio=169]{beamer}
\\usetheme{Warsaw}

% Basic packages
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\usepackage{fontspec}

% The user can request AMDAVAD UNICODE or other fonts via prompt if installed.
\\newfontfamily\\gujaratifont[Script=Gujarati]{AMDAVAD UNICODE}
\\newcommand{\\guj}[1]{{\\gujaratifont #1}}

% Other common packages that might be useful
\\usepackage{geometry}
\\usepackage{fancyhdr} % Usually not needed with Beamer's own themes
\\usepackage{tcolorbox}
\\usepackage{xcolor} % Already used by theme, but can be explicit
\\usepackage{gensymb}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.17}
\\usepackage{multicol}
\\usepackage{array}

\\setbeamertemplate{theorems}[numbered]
\\theoremstyle{definition}
\\newtheorem{exercise}{\\guj{વ્યાયામ}}
\\newtheorem{prob}{\\guj{સમસ્યા}}
\\newtheorem{exmp}{\\guj{ઉદાહરણ}}
\\theoremstyle{remark}
\\newtheorem*{remark}{\\guj{નોંધ}}
\\newcommand{\\cosec}{\\text{cosec}} % Standard math command

\\title{\\guj{મારી રજૂઆત}} % My Presentation
\\author{\\guj{એઆઈ સહાયક}} % AI Assistant
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}
  \\frametitle{\\guj{પ્રસ્તાવના}} % Introduction
  \\guj{આ પ્રથમ સ્લાઇડ છે. અહીંયા તમે તમારી રજૂઆત માટે ગુજરાતીમાં લખાણ ઉમેરી શકો છો.}
\\end{frame}

% \\guj{વપરાશકર્તાના પ્રોમ્પ્ટના આધારે નીચે સામગ્રી ઉમેરો}

\\end{document}`;

const App: React.FC = () => {
  const [latexCode, setLatexCode] = useState<string>(initialLatexCode);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeActionType, setActiveActionType] = useState<ActiveActionType>(null);
  const [selectedInputMethod, setSelectedInputMethod] = useState<InputMethodType>('prompt');


  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>('');

  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfMimeType, setPdfMimeType] = useState<string | null>(null);
  const [pdfPrompt, setPdfPrompt] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);


  const handleLatexCodeChange = (newCode: string) => {
    setLatexCode(newCode);
  };

  const handleSelectionChange = useCallback((text: string, start: number, end: number) => {
    setSelectedText(text);
    setSelectionStart(start);
    setSelectionEnd(end);
  }, []);
  
  const clearSelection = () => {
    setSelectedText(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const clearImageState = useCallback(() => {
    setPastedImage(null);
    setImageMimeType(null);
    setImagePrompt('');
  }, []);

  const clearPdfState = useCallback(() => {
    setSelectedPdf(null);
    setPdfMimeType(null);
    setPdfPrompt('');
    setPdfFileName(null);
  }, []);

  const handleImageFileSelected = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please select an image.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPastedImage(reader.result as string);
      setImageMimeType(file.type);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      console.error('FileReader error');
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePdfFileSelected = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Please select a PDF file.');
      return;
    }
    setError(null);
    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedPdf(reader.result as string);
      setPdfMimeType(file.type);
    };
    reader.onerror = () => {
      setError('Failed to read PDF file.');
      console.error('FileReader error for PDF');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpdatePresentation = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt to update the presentation.');
      return;
    }

    setActiveActionType('update');
    setIsLoading(true);
    setError(null);
    clearSelection(); 

    try {
      const updatedLatexCode = await updateBeamerPresentation(latexCode, userPrompt);
      setLatexCode(updatedLatexCode);
      setUserPrompt(''); 
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to update presentation: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [userPrompt, latexCode]);

  const handleModifySelectedCode = useCallback(async () => {
    if (!selectedText || selectionStart === null || selectionEnd === null) {
      setError('No text selected to modify.');
      return;
    }
    if (!userPrompt.trim()) {
      setError('Please enter a prompt describing how to modify the selected text.');
      return;
    }
    
    setActiveActionType('modify');
    setIsLoading(true);
    setError(null);

    try {
      const rewrittenSnippet = await rewriteSelectedLatex(selectedText, latexCode, userPrompt);
      
      const prefix = latexCode.substring(0, selectionStart);
      const suffix = latexCode.substring(selectionEnd);
      const updatedLatexCode = `${prefix}${rewrittenSnippet}${suffix}`;
      
      setLatexCode(updatedLatexCode);
      setUserPrompt('');
      clearSelection(); 
    } catch (err: any) {
       if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to modify selected code: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [userPrompt, latexCode, selectedText, selectionStart, selectionEnd]);

  const handleGenerateFrameFromImage = useCallback(async () => {
    if (!pastedImage || !imageMimeType) {
      setError('Please provide an image.');
      return;
    }

    setActiveActionType('generateImage');
    setIsLoading(true);
    setError(null);
    clearSelection();

    try {
      const base64Data = pastedImage.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid image data format.");
      }

      const imageData = { data: base64Data, mimeType: imageMimeType };
      const updatedLatexCode = await generateLatexFromImageAndPrompt(latexCode, imageData, imagePrompt);
      setLatexCode(updatedLatexCode);
      clearImageState();
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to generate from image: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [pastedImage, imageMimeType, imagePrompt, latexCode, clearImageState]);

  const handleGenerateFromPdf = useCallback(async () => {
    if (!selectedPdf || !pdfMimeType) {
      setError('Please select a PDF file.');
      return;
    }

    setActiveActionType('generatePdf');
    setIsLoading(true);
    setError(null);
    clearSelection();

    try {
      const base64Data = selectedPdf.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid PDF data format.");
      }

      const pdfData = { data: base64Data, mimeType: pdfMimeType };
      const updatedLatexCode = await generateLatexFromPdfAndPrompt(latexCode, pdfData, pdfPrompt);
      setLatexCode(updatedLatexCode);
      clearPdfState();
    } catch (err: any) {
      if (err.message && err.message.startsWith('API_KEY_MISSING:')) {
        setError(err.message);
      } else {
        setError(`Failed to generate from PDF: ${err.message || 'Unknown error'}`);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setActiveActionType(null);
    }
  }, [selectedPdf, pdfMimeType, pdfPrompt, latexCode, clearPdfState]);


  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col selection:bg-blue-200">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 space-y-4 md:space-y-0 md:space-x-4">
        {/* Left Pane: LaTeX Code View */}
        <div className="md:w-1/2 w-full flex flex-col bg-white shadow-xl rounded-lg">
          <LatexCodeView 
            latexCode={latexCode} 
            onLatexCodeChange={handleLatexCodeChange}
            onSelectionChange={handleSelectionChange}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
          />
        </div>

        {/* Right Pane: Controls */}
        <div className="md:w-1/2 w-full space-y-6 flex flex-col md:sticky md:top-4 md:self-start md:max-h-[calc(100vh-2rem)] md:overflow-y-auto pb-4 custom-scrollbar">
          <InputMethodSelector
            selectedMethod={selectedInputMethod}
            onMethodChange={setSelectedInputMethod}
            isLoading={isLoading}
          />

          {selectedInputMethod === 'prompt' && (
            <PromptControls
              prompt={userPrompt}
              setPrompt={setUserPrompt}
              onUpdate={handleUpdatePresentation}
              onModifySelected={handleModifySelectedCode}
              isLoading={isLoading}
              isTextSelected={!!selectedText && selectedText.length > 0}
              activeActionType={activeActionType}
            />
          )}
          {selectedInputMethod === 'image' && (
            <ImageInputArea
              pastedImage={pastedImage}
              onImageFileSelected={handleImageFileSelected}
              onClearImage={clearImageState}
              imagePrompt={imagePrompt}
              setImagePrompt={setImagePrompt}
              onGenerateFromImage={handleGenerateFrameFromImage}
              isLoading={isLoading}
              activeActionType={activeActionType}
            />
          )}
          {selectedInputMethod === 'pdf' && (
            <PdfInputArea
              selectedPdfFileName={pdfFileName}
              onPdfFileSelected={handlePdfFileSelected}
              onClearPdf={clearPdfState}
              pdfPrompt={pdfPrompt}
              setPdfPrompt={setPdfPrompt}
              onGenerateFromPdf={handleGenerateFromPdf}
              isLoading={isLoading}
              activeActionType={activeActionType}
            />
          )}
          
          {error && <ErrorMessage message={error} />}
        </div>
      </main>
      <footer className="w-full max-w-7xl mx-auto text-center py-6">
        <p className="text-sm text-slate-500">
          Powered by Gemini API. This app generates Gujarati LaTeX Beamer content. Ensure your API key is configured.
        </p>
      </footer>
    </div>
  );
};

export default App;
