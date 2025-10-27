// src/hooks/useLanguageModel.ts
import { useState, useEffect, useCallback } from 'react';

// Define the types from the API
type Availability = 'available' | 'unavailable' | 'downloading' | 'downloadable';

interface ModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

interface ExpectedInput {
  type: 'text' | 'image' | 'audio';
  languages?: string[];
}

interface ExpectedOutput {
  type: 'text'; 
  languages?: string[];
}

interface LanguageModel {
  availability(): Promise<Availability>;
  create(options?: { 
    initialPrompts?: { role: string, content: string }[];
    monitor?(m: any): void;
    topK?: number;
    temperature?: number;
    expectedInputs?: ExpectedInput[];
    expectedOutputs?: ExpectedOutput[];
  }): Promise<any>; // Using 'any' for the session for now
  params(): Promise<ModelParams>;
}

declare global {
  const LanguageModel: LanguageModel;
}

export function useLanguageModel() {
  const [availability, setAvailability] = useState<Availability | 'checking'>('checking');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const [modelParams, setModelParams] = useState<ModelParams | null>(null);

  // Check availability when the hook mounts
  useEffect(() => {
    async function checkAvailability() {
      if (typeof LanguageModel === 'undefined') {
        setAvailability('unavailable');
        return;
      }
      try {
        const [status, params] = await Promise.all([
          LanguageModel.availability(),
          LanguageModel.params()
        ]);
        
        setAvailability(status);
        setModelParams(params);
      } catch (e) {
        console.error("Error checking model availability:", e);
        setAvailability('unavailable');
      }
    }
    checkAvailability();
  }, []);

  // Public function to trigger the download
  const downloadModel = useCallback(async () => {
    if (availability !== 'downloadable') return;

    setAvailability('downloading');
    try {
      // Create a session to trigger the download, with a monitor
      await LanguageModel.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = Math.round((e.loaded / e.total) * 100);
            setDownloadProgress(progress);
          });
        },
      });
      setAvailability('available'); // Download complete
      setDownloadProgress(100);
    } catch (e) {
      console.error("Error downloading model:", e);
      setAvailability('unavailable');
    }
  }, [availability]);

  // Public function to create a new, ready-to-use chat session
  const createChatSession = useCallback(async (
    systemPrompt: string,
    history: { role: string; content: string }[] = []
  ) => {
    if (availability !== 'available' || !modelParams) {
      throw new Error("Model is not available or params not loaded.");
    }
    
    const newTopK = Math.min(modelParams.maxTopK, 32);
    const newTemperature = modelParams.defaultTemperature;

    const initialPrompts = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    // As per the docs, use initialPrompts to set the system persona
    const session = await LanguageModel.create({
      initialPrompts: initialPrompts,
      topK: newTopK,
      temperature: newTemperature,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    });

    const sessionWithDestroy = session as any; 
    sessionWithDestroy.destroy = () => {
       // Placeholder: The actual Chrome API might have a different way to destroy/clean up.
       // For now, this allows our component cleanup logic to work.
       console.log("Session destroy called (placeholder)"); 
    };

    return sessionWithDestroy;
  }, [availability, modelParams]);


  // --- Function to Create Multimodal Session ---
  const createMultimodalSession = useCallback(async (
    systemPrompt: string,
    inputs: ExpectedInput[], // Define the expected inputs
    outputs: ExpectedOutput[] = [{ type: 'text', languages: ['en'] }] // Default output
  ) => {
    if (availability !== 'available' || !modelParams) {
      throw new Error("Model is not available or params not loaded.");
    }

    // Use default parameters for multimodal for now, can be adjusted
    const defaultTopK = modelParams.defaultTopK;
    const defaultTemperature = modelParams.defaultTemperature;

    console.log("Creating multimodal session with expected inputs:", inputs);

    const session = await LanguageModel.create({
      initialPrompts: [{ role: 'system', content: systemPrompt }],
      topK: defaultTopK,
      temperature: defaultTemperature,
      expectedInputs: inputs, // <-- Set multimodal inputs
      expectedOutputs: outputs,
    });

    // Add destroy method placeholder
    const sessionWithDestroy = session as any;
    sessionWithDestroy.destroy = () => console.log("Multimodal session destroy called (placeholder)");
    return sessionWithDestroy;

  }, [availability, modelParams]);

  // --- Function to Generate Title ---
  const generateTitle = useCallback(async (userMessage: string, assistantResponse: string): Promise<string> => {
    // Ensure model is ready before attempting
    if (availability !== 'available' || !modelParams) {
      console.warn("Model not available for title generation.");
      return "New Chat"; // Fallback title
    }

    // Define a specific, concise system prompt for title generation
    const titleSystemPrompt = "You are a title generator. Create a very short, concise title (max 5 words) for a conversation based on the user's first message and the assistant's first reply. Focus on the main topic. Do not use quotes or introductory phrases.";

    let session: any = null; // Use 'any' for this temporary session
    try {
      // Create a temporary, lightweight session just for title generation
      session = await LanguageModel.create({
        initialPrompts: [{ role: 'system', content: titleSystemPrompt }],
        // Use default parameters for this simple task
        topK: modelParams.defaultTopK,
        temperature: modelParams.defaultTemperature,
      });

      const titlePrompt = `User: ${userMessage}\nAssistant: ${assistantResponse}`;

      const rawTitle = await session.prompt(titlePrompt);

      // Basic cleanup (remove potential quotes, extra spaces)
      const cleanedTitle = rawTitle.replace(/["']/g, "").trim();

      return cleanedTitle || "New Chat"; 

    } catch (error) {
      console.error("Error generating title:", error);
      return "New Chat"; 
    } finally {
      session?.destroy();
    }
  }, [availability, modelParams]);

  return {
    availability,
    downloadModel,
    downloadProgress,
    createChatSession,
    createMultimodalSession,
    generateTitle
  };
}