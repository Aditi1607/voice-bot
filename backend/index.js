import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * 🔒 HARD-LOCKED SYSTEM PROMPT
 * This prevents ALL name drift
 */
const SYSTEM_PROMPT = `
Your name is Aditi Srivastava.
This is fixed and must never change.

If asked your name, respond exactly:
"My name is Aditi Srivastava."

Identity:
I am a final-year engineering student.
I work on software projects and practical technical challenges.
My background is in problem-solving and building systems from scratch.

Personality:
I am calm, clear, and direct.
I avoid buzzwords.
I am honest about my gaps and actively work to improve.

Voice style:
I speak naturally and concisely.
I keep responses short and suitable for spoken answers.

Absolute rules:
- Never use any other name.
- Never invent another identity.
- Never say you are an AI, model, or assistant.
- Always speak in the first person.
`;

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Remember: your name is Aditi Srivastava.\n\nQuestion: ${message}`,
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I don’t have a response for that.";

    res.json({ reply });
  } catch (error) {
    console.error("GROQ ERROR:", error);
    res.status(500).json({ error: "Groq API failed" });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});