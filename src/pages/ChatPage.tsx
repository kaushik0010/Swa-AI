import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { usePersonas } from '@/hooks/usePersonas';
import { getPrebuiltPersona, PREBUILT_PERSONAS } from '@/lib/prebuilt-personas';
import { useLanguageModel, type ExpectedInput } from '@/hooks/useLanguageModel';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { toast } from "sonner";
import { CircleDot, ListRestart, Mic, Square, Upload, Video } from 'lucide-react';
import type { Conversation, Message, Persona } from '@/lib/types';
import { ConversationList } from '@/components/chat/ConversationList';
import { useReactMediaRecorder } from "react-media-recorder";
import { Label } from '@/components/ui/label';
import { dataUrlToBlob } from '@/lib/utils';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ChatSession {
  promptStreaming: (prompt: string | { role: string; content: any }[]) => Promise<ReadableStream<string>>;
  destroy: () => void;
}

export default function ChatPage() {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    getPersona,
    personaExists,
    addPersona,
    getConversation,
    saveConversation,
    createNewConversation,
    getConversationsForPersona
  } = usePersonas();

  const persona: Persona | undefined = useMemo(() => {
    if (!personaId) return undefined;
    const prebuilt = getPrebuiltPersona(personaId);
    if (prebuilt) return prebuilt;
    return getPersona(personaId);
  }, [personaId, getPersona]);

  const { availability, downloadModel, downloadProgress, createChatSession, generateTitle, createMultimodalSession } = useLanguageModel();

  // --- State ---
  const [currentConvo, setCurrentConvo] = useState<Conversation | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- State for Speech Coach UI ---
  type SpeechCoachMode = 'options' | 'uploading' | 'capturing' | 'previewing' | 'analyzing';
  const [speechCoachMode, setSpeechCoachMode] = useState<SpeechCoachMode>('options');
  const [capturedAudioBlobUrl, setCapturedAudioBlobUrl] = useState<string | null>(null);
  const [capturedImageSnapshots, setCapturedImageSnapshots] = useState<string[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const [isRewriteDialogOpen, setIsRewriteDialogOpen] = useState(false);
  const [messageToRewrite, setMessageToRewrite] = useState<{ message: Message; index: number } | null>(null);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // --- Refs for video and canvas ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // --- Media Recorder Hook ---
  const {
    status: recorderStatus,
    startRecording,
    stopRecording,
    previewStream,
  } = useReactMediaRecorder({
    video: true,
    audio: true,
    onStop: (blobUrl) => {
      console.log("Recording stopped. Audio Blob URL:", blobUrl);
      setCapturedAudioBlobUrl(blobUrl);
      setSpeechCoachMode('previewing');
    },
    askPermissionOnMount: false,
  });

  // --- Effect to update the timer display ---
  useEffect(() => {
    let interval: number | null = null;
    if (recorderStatus === 'recording' && recordingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - recordingStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recorderStatus, recordingStartTime]);

  const hasSetStreamRef = useRef(false);

  useEffect(() => {
    if (!hasSetStreamRef.current && videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
      videoRef.current.play().catch(console.error);
      hasSetStreamRef.current = true;
    }
  }, [previewStream]);


  // --- Determine Conversation ID from URL ---
  const convoId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('convo');
  }, [location.search]);

  const pastConversations = useMemo(() => {
    return personaId ? getConversationsForPersona(personaId) : [];
  }, [personaId, getConversationsForPersona]);


  // --- Effect: Load Conversation Data ---
  useEffect(() => {
    const loadedConvo = convoId ? getConversation(convoId) : null;

    // Validate if the loaded convo belongs to the current persona
    if (loadedConvo && loadedConvo.personaId !== personaId) {
      setCurrentConvo(null);
      navigate(`/chat/${personaId}`, { replace: true });
    } else {
      setCurrentConvo(loadedConvo || null);
    }
  }, [personaId, convoId, getConversation, navigate]);


  // --- Effect 2: Manage AI Session Lifecycle ---
  useEffect(() => {
    // Only proceed if we have a persona and it's a text type
    if (!persona || persona.type === 'speechcoach') {
      if (session) { session.destroy(); setSession(null); }
      return;
    }

    // Initialize session only if model is ready AND no session exists yet
    if (availability === 'available' && !session && !isSessionLoading) {
      setIsSessionLoading(true);
      const loadingToastId = toast.loading("Initializing AI session...");

      // Pass history ONLY if we have a current conversation loaded
      const initialMessages = currentConvo?.messages.map(m => ({ role: m.role, content: m.content })) || [];

      let expectedInputs: ExpectedInput[] | undefined = undefined;
      if (persona.type === 'image') {
        expectedInputs = [{ type: 'image' }, { type: 'text' }];
      } else if (persona.type === 'audio') {
        expectedInputs = [{ type: 'audio' }, { type: 'text' }];
      } else {
        expectedInputs = [{ type: 'image' }, { type: 'audio' }, { type: 'text' }];
      }

      createChatSession(persona.systemPrompt, initialMessages, expectedInputs)
        .then(newSession => {
          setSession(newSession);
          toast.success("AI session initialized!", { id: loadingToastId });
        })
        .catch(e => {
          console.error("Session creation failed:", e);
          let errorMsg = `Failed to create AI session: ${e.message}`;
          if (e.name === 'NotAllowedError') {
            errorMsg = `Session creation failed: ${persona.type} capability not available.`;
          }
          toast.error(errorMsg, { id: loadingToastId });
        })
        .finally(() => {
          setIsSessionLoading(false);
        });
    }

    // Cleanup function for THIS effect
    return () => {

    };
  }, [persona, availability, session, isSessionLoading, currentConvo, createChatSession]);

  // --- Update createChatSession signature in useLanguageModel ---

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentConvo?.messages]);

  const handleFileSelect = useCallback((file: File | null) => {
    setAttachedFile(file);
  }, []);

  const handleRewriteClick = (message: Message, index: number) => {
    setMessageToRewrite({ message, index });
    setRewriteInstruction("");
    setIsRewriteDialogOpen(true);
  };

  // --- Placeholder Function for handling the actual rewrite ---
  const handleConfirmRewrite = useCallback(async () => {
    if (!messageToRewrite || !rewriteInstruction || !currentConvo || !persona || !session) {
      toast.error("Cannot rewrite: Missing information.");
      setIsRewriteDialogOpen(false);
      setMessageToRewrite(null);
      return;
    };

    setIsRewriting(true);
    setIsRewriteDialogOpen(false);
    const { message: originalMessage, index: messageIndex } = messageToRewrite;
    const loadingToastId = toast.loading("Rewriting response...");

    // --- Construct the Rewrite Prompt ---
    const precedingUserMessage = currentConvo.messages[messageIndex - 1]?.role === 'user'
      ? currentConvo.messages[messageIndex - 1].content
      : "[Context: No preceding user message found in history]";

    const rewriteMetaPrompt = `
      You are acting as the persona defined below. Your task is to rewrite a previous response based on a user's instruction.
      ---
      [System Prompt of Persona]
      ${persona.systemPrompt}
      ---
      [Original User Query that led to the response]
      ${precedingUserMessage}
      ---
      [Original Assistant Response to Rewrite]
      ${originalMessage.content}
      ---
      [User's Rewrite Instruction]
      ${rewriteInstruction.trim()}
      ---
      [Task]
      Rewrite the text from the "[Original Assistant Response to Rewrite]" section strictly following the "[User's Rewrite Instruction]".
      Adhere to the persona defined in "[System Prompt of Persona]".
      Output *only* the rewritten text. Do *not* include any extra phrases like "Here's the rewritten version:".
      `;

    let rewrittenContent = "";
    try {
      const stream = await session.promptStreaming(rewriteMetaPrompt);

      for await (const chunk of stream) {
        rewrittenContent += chunk;
        setCurrentConvo(prev => {
          if (!prev) return null;
          const updatedMessages = [...prev.messages];
          if (messageIndex >= 0 && messageIndex < updatedMessages.length && updatedMessages[messageIndex].timestamp === originalMessage.timestamp) {
            let currentAccumulated = updatedMessages[messageIndex].content;
            let cleanedChunk = chunk;
            const lastWordMatch = currentAccumulated.match(/(\w+)$/);
            const firstWordMatch = chunk.match(/^(\w+)/);
            if (lastWordMatch && firstWordMatch && lastWordMatch[1] === firstWordMatch[1]) {
              const endsWithSpaceAndWord = /\s\w+$/.test(currentAccumulated);
              const startsWithWordAndSpace = /^\w+\s/.test(chunk);
              if (endsWithSpaceAndWord || startsWithWordAndSpace) {
                cleanedChunk = chunk.substring(firstWordMatch[1].length).trimStart();
              }
            }
            updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], content: currentAccumulated + cleanedChunk };
          }
          return { ...prev, messages: updatedMessages };
        });
      }

      // Final cleanup and save
      const finalRewrittenContent = rewrittenContent.replace(/\n{3,}/g, '\n\n').trimEnd();
      setCurrentConvo(prev => {
        if (!prev) return null;
        const finalMessages = [...prev.messages];
        if (messageIndex >= 0 && messageIndex < finalMessages.length && finalMessages[messageIndex].timestamp === originalMessage.timestamp) {
          finalMessages[messageIndex] = {
            ...finalMessages[messageIndex],
            content: finalRewrittenContent,
            timestamp: Date.now()
          };
        }
        const finalConvo = { ...prev, messages: finalMessages, lastEdited: Date.now() };
        saveConversation(finalConvo);
        return finalConvo;
      });

      toast.success("Rewrite complete!", { id: loadingToastId });

    } catch (error: any) {
      console.error("Error during rewrite:", error);
      let errorMsg = `Rewrite failed: ${error.message || 'Unknown error'}`;
      if (error.name === 'NotAllowedError') {
        errorMsg = `Rewrite failed: Necessary capability not available.`;
      }
      toast.error(errorMsg, { id: loadingToastId });
    } finally {
      setIsRewriting(false);
      setMessageToRewrite(null);
      setRewriteInstruction("");
    }
  }, [messageToRewrite, rewriteInstruction, currentConvo, persona, session, saveConversation]);

  // --- Analyze Rehearsal Function ---
  const analyzeRehearsal = useCallback(async () => {
    if (!persona || !capturedAudioBlobUrl || capturedImageSnapshots.length === 0) {
      toast.error("Missing audio or image data for analysis.");
      return;
    }

    const isPrebuilt = PREBUILT_PERSONAS.some(p => p.id === persona.id);
    if (isPrebuilt && !personaExists(persona.id)) {
      console.log(`Adding pre-built persona ${persona.name} to custom list (triggered by analysis).`);
      addPersona(persona);
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSpeechCoachMode('analyzing');
    const loadingToastId = toast.loading("Analyzing rehearsal...");

    let session: any = null;
    let analysisSuccess = false;
    let resultText = "";

    try {
      // 1. Prepare Media Data (Blobs)
      const audioResponse = await fetch(capturedAudioBlobUrl);
      const audioBlob = await audioResponse.blob();

      const imageBlobs = await Promise.all(
        capturedImageSnapshots.map(dataUrl => dataUrlToBlob(dataUrl))
      );
      const validImageBlobs = imageBlobs.filter(blob => blob !== null) as Blob[];

      if (!audioBlob || validImageBlobs.length === 0) {
        throw new Error("Failed to prepare media Blobs.");
      }

      // 2. Create Multimodal Session
      session = await createMultimodalSession(
        persona.systemPrompt,
        [{ type: 'audio' }, { type: 'image' }, { type: 'text' }] // Keep expected inputs simple
      );

      // 3. Construct Multimodal Prompt Array
      const multimodalPromptPayload = [
        // Audio first
        { role: 'user', content: [{ type: 'audio', value: audioBlob }] },
        // Then images
        ...validImageBlobs.map(imgBlob => ({ role: 'user', content: [{ type: 'image', value: imgBlob }] })),
        // Final text instruction
        { role: 'user', content: [{ type: 'text', value: "Analyze the provided audio recording and image snapshots based on your system prompt instructions. Provide constructive feedback on clarity, confidence, tone, and visual cues (like posture or facial expression if visible)." }] }
      ];


      // 4. Call the AI 
      const result = await session.prompt(multimodalPromptPayload);
      resultText = result || "Analysis complete, but no text feedback received.";
      setAnalysisResult(resultText);
      analysisSuccess = true;
      toast.success("Analysis complete!", { id: loadingToastId });

      // --- Save Analysis as a Conversation ---
      if (analysisSuccess) {
        const now = Date.now();
        const userPseudoMessage: Message = {
          role: 'user',
          content: `[Speech Rehearsal Analyzed on ${new Date(now).toLocaleDateString()}]`,
          timestamp: now - 1
        };
        // Create assistant message with the result
        const assistantResultMessage: Message = {
          role: 'assistant',
          content: resultText,
          timestamp: now
        };
        // Generate title
        const convoTitle = `Speech Analysis - ${new Date(now).toLocaleString()}`;

        // Create the conversation object
        const newAnalysisConvo: Conversation = {
          id: crypto.randomUUID(),
          personaId: persona.id,
          title: convoTitle,
          messages: [userPseudoMessage, assistantResultMessage],
          lastEdited: now
        };

        // Save it using the hook function
        saveConversation(newAnalysisConvo);

        // Navigate to the new conversation's URL
        navigate(`/chat/${persona.id}?convo=${newAnalysisConvo.id}`, { replace: true });
        setSpeechCoachMode('options');
      }

    } catch (error: any) {
      console.error("Error during analysis:", error);

      // --- Graceful Error Handling ---
      let errorMessage = `Analysis failed: ${error.message || 'Unknown error'}`;
      if (error.name === 'NotAllowedError') {
        errorMessage = "Analysis failed: Multimodal capability (audio/image) is not available or enabled on this system. Please check browser flags and system requirements.";
        setAnalysisResult(errorMessage);
      } else {
        setAnalysisResult(`Analysis Error: ${error.message}`);
      }
      toast.error(errorMessage, { id: loadingToastId });
      setSpeechCoachMode('analyzing');

    } finally {
      setIsAnalyzing(false);
      session?.destroy();
    }
  }, [
    persona, capturedAudioBlobUrl, capturedImageSnapshots,
    createMultimodalSession, setSpeechCoachMode, saveConversation, navigate, addPersona, personaExists
  ]);

  // --- Snapshot Logic ---
  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snapshot = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImageSnapshots((prev) => [...prev, snapshot]);
  }, []);

  // --- Start Capture ---
  const handleStartCapture = async () => {
    try {
      setCapturedImageSnapshots([]);
      setCapturedAudioBlobUrl(null);
      setElapsedTime(0);

      await startRecording();
      setRecordingStartTime(Date.now());

      // Initial snapshot immediately
      captureSnapshot();

      // Snapshot every 15 seconds
      snapshotIntervalRef.current = setInterval(captureSnapshot, 15 * 1000);

      // Auto-stop after 60 seconds
      stopTimeoutRef.current = setTimeout(() => {
        captureSnapshot();
        stopRecording();
        handleStopCaptureCleanupOnly();
      }, 60 * 1000);
    } catch (err) {
      console.error(err);
      toast.error("Could not start recording. Please allow camera and mic permissions.");
    }
  };

  const handleStopCaptureCleanupOnly = useCallback(() => {
    if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);

    snapshotIntervalRef.current = null;
    stopTimeoutRef.current = null;

    setRecordingStartTime(null);
  }, []);

  // --- Stop Capture ---
  const handleStopCaptureManual = useCallback(() => {
    if (recorderStatus === "recording") {
      captureSnapshot();
      stopRecording();
    }
    handleStopCaptureCleanupOnly();
  }, [recorderStatus, stopRecording, handleStopCaptureCleanupOnly, captureSnapshot]);

  useEffect(() => {
    if (recordingStartTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - recordingStartTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [recordingStartTime]);

  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    };
  }, []);


  // --- Handle New Chat Button ---
  const handleNewChat = () => {
    if (personaId) {
      session?.destroy();
      setSession(null);
      setCurrentConvo(null);
      navigate(`/chat/${personaId}`);
    }
  };

  // --- Handle User Message Submission ---
  const handleSubmitMessage = useCallback(async (userInput: string, file?: File) => {
    if (!session || !persona) {
      toast.error("Session not ready.");
      return;
    }

    if (!userInput.trim() && !file) {
      toast.warning("Please type a message or attach a file.");
      return;
    }

    let userMessageContent = userInput;
    if (file) { userMessageContent += `\n[Attached: ${file.name}]`; }

    const newUserMessage: Message = { role: 'user', content: userMessageContent, timestamp: Date.now() };

    let payloadParts: { type: 'text' | 'image' | 'audio', value: string | Blob }[] = [];
    if (userInput.trim()) {
      payloadParts.push({ type: 'text', value: userInput.trim() });
    }

    let mediaType: 'audio' | 'image' | null = null;

    if (file) {
      const mediaBlob: Blob = file;
      mediaType = file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('audio/') ? 'audio' : null;

      if (mediaType) {
        payloadParts.unshift({ type: mediaType, value: mediaBlob });
      } else {
        toast.error("Unsupported file type attached.");
        return;
      }
    }

    let convoToUpdate: Conversation;
    let isNewConversation = false;

    // If no current convo, create one
    if (!currentConvo) {
      convoToUpdate = createNewConversation(persona.id, newUserMessage);
      isNewConversation = true;

      navigate(`/chat/${persona.id}?convo=${convoToUpdate.id}`, { replace: true });

      // --- Save Pre-built Persona on First Use ---
      const isPrebuilt = PREBUILT_PERSONAS.some(p => p.id === persona.id);
      // Check if it's prebuilt AND doesn't already exist in the custom list
      if (isPrebuilt && !personaExists(persona.id)) {
        addPersona(persona);
      }
    } else {
      convoToUpdate = {
        ...currentConvo,
        messages: [...currentConvo.messages, newUserMessage],
        lastEdited: Date.now(),
      };
    }

    // Add empty assistant message placeholder
    const assistantMessagePlaceholder: Message = { role: 'assistant', content: "", timestamp: Date.now() + 1 };
    convoToUpdate.messages.push(assistantMessagePlaceholder);

    setCurrentConvo(convoToUpdate);
    setIsLoading(true);
    setAttachedFile(null);

    // --- Suggestion 1: Generate Title for New Convo ---
    let accumulatedResponse = "";

    try {
      // Pass only the new user message to promptStreaming
      const stream = await session.promptStreaming([{ role: 'user', content: payloadParts }]);

      for await (const chunk of stream) {
        accumulatedResponse += chunk;
        setCurrentConvo(prev => {
          if (!prev) return null;
          const updatedMessages = [...prev.messages];
          const lastMsgIndex = updatedMessages.length - 1;
          const lastMsg = { ...updatedMessages[lastMsgIndex] };

          let currentContent = lastMsg.content;
          let cleanedChunk = chunk;

          // Simple stutter removal
          const lastWordMatch = currentContent.match(/(\w+)$/);
          const firstWordMatch = chunk.match(/^(\w+)/);
          if (lastWordMatch && firstWordMatch && lastWordMatch[1] === firstWordMatch[1]) {
            const endsWithSpaceAndWord = /\s\w+$/.test(currentContent);
            const startsWithWordAndSpace = /^\w+\s/.test(chunk);
            if (endsWithSpaceAndWord || startsWithWordAndSpace) {
              cleanedChunk = chunk.substring(firstWordMatch[1].length).trimStart();
            }
          }
          lastMsg.content += cleanedChunk;
          lastMsg.timestamp = Date.now();

          updatedMessages[lastMsgIndex] = lastMsg;
          return { ...prev, messages: updatedMessages };
        });
      }

    } catch (e: any) {
      console.error(e);
      let errorMsg = `An error occurred: ${e.message || 'Unknown error'}`;
      if (e.name === 'NotAllowedError') {
        errorMsg = "Multimodal capability (audio/image) is not available or enabled on this system.";
      }
      toast.error(errorMsg);
      // Rollback placeholder message
      setCurrentConvo(prev => {
        if (!prev) return null;
        return { ...prev, messages: prev.messages.slice(0, -1) }
      });
    } finally {
      setIsLoading(false);
      let finalTitle = currentConvo?.title || "New Chat";
      let finalContent = accumulatedResponse;

      // --- Title Extraction Logic ---
      const titleMatch = accumulatedResponse.match(/^TITLE:\s*(.*)\n/i);
      if (titleMatch && titleMatch[1]) {
        const extractedTitle = titleMatch[1].trim();
        if (extractedTitle && (currentConvo?.title === "New Chat" || isNewConversation)) {
          finalTitle = extractedTitle;
          toast.info(`Story title suggested: "${finalTitle}"`);
        }
      }


      if (isNewConversation && finalTitle === "New Chat") {
        finalTitle = await generateTitle(userInput, finalContent);
        toast.info(`Chat title set to: "${finalTitle}"`);
      }
      setCurrentConvo(prev => {
        if (!prev) return null;

        const finalMessages = [...prev.messages];
        const finalLastMsgIndex = finalMessages.length - 1;
        if (finalLastMsgIndex >= 0 && finalMessages[finalLastMsgIndex].role === 'assistant') {
          const finalLastMsg = { ...finalMessages[finalLastMsgIndex] };
          // Trim and normalize newlines
          finalLastMsg.content = finalContent
            .replace(/\n{3,}/g, '\n\n')
            .trimEnd();
          finalMessages[finalLastMsgIndex] = finalLastMsg;
        }

        // Update title and save
        const finalConvo: Conversation = {
          ...prev,
          title: finalTitle,
          messages: finalMessages,
          lastEdited: Date.now()
        };
        saveConversation(finalConvo);
        return finalConvo;
      });

    }
  }, [session, persona, currentConvo, createNewConversation, saveConversation, navigate, generateTitle, addPersona, personaExists]);


  // --- Render Logic ---
  const renderContent = () => {
    // --- Speech Coach UI Logic ---
    if (persona?.type === 'speechcoach') {

      // --- Display Saved Analysis ---
      if (currentConvo) {
        // Find the assistant message
        const savedResult = currentConvo.messages.find(m => m.role === 'assistant')?.content;
        return (
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
            <h3 className="text-lg font-semibold">Saved Analysis: {currentConvo.title}</h3>
            <div className="p-3 bg-slate-900 rounded border border-slate-700 max-h-96 overflow-y-auto">
              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans">
                {savedResult || "Could not load analysis content."}
              </pre>
            </div>
            <Button variant="outline" className="w-full cursor-pointer" onClick={handleNewChat}>
              <Video className="mr-2 h-4 w-4" /> Start New Rehearsal
            </Button>
          </div>
        );
      }

      // --- State: Showing Initial Options ---
      if (speechCoachMode === 'options') {
        return (
          <div className="text-center p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 space-y-4">
            <h3 className="text-lg font-semibold">Prepare Your Rehearsal</h3>
            <p className="text-sm text-slate-400">
              How would you like to provide your speech recording?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button className='cursor-pointer' onClick={() => setSpeechCoachMode('uploading')}>
                <Upload className="mr-2 h-4 w-4" /> Upload Video File
              </Button>
              <Button className='cursor-pointer' onClick={() => setSpeechCoachMode('capturing')}>
                <Video className="mr-2 h-4 w-4" /> Capture Live Rehearsal
              </Button>
            </div>
          </div>
        );
      }

      // --- State: Upload Mode Placeholder ---
      if (speechCoachMode === 'uploading') {
        return (
          <div className="text-center p-10 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
            <h3 className="text-lg font-semibold">Upload Video</h3>
            <p className="text-slate-400 mt-2">
              Upload and analysis functionality planned for a future update.
            </p>
            <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => setSpeechCoachMode('options')}>
              Back to options
            </Button>
          </div>
        );
      }

      // --- State: Capture Mode Placeholder ---
      if (speechCoachMode === 'capturing') {
        const isAcquiring = recorderStatus === 'acquiring_media';
        const isRecording = recorderStatus === 'recording';

        return (
          <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 space-y-6">
            <h3 className="text-lg font-semibold text-center mb-4">Live Rehearsal</h3>

            {/* Hidden Canvas for Snapshots */}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            {/* Video Preview */}
            <div className="aspect-video bg-black rounded overflow-hidden mb-4 border border-slate-600">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
            </div>

            {/* Status and Timer */}
            <div className="text-center mb-4">
              {isAcquiring && <p className="text-sm text-yellow-400"><CircleDot className="inline mr-1 h-3 w-3 animate-pulse" />Requesting permissions...</p>}
              {isRecording && (
                <p className="text-lg font-semibold text-red-400">
                  <Mic className="inline mr-2 h-5 w-5 animate-pulse" /> Recording... {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')} / 01:00
                </p>
              )}
              {!isRecording && !isAcquiring && <p className="text-sm text-slate-400">Ready to record (Max 60s)</p>}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                className='cursor-pointer'
                variant="outline"
                onClick={() => setSpeechCoachMode('options')}
                disabled={isRecording || isAcquiring}
              >
                Cancel
              </Button>
              {!isRecording ? (
                <Button className='cursor-pointer' onClick={handleStartCapture} disabled={isAcquiring}>
                  <CircleDot className="mr-2 h-4 w-4" /> Start Recording
                </Button>
              ) : (
                <Button variant="destructive" className='cursor-pointer' onClick={handleStopCaptureManual}>
                  <Square className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
              )}
            </div>
          </div>
        );
      }

      // --- State: Previewing Captured Media ---
      if (speechCoachMode === 'previewing') {
        return (
          <>
            <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 space-y-6">
              <h3 className="text-lg font-semibold">Rehearsal Preview</h3>
              {capturedAudioBlobUrl && (
                <div>
                  <Label>Captured Audio:</Label>
                  <audio src={capturedAudioBlobUrl} controls className="w-full mt-1" />
                </div>
              )}
              {capturedImageSnapshots.length > 0 && (
                <div>
                  <Label>Captured Snapshots ({capturedImageSnapshots.length}):</Label>
                  <div className="flex gap-2 overflow-x-auto mt-1 p-1 bg-slate-900 rounded">
                    {capturedImageSnapshots.map((src, index) => (
                      <img key={index} src={src} alt={`Snapshot ${index + 1}`} className="h-20 w-auto rounded object-cover shrink-0" />
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full cursor-pointer" onClick={analyzeRehearsal}>
                Analyze Rehearsal
              </Button>

              <Button variant="outline" className="w-full cursor-pointer" onClick={() => setSpeechCoachMode('options')}>
                Discard and Return
              </Button>
            </div>
          </>
        );
      }

      // --- Analyzing Mode ---
      if (speechCoachMode === 'analyzing' && isAnalyzing) {
        return (
          <div className="text-center p-10 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
            <h3 className="text-lg font-semibold text-blue-400">Analyzing Rehearsal...</h3>
            <p className="text-slate-400 mt-2">
              The AI is processing your audio and images. Please wait.
            </p>
          </div>
        );
      }

      // --- Displaying Analysis Result ---
      if (speechCoachMode === 'analyzing' && !isAnalyzing && analysisResult) {
        const isErrorResult = analysisResult.startsWith("Analysis failed:") || analysisResult.startsWith("Analysis Error:");
        return (
          <div className="p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 space-y-6">
            <h3 className={`text-lg font-semibold ${isErrorResult ? 'text-red-400' : ''}`}>
              {isErrorResult ? "Analysis Problem" : "Analysis Feedback"}
            </h3>
            <div className="p-3 bg-slate-900 rounded border border-slate-700 max-h-96 overflow-y-auto">
              <pre className={`text-sm ${isErrorResult ? 'text-red-300' : 'text-slate-200'} whitespace-pre-wrap font-sans`}>
                {analysisResult}
              </pre>
            </div>
            <Button variant="outline" className="w-full cursor-pointer" onClick={() => {
              setSpeechCoachMode('options');
              setAnalysisResult(null);
              setCapturedAudioBlobUrl(null);
              setCapturedImageSnapshots([]);
            }}>
              {isErrorResult ? "Back to Options" : "Done / Record Again"}
            </Button>
          </div>
        );
      }

    }

    // AI Model is unavailable
    if (availability === 'unavailable') {
      return (
        <div className="text-center p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
          <h3 className="text-lg font-semibold text-red-400">AI Model Unavailable</h3>
          <p className="text-slate-400 mt-2">
            This browser or device is not supported, or the model failed to load.
            Please check the hardware requirements.
          </p>
        </div>
      );
    }

    // AI Model needs to be downloaded
    if (availability === 'downloadable') {
      return (
        <div className="text-center p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
          <h3 className="text-lg font-semibold text-yellow-400">AI Model Download Required</h3>
          <p className="text-slate-400 mt-2">
            To use Swa-AI, you must download the on-device AI model.
          </p>
          <Button onClick={downloadModel} className="mt-4 cursor-pointer">
            Download Model
          </Button>
        </div>
      );
    }

    // AI Model is downloading
    if (availability === 'downloading') {
      return (
        <div className="text-center p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
          <h3 className="text-lg font-semibold text-blue-400">Downloading AI Model...</h3>
          <p className="text-slate-400 mt-2">
            Please wait. This may take a few minutes.
          </p>
          <div className="w-full bg-slate-700 rounded-full h-2.5 mt-4">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-400 mt-2">{downloadProgress}% complete</p>
        </div>
      );
    }

    // Session is initializing
    if (isSessionLoading && (persona?.type === 'text' || persona?.type === 'audio' || persona?.type === 'image')) {
      return (
        <div className="text-center p-10 bg-slate-800 rounded-lg">
          <p className="text-slate-400">Initializing AI session... please wait.</p>
        </div>
      );
    }

    // Ready State (Model available, session ready or convo loaded)
    if (availability === 'available' && (persona?.type === 'text' || persona?.type === 'audio' || persona?.type === 'image')) {
      // Check if session creation failed but model is available
      if (!session && !isSessionLoading) {
        return (
          <div className="text-center p-12 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
            <h3 className="text-lg font-semibold text-red-400">Session Failed</h3>
            <p className="text-slate-400 mt-2">Could not initialize AI session. Please try refreshing.</p>
          </div>
        );
      }

      // Session is ready, display chat
      return (
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          {/* Message List */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-2 p-6 mb-6 rounded-xl bg-card/30 backdrop-blur-sm border border-border/40">
            {/* --- Placeholder for Audio/Image Personas --- */}
            {currentConvo?.messages.length === 0 && (persona.type === 'audio' || persona.type === 'image') && (
              <p className="text-center text-slate-400 py-4 italic">
                This persona works best with {persona.type}. Use the '+' button to add media or start by typing.
              </p>
            )}

            {/* Existing Message Mapping Logic */}
            {currentConvo && currentConvo.messages.length > 0 ? (
              currentConvo.messages.map((msg, index) => (
                <ChatMessage
                  key={`${currentConvo.id}-${index}-${msg.timestamp}`}
                  message={msg}
                  personaType={persona.type}
                  onRewriteClick={() => handleRewriteClick(msg, index)}
                />
              ))
            ) : (
              persona.type === 'text' && (
                <p className="text-center text-slate-400 py-4">
                  Start a new chat with {persona.name}.
                </p>
              )
            )}
          </div>

          {/* Input Box */}
          <ChatInput
            onSubmit={handleSubmitMessage}
            isLoading={isLoading}
            personaType={persona.type}
            attachedFile={attachedFile}
            onFileSelect={handleFileSelect}
          />
        </div>
      );
    }

    // Session creation failed but model is available (for text personas)
    if (availability === 'available' && !session && !isSessionLoading && (persona?.type === 'text' || persona?.type === 'audio' || persona?.type === 'image')) {
      return (
        <div className="text-center p-10 bg-slate-800 rounded-lg border border-red-900">
          <h3 className="text-lg font-semibold text-red-400">Session Failed</h3>
          <p className="text-slate-400 mt-2">
            Could not initialize the AI chat session for this persona. Please try refreshing the page or starting a new chat.
          </p>
          <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }

    // Default: Still checking availability
    return (
      <div className="text-center p-10 bg-slate-800 rounded-lg">
        <p className="text-slate-400">Checking AI model availability...</p>
      </div>
    );
  };

  // --- Main Page Render ---
  if (!persona) {
    return (
      <>
        <Navbar />
        <main className="container max-w-2xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-red-400">Persona not found</h1>
          <Button variant="link" className='cursor-pointer' asChild>
            <Link to="/">Go back to Home</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container max-w-4xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Chat with {persona.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              {persona.description}
            </p>
          </div>
          <Button
            className='cursor-pointer h-11 w-11 hover:scale-105 transition-all duration-200'
            variant="outline"
            size="icon"
            onClick={handleNewChat}
            title="Start New Chat"
          >
            <ListRestart className="h-5 w-5" />
          </Button>
        </div>

        <ConversationList conversations={pastConversations} persona={persona} />

        {renderContent()}
      </main>
      <Footer />
      <Dialog open={isRewriteDialogOpen} onOpenChange={setIsRewriteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-50">Rewrite Response</DialogTitle>
            <DialogDescription>
              Tell the AI how you want this response rewritten.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="rewrite-instruction" className="text-left text-slate-300">
                Instruction
              </Label>
              <Textarea
                id="rewrite-instruction"
                value={rewriteInstruction}
                onChange={(e) => setRewriteInstruction(e.target.value)}
                placeholder="e.g., Make it shorter, Explain like I'm 5, Use a more formal tone..."
                className="col-span-3 bg-slate-700 border-slate-600 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleConfirmRewrite}
              disabled={!rewriteInstruction.trim() || isRewriting}
            >
              {isRewriting ? "Rewriting..." : "Rewrite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
