import { useEffect, useRef, useState } from "react";

export default function App() {
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const [status, setStatus] = useState("Idle");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Use Chrome or Edge for voice support.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
      setStatus("Listening...");
      setCaption("");
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
    };

    recognition.onerror = () => {
      isRecognizingRef.current = false;
      setListening(false);
      setStatus("Mic error");
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setCaption(`You: ${transcript}`);
      setStatus("Thinking...");

      const res = await fetch("https://voice-bot-backend-k4dq.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript }),
      });

      const data = await res.json();
      speak(data.reply);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    setSpeaking(true);
    setStatus("Speaking...");
    setCaption(`Assistant: ${text}`);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;

    utterance.onend = () => {
      setSpeaking(false);
      setStatus("Idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  const startTalking = () => {
    if (isRecognizingRef.current || speaking) return;
    recognitionRef.current.start();
  };

  const stopTalking = () => {
    if (isRecognizingRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
    isRecognizingRef.current = false;
    setListening(false);
    setSpeaking(false);
    setStatus("Idle");
  };

  const newSession = () => {
    stopTalking();
    setCaption("");
    setStatus("New session started");

    // ✅ Audio works here because user clicked
    speak("Hi. You can start talking whenever you're ready.");
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎙️ Personal Voice Assistant</h1>
        <button className="session-btn" onClick={newSession}>
          New Session
        </button>
      </header>

      <main className="main">
        <div className="status">
          {status === "Idle"
            ? "Click Start Talking to begin"
            : status}
        </div>

        {(listening || speaking) && (
          <div className="waveform">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`bar animate`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {caption && <div className="caption">{caption}</div>}

        <div className="controls">
          <button className="mic green" onClick={startTalking}>
            Start Talking
          </button>
          <button className="mic red" onClick={stopTalking}>
            Stop
          </button>
        </div>
      </main>
    </div>
  );
}