// src/pages/ChatPage.tsx
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { usePersonas } from '@/hooks/usePersonas';
import { getPrebuiltPersona, PREBUILT_PERSONAS } from '@/lib/prebuilt-personas';
import { useLanguageModel } from '@/hooks/useLanguageModel';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { toast } from "sonner";
import { CircleDot, ListRestart, Mic, Square, Upload, Video } from 'lucide-react'; // Icon for new chat button
import type { Conversation, Message, Persona } from '@/lib/types';
import { ConversationList } from '@/components/chat/ConversationList';
import { useReactMediaRecorder } from "react-media-recorder";
import { Label } from '@/components/ui/label';
import { dataUrlToBlob } from '@/lib/utils';

interface ChatSession {
  promptStreaming: (prompt: string | { role: string; content: any }[]) => Promise<ReadableStream<string>>;
  destroy: () => void; // Add destroy method
  // Add other session methods if needed
}

export default function ChatPage() {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    getPersona,
    personaExists, // <-- New
    addPersona,    // <-- New
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
  const [isLoading, setIsLoading] = useState(false); // Loading AI response
  const [isSessionLoading, setIsSessionLoading] = useState(false); // Loading the session itself
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Add State for Speech Coach UI ---
  type SpeechCoachMode = 'options' | 'uploading' | 'capturing' | 'previewing' | 'analyzing';
  const [speechCoachMode, setSpeechCoachMode] = useState<SpeechCoachMode>('options');
  const [capturedAudioBlobUrl, setCapturedAudioBlobUrl] = useState<string | null>(null);
  const [capturedImageSnapshots, setCapturedImageSnapshots] = useState<string[]>([]); 
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null); 
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // --- Refs for video and canvas ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Ref for interval timer
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Ref for stop timer


  // --- Media Recorder Hook ---
  const {
    status: recorderStatus, // 'idle', 'recording', 'stopped', 'acquiring_media'
    startRecording,
    stopRecording,
    mediaBlobUrl, // URL available after stopRecording
    previewStream, // Live stream for the video preview
  } = useReactMediaRecorder({
    video: true,
    audio: true,
    onStop: (blobUrl, blob) => {
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
      setElapsedTime(0); // Reset timer when not recording
    }
    return () => {
      if (interval) clearInterval(interval); // Cleanup interval
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


  // --- Effect 1: Load Conversation Data ---
  useEffect(() => {
    // Determine the conversation to load based on URL query param
    const loadedConvo = convoId ? getConversation(convoId) : null;
    
    // Validate if the loaded convo belongs to the current persona
    if (loadedConvo && loadedConvo.personaId !== personaId) {
      // If mismatch, clear convoId from URL and state
      setCurrentConvo(null);
      navigate(`/chat/${personaId}`, { replace: true }); 
    } else {
      setCurrentConvo(loadedConvo || null); // Load convo or set to null if starting fresh
    }
  }, [personaId, convoId, getConversation, navigate]); // Dependencies related to identifying the conversation


  // --- Effect 2: Manage AI Session Lifecycle ---
  useEffect(() => {
    // Only proceed if we have a persona and it's a text type
    if (!persona || persona.type !== 'text') {
       // If session exists, destroy it when switching to non-text persona or leaving page
       if (session) {
          // TODO: Implement actual session destruction/cancellation if API allows
          console.log("Destroying session (placeholder) due to persona change/unmount.");
          setSession(null); 
       }
       return; 
    }

    // Initialize session only if model is ready AND no session exists yet
    if (availability === 'available' && !session && !isSessionLoading) {
      setIsSessionLoading(true);
      const loadingToastId = toast.loading("Initializing AI session...");

      // Pass history ONLY if we have a current conversation loaded
      const initialMessages = currentConvo?.messages.map(m => ({ role: m.role, content: m.content })) || [];

      createChatSession(persona.systemPrompt, initialMessages)
        .then(newSession => {
          setSession(newSession); // Set the session state
          toast.success("AI session initialized!", { id: loadingToastId });
        })
        .catch(e => {
          console.error("Session creation failed:", e);
          toast.error("Failed to create AI session.", { id: loadingToastId });
          // Optionally set an error state here
        })
        .finally(() => {
          setIsSessionLoading(false); // Ensure loading state is turned off
        });
    }

    // Cleanup function for THIS effect
    return () => {
      // Intentionally left blank for now. 
      // We destroy the session when personaId/convoId changes (handled by the effect re-running)
      // or when the component unmounts (implicitly handled).
      // Adding session?.destroy() here caused the loop.
    };
    // Dependencies: Re-run ONLY when these specific things change.
  }, [persona, availability, session, isSessionLoading, currentConvo, createChatSession]);

   // --- Update createChatSession signature in useLanguageModel ---
   // We need to modify the hook to accept history
   // This will require modifying `src/hooks/useLanguageModel.ts` (see Step 4 below)

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentConvo?.messages]); // Scroll when messages change


  // --- NEW: Analyze Rehearsal Function ---
  const analyzeRehearsal = useCallback(async () => {
    if (!persona || !capturedAudioBlobUrl || capturedImageSnapshots.length === 0) {
      toast.error("Missing audio or image data for analysis.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null); // Clear previous results
    setSpeechCoachMode('analyzing'); // Update UI mode
    const loadingToastId = toast.loading("Analyzing rehearsal...");

    let session: any = null; // Use 'any' for now

    try {
      // 1. Prepare Media Data
      // Fetch the audio Blob
      const audioResponse = await fetch(capturedAudioBlobUrl);
      const audioBlob = await audioResponse.blob();

      // Convert image data URLs to Blobs
      const imageBlobs = await Promise.all(
        capturedImageSnapshots.map(dataUrl => dataUrlToBlob(dataUrl))
      );
      const validImageBlobs = imageBlobs.filter(blob => blob !== null) as Blob[];

      if (!audioBlob || validImageBlobs.length === 0) {
        throw new Error("Failed to prepare media Blobs.");
      }
      console.log(`Prepared ${validImageBlobs.length} image Blobs and 1 audio Blob.`);

      // 2. Create Multimodal Session
      session = await createMultimodalSession(
        persona.systemPrompt, // Use the Speech Coach's system prompt
        [ // Define expected inputs
          { type: 'audio' },
          { type: 'image' }, // Can list image multiple times if needed, or once is fine
          { type: 'text' } // For our final text prompt
        ]
      );

      // 3. Construct the Multimodal Prompt Array
      const multimodalPrompt = [
        { role: 'user', content: [{ type: 'audio', value: audioBlob }] },
        // Add each image blob
        ...validImageBlobs.map(imgBlob => ({ role: 'user', content: [{ type: 'image', value: imgBlob }] })),
        // Add the final text prompt instructing the AI
        { role: 'user', content: [{ type: 'text', value: "Analyze the provided audio recording and image snapshots based on your system prompt instructions. Provide constructive feedback." }] }
      ];
      console.log("Sending multimodal prompt structure:", multimodalPrompt);


      // 4. Call the AI (non-streaming for simplicity)
      // Note: The API might expect a different structure - check docs if this fails
      const result = await session.prompt(multimodalPrompt);

      console.log("Analysis Result:", result);
      setAnalysisResult(result);
      toast.success("Analysis complete!", { id: loadingToastId });

    } catch (error: any) {
      console.error("Error during analysis:", error);
      toast.error(`Analysis failed: ${error.message || 'Unknown error'}`, { id: loadingToastId });
      setSpeechCoachMode('previewing'); // Go back to preview on error
    } finally {
      setIsAnalyzing(false);
      session?.destroy(); // Clean up the session
    }
  }, [
      persona, capturedAudioBlobUrl, capturedImageSnapshots,
      createMultimodalSession, setSpeechCoachMode // Add dependencies
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
        // Destroy current session before navigating
        session?.destroy(); 
        setSession(null);
        setCurrentConvo(null);
        navigate(`/chat/${personaId}`); // Navigate to base URL to start fresh
     }
  };

  // --- Handle User Message Submission ---
  const handleSubmitMessage = useCallback(async (userInput: string) => {
    if (!session || !persona) {
      toast.error("Session not ready.");
      return;
    }

    const newUserMessage: Message = { role: 'user', content: userInput, timestamp: Date.now() };
    
    let convoToUpdate: Conversation;
    let isNewConversation = false;

    // If no current convo, create one
    if (!currentConvo) {
      convoToUpdate = createNewConversation(persona.id, newUserMessage);
      isNewConversation = true;

      navigate(`/chat/${persona.id}?convo=${convoToUpdate.id}`, { replace: true });
      
      // --- FIX: Save Pre-built Persona on First *Actual* Use ---
      const isPrebuilt = PREBUILT_PERSONAS.some(p => p.id === persona.id);
      // Check if it's prebuilt AND doesn't already exist in the custom list
      if (isPrebuilt && !personaExists(persona.id)) {
         console.log(`Adding pre-built persona ${persona.name} to custom list.`);
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
    
    setCurrentConvo(convoToUpdate); // Update UI immediately
    setIsLoading(true);

    // --- Suggestion 1: Generate Title for New Convo ---
    let accumulatedResponse = "";

    try {
      // Pass only the new user message to promptStreaming (history is already in the session)
      const stream = await session.promptStreaming(userInput); 

      for await (const chunk of stream) {
        accumulatedResponse += chunk;
        setCurrentConvo(prev => {
           if (!prev) return null; // Should not happen
           const updatedMessages = [...prev.messages];
           const lastMsgIndex = updatedMessages.length - 1;
           const lastMsg = { ...updatedMessages[lastMsgIndex] };

           let currentContent = lastMsg.content;
           let cleanedChunk = chunk;

           // Simple stutter removal (can be improved)
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
           lastMsg.timestamp = Date.now(); // Update timestamp as content arrives

           updatedMessages[lastMsgIndex] = lastMsg;
           return { ...prev, messages: updatedMessages };
        });
      }

    } catch (e) {
      console.error(e);
      toast.error("An error occurred generating response.");
      // Rollback placeholder message
      setCurrentConvo(prev => {
          if (!prev) return null;
          return {...prev, messages: prev.messages.slice(0, -1)}
      });
    } finally {
      setIsLoading(false);
      let finalTitle = currentConvo?.title || "New Chat";
      let finalContent = accumulatedResponse;

      // --- Title Extraction Logic ---
      const titleMatch = accumulatedResponse.match(/^TITLE:\s*(.*)\n/i);
      if (titleMatch && titleMatch[1]) {
        const extractedTitle = titleMatch[1].trim();
        // Only update title if it's not the default "New Chat" or if we generated a new one
        if (extractedTitle && (currentConvo?.title === "New Chat" || isNewConversation)) {
           finalTitle = extractedTitle;
           toast.info(`Story title suggested: "${finalTitle}"`);
           // Remove the TITLE: line from the content displayed to the user
          //  finalContent = accumulatedResponse.substring(titleMatch[0].length).trimStart();
        }
      }


      if (isNewConversation && finalTitle === "New Chat") {
        finalTitle = await generateTitle(userInput, finalContent); // Use finalContent here
        toast.info(`Chat title set to: "${finalTitle}"`);
      }
      // Final update to state and localStorage
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
            title: finalTitle, // <-- Set the final title
            messages: finalMessages,
            lastEdited: Date.now()
        };
        saveConversation(finalConvo); // Save with title and cleaned message
        return finalConvo;
      });

    }
  }, [session, persona, currentConvo, createNewConversation, saveConversation, navigate, generateTitle, addPersona, personaExists]);


  // --- Render Logic ---
   const renderContent = () => {
    // --- Speech Coach UI Logic ---
    if (persona?.type === 'speechcoach') {
      // --- State: Showing Initial Options ---
      if (speechCoachMode === 'options') {
        return (
          <div className="text-center p-6 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
            <h3 className="text-lg font-semibold">Prepare Your Rehearsal</h3>
            <p className="text-sm text-slate-400">
              How would you like to provide your speech recording?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Button onClick={() => setSpeechCoachMode('uploading')}>
                <Upload className="mr-2 h-4 w-4" /> Upload Video File
              </Button>
              <Button onClick={() => setSpeechCoachMode('capturing')}>
                <Video className="mr-2 h-4 w-4" /> Capture Live Rehearsal
              </Button>
            </div>
          </div>
        );
      }

      // --- State: Upload Mode Placeholder ---
      if (speechCoachMode === 'uploading') {
        // We will build the file input logic later
        return (
          <div className="text-center p-10 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold">Upload Video</h3>
            <p className="text-slate-400 mt-2">
              (File input UI coming soon...)
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setSpeechCoachMode('options')}>
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
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-center mb-4">Live Rehearsal</h3>

            {/* Hidden Canvas for Snapshots */}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            {/* Video Preview */}
            <div className="aspect-video bg-black rounded overflow-hidden mb-4 border border-slate-600">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
            </div>

            {/* Status and Timer */}
            <div className="text-center mb-4">
              {isAcquiring && <p className="text-sm text-yellow-400"><CircleDot className="inline mr-1 h-3 w-3 animate-pulse"/>Requesting permissions...</p>}
              {isRecording && (
                 <p className="text-lg font-semibold text-red-400">
                   <Mic className="inline mr-2 h-5 w-5 animate-pulse"/> Recording... {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')} / 01:00
                 </p>
              )}
               {!isRecording && !isAcquiring && <p className="text-sm text-slate-400">Ready to record (Max 60s)</p>}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSpeechCoachMode('options')}
                disabled={isRecording || isAcquiring}
              >
                Cancel
              </Button>
              {!isRecording ? (
                <Button onClick={handleStartCapture} disabled={isAcquiring}>
                  <CircleDot className="mr-2 h-4 w-4" /> Start Recording
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleStopCaptureManual}>
                  <Square className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
              )}
            </div>
          </div>
        );
      } // --- End Capture Mode ---

      // --- State: Previewing Captured Media ---
       if (speechCoachMode === 'previewing') {
         return (
         <>
           <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
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
              {/* TODO: Add Analyze Button - We'll wire this up on Day 5 */}
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

       // --- NEW: Analyzing Mode ---
      if (speechCoachMode === 'analyzing' && isAnalyzing) {
         return (
           <div className="text-center p-10 bg-slate-800 rounded-lg border border-slate-700">
             <h3 className="text-lg font-semibold text-blue-400">Analyzing Rehearsal...</h3>
             <p className="text-slate-400 mt-2">
               The AI is processing your audio and images. Please wait.
             </p>
             {/* Optional: Add a spinner icon here */}
           </div>
         );
      } // --- End Analyzing ---

      // --- NEW: Displaying Analysis Result ---
      if (speechCoachMode === 'analyzing' && !isAnalyzing && analysisResult) {
         return (
           <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
             <h3 className="text-lg font-semibold">Analysis Feedback</h3>
             <div className="p-3 bg-slate-900 rounded border border-slate-700 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans">
                  {analysisResult}
                </pre>
             </div>
             <Button variant="outline" className="w-full cursor-pointer" onClick={() => {
                 setSpeechCoachMode('options');
                 setAnalysisResult(null); // Clear result
                 setCapturedAudioBlobUrl(null);
                 setCapturedImageSnapshots([]);
             }}>
                 Done / Record Again
             </Button>
           </div>
         );
      }

    }

    // B. AI Model is unavailable
    if (availability === 'unavailable') {
      return (
        <div className="text-center p-10 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-red-400">AI Model Unavailable</h3>
          <p className="text-slate-400 mt-2">
            This browser or device is not supported, or the model failed to load.
            Please check the hardware requirements.
          </p>
        </div>
      );
    }

    // C. AI Model needs to be downloaded
    if (availability === 'downloadable') {
      return (
        <div className="text-center p-10 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400">AI Model Download Required</h3>
          <p className="text-slate-400 mt-2">
            To use Swa-AI, you must download the on-device AI model (approx. 300MB).
          </p>
          <Button onClick={downloadModel} className="mt-4">
            Download Model
          </Button>
        </div>
      );
    }
    
    // D. AI Model is downloading
    if (availability === 'downloading') {
       return (
        <div className="text-center p-10 bg-slate-800 rounded-lg">
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
    if (isSessionLoading) {
       return (
        <div className="text-center p-10 bg-slate-800 rounded-lg">
          <p className="text-slate-400">Initializing AI session... please wait.</p>
        </div>
      );
    }
    
    // Ready State (Model available, session ready or convo loaded)
    if (availability === 'available' && persona?.type === 'text') {
       // Check if session creation failed but model is available
       if (!session && !isSessionLoading) {
           return (
            <div className="text-center p-10 bg-slate-800 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400">Session Failed</h3>
              <p className="text-slate-400 mt-2">Could not initialize AI session. Please try refreshing.</p>
            </div>
          );
       }
      
      // Session is ready, display chat
      return (
        <div className="flex flex-col h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
          {/* Message List */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-1 p-4 mb-4 rounded-lg bg-slate-800/30 border border-slate-700">
            {currentConvo && currentConvo.messages.length > 0 ? (
              currentConvo.messages.map((msg, index) => <ChatMessage key={`${currentConvo.id}-${index}-${msg.timestamp}`} message={msg} />)
            ) : (
              <p className="text-center text-slate-400 py-4">
                Start a new chat with {persona.name}.
              </p>
            )}
          </div>
          
          {/* Input Box */}
          <ChatInput onSubmit={handleSubmitMessage} isLoading={isLoading} />
        </div>
      );
    }

    // Session creation failed but model is available (for text personas)
    if (availability === 'available' && !session && !isSessionLoading && persona?.type === 'text') {
       return (
        <div className="text-center p-10 bg-slate-800 rounded-lg border border-red-900">
          <h3 className="text-lg font-semibold text-red-400">Session Failed</h3>
          <p className="text-slate-400 mt-2">
            Could not initialize the AI chat session for this persona. Please try refreshing the page or starting a new chat.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
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
        <main className="container mx-auto max-w-2xl p-4 text-center py-8">
          <h1 className="text-2xl font-bold text-red-400">Persona not found</h1>
          <Button variant="link" asChild>
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
      <main className="container mx-auto max-w-4xl p-4 py-8">
        <div className="flex justify-between items-center mb-2"> {/* Reduced margin */}
          <h1 className="text-3xl font-bold">
            Chat with {persona.name}
          </h1>
          <Button variant="outline" size="icon" onClick={handleNewChat} title="Start New Chat">
             <ListRestart className="h-4 w-4" />
          </Button>
        </div>
        
        {/* --- ADD CONVERSATION LIST HERE --- */}
        <ConversationList conversations={pastConversations} persona={persona} />
        
        {renderContent()} {/* This contains the main chat UI */}
      </main>
      <Footer />
    </>
  );
}
