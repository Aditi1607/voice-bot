import { useEffect, useRef, useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // ---------- Auto scroll ----------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // ---------- Speech Recognition ----------
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      stopListening();
      sendMessage(text);
    };

    recognition.onerror = () => {
      stopListening();
      setError("Could not recognize speech.");
    };

    recognitionRef.current = recognition;
  }, []);

  // ---------- Text to Speech ----------
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  // ---------- Controls ----------
  const startListening = () => {
    setError("");
    setListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ---------- Backend ----------
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setThinking(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setThinking(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);

      speak(data.reply);
    } catch {
      setThinking(false);
      setError("Server unreachable.");
    }
  };

  // ---------- New Chat ----------
  const startNewChat = () => {
    speechSynthesis.cancel();
    stopListening();
    setMessages([]);
    setInput("");
    setError("");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-black to-gray-900 text-white">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
        <h1 className="font-semibold text-lg">🎙️ Personal Voice Assistant</h1>
        <button
          onClick={startNewChat}
          className="text-sm px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          New Chat
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-10">
            Click “Start Talking” or type a message to begin.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-xl px-4 py-3 rounded-lg transition-all ${
              msg.role === "user"
                ? "bg-blue-600 ml-auto"
                : "bg-gray-800 mr-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {thinking && (
          <p className="text-gray-400 italic">Assistant is thinking…</p>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* Fixed Control Bar */}
      <footer className="border-t border-gray-800 p-4 space-y-3 bg-black">
        {/* Text input */}
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded bg-gray-800 outline-none"
            placeholder="Type a question (optional)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage(input) && setInput("")
            }
          />
          <button
            onClick={() => {
              sendMessage(input);
              setInput("");
            }}
            className="px-4 bg-blue-600 rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>

        {/* Voice buttons */}
        <div className="flex justify-center gap-4">
          {!listening ? (
            <button
              onClick={startListening}
              className="px-6 py-3 rounded-full bg-green-600 hover:bg-green-700"
            >
              🎤 Start Talking
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="px-6 py-3 rounded-full bg-red-600 animate-pulse"
            >
              ⛔ Stop
            </button>
          )}
        </div>

        {/* Status */}
        <p className="text-center text-sm text-gray-400">
          {listening && "Listening…"}
          {speaking && "Assistant is speaking…"}
          {error && <span className="text-red-400">{error}</span>}
        </p>
      </footer>
    </div>
  );
}
