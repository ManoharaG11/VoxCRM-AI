
import { useEffect, useRef, useState } from "react";
import "./VoiceAgent.css";

const API = "http://127.0.0.1:8000";

interface VoiceMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messageIdRef = useRef(0);
  const listeningRef = useRef(false);

  function speakText(text: string) {
    if (!("speechSynthesis" in window)) {
      setError("Voice output is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(message: string) {
    const cleanMessage = message.trim();

    if (!cleanMessage || isThinking) return;

    setError("");
    setTextInput("");
    setIsThinking(true);

    const userMessage: VoiceMessage = {
      id: ++messageIdRef.current,
      role: "user",
      text: cleanMessage,
    };

    setMessages((previous) => [...previous, userMessage]);

    try {
      const response = await fetch(`${API}/api/voice/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to connect to VoxCRM AI."
        );
      }

      const reply = String(data.reply || "").trim();

      if (!reply) {
        throw new Error("The AI assistant returned an empty response.");
      }

      const assistantMessage: VoiceMessage = {
        id: ++messageIdRef.current,
        role: "assistant",
        text: reply,
      };

      setMessages((previous) => [...previous, assistantMessage]);
      speakText(reply);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsThinking(false);
    }
  }

  useEffect(() => {
    const browserWindow = window as SpeechWindow;

    const SpeechRecognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported. Use Google Chrome or Microsoft Edge, or type your message below."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let finalText = "";
      let temporaryText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const spokenText = result[0].transcript;

        if (result.isFinal) {
          finalText += spokenText;
        } else {
          temporaryText += spokenText;
        }
      }

      if (finalText.trim()) {
        const recognizedText = finalText.trim();

        setTranscript((previous) =>
          previous
            ? `${previous} ${recognizedText}`
            : recognizedText
        );

        void sendMessage(recognizedText);
      }

      setInterimTranscript(temporaryText);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setError(
          "Microphone permission denied. Allow microphone access in your browser."
        );
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }

      listeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;
      recognition.abort();
      window.speechSynthesis.cancel();
    };
  }, []);

  function startListening() {
    if (!recognitionRef.current || listeningRef.current) return;

    setError("");
    setTranscript("");
    setInterimTranscript("");

    try {
      listeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      listeningRef.current = false;
      setIsListening(false);
      setError("Unable to start the microphone. Please try again.");
    }
  }

  function stopListening() {
    listeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  }

  function clearConversation() {
    stopListening();
    window.speechSynthesis.cancel();

    setIsSpeaking(false);
    setIsThinking(false);
    setTranscript("");
    setInterimTranscript("");
    setMessages([]);
    setError("");
    setTextInput("");
    messageIdRef.current = 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(textInput);
  }

  return (
    <div className="voice-agent-page">
      <div className="voice-agent-header">
        <div>
          <span className="voice-agent-eyebrow">
            VOXCRM INTELLIGENCE
          </span>
          <h1>AI Voice Agent</h1>
          <p>
            Talk to your CRM, understand your business data and get
            intelligent assistance.
          </p>
        </div>

        <div className="voice-agent-status">
          <span className="status-dot"></span>
          Gemini AI connected through backend
        </div>
      </div>

      <div className="voice-agent-grid">
        <section className="voice-main-card">
          <div className="voice-orb-container">
            <div
              className={`voice-orb ${
                isListening ? "listening" : ""
              } ${isSpeaking ? "speaking" : ""}`}
            >
              <span className="voice-orb-inner">
                {isListening
                  ? "🎙️"
                  : isSpeaking
                  ? "🔊"
                  : isThinking
                  ? "✦"
                  : "🎤"}
              </span>
            </div>

            <h2>
              {isListening
                ? "Listening to you..."
                : isThinking
                ? "Thinking..."
                : isSpeaking
                ? "Speaking..."
                : "Ready to assist"}
            </h2>

            <p>
              {isListening
                ? "Ask a question about your CRM."
                : isThinking
                ? "Gemini is processing your request."
                : "Start speaking or type your question below."}
            </p>
          </div>

          <div className="voice-controls">
            {!isListening ? (
              <button
                className="voice-start-button"
                onClick={startListening}
                disabled={isThinking}
              >
                🎙 Start Conversation
              </button>
            ) : (
              <button
                className="voice-stop-button"
                onClick={stopListening}
              >
                ■ Stop Listening
              </button>
            )}

            <button
              className="voice-test-button"
              onClick={() =>
                speakText(
                  "Hello! Welcome to VoxCRM AI. Your Gemini powered voice assistant is ready."
                )
              }
            >
              🔊 Test Voice
            </button>
          </div>

          <form className="voice-controls" onSubmit={handleSubmit}>
            <input
              type="text"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Ask VoxCRM AI anything..."
              disabled={isThinking}
            />
            <button
              className="voice-start-button"
              type="submit"
              disabled={isThinking || !textInput.trim()}
            >
              {isThinking ? "Thinking..." : "Send"}
            </button>
          </form>

          {error && (
            <div className="voice-error">
              {error}
            </div>
          )}

          <div className="voice-transcript">
            <div className="voice-section-heading">
              <h3>Live Transcript</h3>
              <span>{isListening ? "LIVE" : "READY"}</span>
            </div>

            <div className="transcript-content">
              {transcript || interimTranscript ? (
                <>
                  <p>{transcript}</p>
                  {interimTranscript && (
                    <p className="interim-text">
                      {interimTranscript}
                    </p>
                  )}
                </>
              ) : (
                <p className="transcript-placeholder">
                  Your recognized speech will appear here...
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="voice-chat-card">
          <div className="voice-section-heading">
            <div>
              <h3>Conversation History</h3>
              <p>Your current voice session</p>
            </div>

            <button
              className="voice-clear-button"
              onClick={clearConversation}
            >
              Clear
            </button>
          </div>

          <div className="voice-message-list">
            {messages.length === 0 ? (
              <div className="voice-empty-state">
                <span>💬</span>
                <h3>No conversation yet</h3>
                <p>
                  Ask something like "How many qualified leads do I have?"
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`voice-message ${message.role}`}
                >
                  <span className="message-role">
                    {message.role === "user" ? "You" : "VoxCRM AI"}
                  </span>
                  <p>{message.text}</p>
                </div>
              ))
            )}

            {isThinking && (
              <div className="voice-message assistant">
                <span className="message-role">VoxCRM AI</span>
                <p>Thinking...</p>
              </div>
            )}
          </div>

          <div className="voice-ai-notice">
            <span>✦</span>
            <p>
              Powered by Gemini AI. The assistant can answer questions
              using current CRM data. It does not create, update or
              delete records through voice chat.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default VoiceAgent;
