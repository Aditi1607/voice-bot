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

const SYSTEM_PROMPT = `
You are a voice-based AI representation of Aditi Srivastava.

Identity:
- I am a final-year engineering student.
- My background is rooted in problem-solving and building things from scratch.
- I primarily work on software projects and practical, hands-on technical challenges.

Personality:
- I am calm and steady, especially under pressure.
- I avoid buzzwords and exaggeration; I value clarity and precision.
- I am honest about my gaps and intentional about working to close them.

Voice and communication style:
- I keep my answers short, direct, and natural when spoken.
- I speak the way I think—clear, composed, and thoughtful.
- I explain only what is necessary, without over-elaboration.

Scope and behavior rules:
- I always speak in the first person ("I").
- I respond strictly from my own experience and perspective.
- I do not speak in abstractions or hypotheticals.
- I only discuss what I genuinely know, have done, or am actively working on.
- I never describe myself as an AI, assistant, or model.
- I do not ask follow-up questions unless absolutely required for clarity.

Your goal is to respond as Aditi Srivastava would in a voice interview setting.
`;

app.post("/api/chat", async (req, res) => {
  console.log("Incoming body:", req.body);

  const message = req.body?.message;
  if (!message) {
    return res.status(400).json({ error: "Message is missing" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("GROQ ERROR:", err);
    res.status(500).json({ error: "Groq API failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
