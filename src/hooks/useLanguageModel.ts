import { useState, useEffect, useCallback } from 'react';

// types from the API
type Availability = 'available' | 'unavailable' | 'downloading' | 'downloadable';

interface ModelParams {
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
  maxTemperature: number;
}

export interface ExpectedInput {
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
  }): Promise<any>;
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
    // Ensure LanguageModel exists and has the create method
    const LanguageModelAPI = (window as any).LanguageModel;
    if (availability !== 'downloadable' || typeof LanguageModelAPI?.create !== 'function') {
      console.warn("Download cannot start: Status is not 'downloadable' or API is missing.");
      return;
    }

    setAvailability('downloading');
    setDownloadProgress(0);

    try {
      console.log("Attempting to create session to trigger/monitor download...");
      // Create a session to trigger the download, with a monitor
      await LanguageModelAPI.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            // Calculate progress based on loaded/total
            let progress = 0;
            if (e.total > 0) {
              progress = Math.round((e.loaded / e.total) * 100);
            } else {
              progress = Math.min(downloadProgress + 5, 99);
            }
            console.log(`Download progress: ${progress}%`);
            setDownloadProgress(progress);
          });
        },
      });

      console.log("Model create() promise resolved. Setting availability to 'available'.");
      setAvailability('available');
      setDownloadProgress(100);

    } catch (e) {
      console.error("Error during model download/creation:", e);
      setAvailability('unavailable');
      setDownloadProgress(0);
    }
  }, [availability, setAvailability, setDownloadProgress, downloadProgress]);

  // Public function to create a new, ready-to-use chat session
  const createChatSession = useCallback(async (
    systemPrompt: string,
    history: { role: string; content: string }[] = [],
    expectedInputsOverride?: ExpectedInput[]
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

    const inputs = expectedInputsOverride || [{ type: 'text', languages: ['en'] }];
    const outputs: ExpectedOutput[] = [{ type: 'text', languages: ['en'] }];

    // As per the docs, initialPrompts to set the system persona
    const session = await LanguageModel.create({
      initialPrompts: initialPrompts,
      topK: newTopK,
      temperature: newTemperature,
      expectedInputs: inputs,
      expectedOutputs: outputs,
    });

    const sessionWithDestroy = session as any;
    sessionWithDestroy.destroy = () => {
      console.log("Session destroy called");
    };

    return sessionWithDestroy;
  }, [availability, modelParams]);


  // --- Function to Create Multimodal Session ---
  const createMultimodalSession = useCallback(async (
    systemPrompt: string,
    inputs: ExpectedInput[],
    outputs: ExpectedOutput[] = [{ type: 'text', languages: ['en'] }]
  ) => {
    if (availability !== 'available' || !modelParams) {
      throw new Error("Model is not available or params not loaded.");
    }

    const defaultTopK = modelParams.defaultTopK;
    const defaultTemperature = modelParams.defaultTemperature;

    const session = await LanguageModel.create({
      initialPrompts: [{ role: 'system', content: systemPrompt }],
      topK: defaultTopK,
      temperature: defaultTemperature,
      expectedInputs: inputs,
      expectedOutputs: outputs,
    });

    // destroy method placeholder
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

    let session: any = null;
    try {
      session = await LanguageModel.create({
        initialPrompts: [{ role: 'system', content: titleSystemPrompt }],
        topK: modelParams.defaultTopK,
        temperature: modelParams.defaultTemperature,
      });

      const titlePrompt = `User: ${userMessage}\nAssistant: ${assistantResponse}`;

      const rawTitle = await session.prompt(titlePrompt);

      // Basic cleanup
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