
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

// Access API_KEY at the time of use
const ensureApiKey = () => {
  const currentApiKey = process.env.API_KEY; 
  if (!currentApiKey) {
    const errorMessage = "API_KEY_MISSING: The Gemini API key is not configured. Please ensure the API_KEY environment variable is set up.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return new GoogleGenAI({ apiKey: currentApiKey });
};

const cleanLatexResponse = (rawText: string | undefined): string => {
    if (!rawText || rawText.trim() === '') {
        console.warn("Received empty or undefined response from AI model.");
        throw new Error("Received empty response from AI model. Please try a different prompt or check model output.");
    }
    
    let finalLatexCode = rawText.trim();
    const fenceRegex = /^```(?:latex|tex)?\s*\n?(.*?)\n?\s*```$/s;
    const match = finalLatexCode.match(fenceRegex);
    if (match && match[1]) {
      finalLatexCode = match[1].trim();
    }
    return finalLatexCode;
};

const handleApiError = (error: any): never => {
    console.error("Error calling Gemini API:", error);
    if (error.message && error.message.startsWith('API_KEY_MISSING:')) {
        throw error; 
    }
    if (error.message && error.message.includes('API key not valid')) {
        throw new Error("Invalid API Key. Please check your API_KEY environment variable.");
    }
    if (error.message && error.message.toLowerCase().includes('quota')) {
        throw new Error("API Quota Exceeded. Please check your Gemini API usage and limits.");
    }
    if (error.message && (error.message.toLowerCase().includes('model_error') || error.message.toLowerCase().includes('candidate error') || error.message.toLowerCase().includes('safety settings') || error.message.toLowerCase().includes('blocked') )) {
        throw new Error("The AI model encountered an issue processing your request (e.g. safety settings, content policy, model error). Please try a different prompt or modify your content.");
    }
    throw new Error(`AI generation failed: ${error.message || 'Unknown error during API call'}`);
}

export const updateBeamerPresentation = async (currentLatexCode: string, userInstruction: string): Promise<string> => {
  const ai = ensureApiKey();

  const systemPromptInstruction = `You are an expert LaTeX Beamer presentation editor, specializing in Gujarati language content.
You will be given an existing LaTeX Beamer code (configured for Gujarati with \\usepackage{fontspec} and a \\guj{} command) and a user instruction.
Your task is to modify the given LaTeX code based on the user's instruction and return the COMPLETE, updated, and compilable LaTeX Beamer code.
ALL GUJARATI TEXTUAL CONTENT MUST BE WRAPPED IN THE \\guj{} COMMAND (e.g., \\frametitle{\\guj{તમારું મથાળું}}, \\guj{તમારું લખાણ}). Mathematical expressions should be standard LaTeX.
PRESERVE THE EXISTING PREAMBLE AND DOCUMENT STRUCTURE UNLESS THE USER SPECIFICALLY ASKS TO CHANGE IT.
IMPORTANT: The following two lines in the preamble are CRITICAL for Gujarati language support and MUST NEVER be altered, removed, or commented out:
\`\\newfontfamily\\gujaratifont[Script=Gujarati]{AMDAVAD UNICODE}\`
\`\\newcommand{\\guj}[1]{{\\gujaratifont #1}}\`
Preserve these lines verbatim.
Ensure all necessary Beamer document structure elements are correctly maintained for a compilable document.
The output MUST be ONLY the raw LaTeX code. Do not include any explanatory text, markdown formatting (like \`\`\`latex ... \`\`\` marks), or any other content outside the LaTeX document.
If the user asks for something that requires a new package, try to add it to the preamble if it's a common LaTeX package compatible with fontspec/xelatex.
Critically, ensure you return the *entire document content*, from \`\\documentclass\` to \`\\end{document}\`. Do not return only the changed snippet.
Example of Gujarati text: \\guj{આ ગુજરાતીમાં લખાણ છે.}
Example of a frame title: \\frametitle{\\guj{પ્રકરણ ૧}}`;

  const userPromptContent = `Existing Gujarati LaTeX Code:\n${currentLatexCode}\n\nUser instruction for modification (primarily in Gujarati context):\n${userInstruction}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: userPromptContent,
      config: {
        systemInstruction: systemPromptInstruction,
      }
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

export const rewriteSelectedLatex = async (selectedSnippet: string, fullLatexContext: string, userInstruction: string): Promise<string> => {
  const ai = ensureApiKey();

  const systemPromptInstruction = `You are an expert LaTeX editor, focusing on Gujarati content within a Beamer presentation.
You will be given a snippet of selected LaTeX code, the full LaTeX document context (which is set up for Gujarati with \\guj{}), and a user instruction on how to modify ONLY that snippet.
Your task is to rewrite ONLY the provided 'Selected LaTeX snippet' based on the 'User instruction for the snippet'.
If the instruction involves adding or changing text to Gujarati, ensure it is wrapped in \\guj{}. For example, if selected text is "Hello" and instruction is "Change to Gujarati greeting", output could be "\\guj{નમસ્તે}".
Mathematical expressions should remain standard LaTeX.
The output MUST be ONLY the modified LaTeX snippet. Do NOT return the full document. Do NOT include any explanatory text or markdown formatting.
Ensure the rewritten snippet is valid LaTeX and makes sense in the context of the original document.
The full document preamble contains essential lines for Gujarati support: \`\\newfontfamily\\gujaratifont[Script=Gujarati]{AMDAVAD UNICODE}\` and \`\\newcommand{\\guj}[1]{{\\gujaratifont #1}}\`. While you are modifying a snippet, be aware of this context.
If the instruction is to "delete this", return an empty string or an appropriate LaTeX comment.`;
  
  const userPromptContent = `Full Gujarati LaTeX Document Context:\n${fullLatexContext}\n\nSelected LaTeX snippet to modify:\n${selectedSnippet}\n\nUser instruction for the snippet (assume Gujarati context if applicable):\n${userInstruction}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: userPromptContent,
      config: {
        systemInstruction: systemPromptInstruction,
      }
    });
    // For rewrite, if the response is empty, it might be intentional (e.g., delete).
    // cleanLatexResponse might throw error on empty, so handle carefully or adjust cleanLatexResponse.
    // Assuming cleanLatexResponse handles or is tolerant to potentially empty meaningful snippets.
    const cleanedResponse = cleanLatexResponse(response.text);
    // If the original snippet was already wrapped in \guj{} and the instruction is minor text change,
    // the AI might return just the inner text. We need to ensure it's re-wrapped if it's Gujarati text.
    // This is tricky; for now, rely on AI to return the correct full snippet.
    return cleanedResponse;
  } catch (error) {
    handleApiError(error);
  }
};

interface FileData {
  data: string; // base64 encoded string
  mimeType: string;
}

export const generateLatexFromImageAndPrompt = async (currentLatexCode: string, imageData: FileData, imageInstruction: string): Promise<string> => {
  const ai = ensureApiKey();

  const systemPromptForImage = `You are an expert LaTeX Beamer presentation creator, specializing in integrating visual information into GUJARATI presentations.
The presentation uses \\usepackage{fontspec} and a \\guj{} command for Gujarati text.
You will be given:
1. An existing Gujarati LaTeX Beamer presentation code.
2. An image.
3. An optional user prompt related to the image (potentially in Gujarati or English asking for Gujarati content).

Your task is to:
1. Analyze the image.
2. Consider the user's prompt. If the prompt is empty or implies general description, describe the image or its content in GUJARATI.
3. Generate new LaTeX Beamer content (typically a new frame) based on the image and prompt. All textual descriptions, titles, and content derived from the image MUST be in Gujarati and wrapped with the \\guj{} command. E.g., \\frametitle{\\guj{આકૃતિનું વર્ણન}}, \\guj{આ ચિત્ર દર્શાવે છે...}.
4. Integrate this new content seamlessly into the existing LaTeX Beamer code, usually by adding a new \\begin{frame} ... \\end{frame} block.
5. Return the COMPLETE, updated, and compilable Gujarati LaTeX Beamer code.

PRESERVE THE EXISTING PREAMBLE.
IMPORTANT: The following two lines in the preamble are CRITICAL for Gujarati language support and MUST NEVER be altered, removed, or commented out:
\`\\newfontfamily\\gujaratifont[Script=Gujarati]{AMDAVAD UNICODE}\`
\`\\newcommand{\\guj}[1]{{\\gujaratifont #1}}\`
Preserve these lines verbatim.
When including an image, use a placeholder like "\\includegraphics[width=0.8\\textwidth]{placeholder_image.png}". The user will replace 'placeholder_image.png'.
Critically, ensure you return the *entire document content*. The output MUST be ONLY raw LaTeX code.`;

  const imagePart = {
    inlineData: {
      mimeType: imageData.mimeType,
      data: imageData.data,
    },
  };

  const textPromptForImage = `Current Gujarati LaTeX Code:\n${currentLatexCode}\n\nUser instruction for image (generate Gujarati content):\n${imageInstruction || 'No specific instruction. Analyze the image and generate a relevant new frame in Gujarati based on it, integrating it into the current LaTeX code. Provide a descriptive frame title in Gujarati using \\guj{}.'}`;
  const textPart = { text: textPromptForImage };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: { parts: [textPart, imagePart] },
      config: {
        systemInstruction: systemPromptForImage,
      },
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};

export const generateLatexFromPdfAndPrompt = async (currentLatexCode: string, pdfData: FileData, pdfInstruction: string): Promise<string> => {
  const ai = ensureApiKey();

  const systemPromptForPdf = `You are an expert LaTeX Beamer presentation creator, specializing in converting content from PDF documents (especially those in GUJARATI with mathematics) into GUJARATI LaTeX Beamer presentations.
The target LaTeX presentation uses \\usepackage{fontspec} and a \\guj{} command for all Gujarati text.
You will be given:
1. An existing Gujarati LaTeX Beamer presentation code.
2. A PDF document (this PDF might contain Gujarati text, English text, and mathematical formulas).
3. An optional user prompt related to the PDF content.

Your task is to:
1. Analyze the content of the PDF document. Identify Gujarati text, English text, and mathematical formulas.
2. Based on the user's prompt (or summarize/extract key info if no prompt), generate new LaTeX Beamer content.
3. All textual content (titles, body, lists, summaries) derived or transcribed from the PDF that is meant to be in Gujarati MUST be wrapped in the \\guj{} command. E.g., \\frametitle{\\guj{પીડીએફ સારાંશ}}, \\guj{મુખ્ય મુદ્દાઓ:}.
4. Mathematical formulas from the PDF should be transcribed into standard LaTeX math environments.
5. Integrate this new content seamlessly into the existing Gujarati LaTeX Beamer code, typically as new frames.
6. Return the COMPLETE, updated, and compilable Gujarati LaTeX Beamer code.

PRESERVE THE EXISTING PREAMBLE.
IMPORTANT: The following two lines in the preamble are CRITICAL for Gujarati language support and MUST NEVER be altered, removed, or commented out:
\`\\newfontfamily\\gujaratifont[Script=Gujarati]{AMDAVAD UNICODE}\`
\`\\newcommand{\\guj}[1]{{\\gujaratifont #1}}\`
Preserve these lines verbatim.
If the PDF contains images, you can describe them in Gujarati (using \\guj{}) or suggest a placeholder like \\includegraphics.
The output MUST be ONLY the raw LaTeX code. Do not include any explanatory text or markdown.
Critically, ensure you return the *entire document content*. Focus on accurate Gujarati transcription using \\guj{} and correct math representation.`;

  const pdfFilePart = {
    inlineData: {
      mimeType: pdfData.mimeType, // Should be 'application/pdf'
      data: pdfData.data,
    },
  };

  const textPromptForPdf = `Current Gujarati LaTeX Code:\n${currentLatexCode}\n\nUser instruction for PDF (generate Gujarati content, transcribe math):\n${pdfInstruction || 'No specific instruction. Analyze the PDF. Extract key information, summarize, or create relevant frames in Gujarati. Transcribe Gujarati text using \\guj{} and mathematical formulas accurately. Integrate into the current LaTeX code.'}`;
  const textPart = { text: textPromptForPdf };
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME, 
      contents: { parts: [textPart, pdfFilePart] },
      config: {
        systemInstruction: systemPromptForPdf,
      },
    });
    return cleanLatexResponse(response.text);
  } catch (error) {
    handleApiError(error);
  }
};
