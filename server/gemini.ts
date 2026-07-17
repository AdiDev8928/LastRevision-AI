import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will fail.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface GeneratedRevision {
  summary: string;
  keyPoints: string[];
  flashcards: { question: string; answer: string }[];
  quiz: {
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }[];
}

export async function generateRevisionMaterial(
  name: string,
  fileType: 'image' | 'document' | 'text',
  base64OrText: string
): Promise<GeneratedRevision> {
  const modelName = "gemini-3.5-flash";

  let contents: any;
  const promptText = `
You are an expert tutor and academic study coordinator specializing in rapid, high-impact, last-minute exam revisions.
The student has missed studying this topic previously and is now preparing for an exam. They need a highly efficient revision.

Please perform the following operations:
1. Read the provided study material. If it is an image, perform OCR to extract all study notes, handwritten text, equations, formulas, dates, or diagrams.
2. Produce a last-minute quick-revision pack containing:
   - "summary": An elegant, dense, highly summarized overview of the material suitable for 1-minute reading. Bullet points and bold text can be included in the summary text if helpful. Keep it concise but pack with high information density.
   - "keyPoints": A list of the most crucial core facts, formulas, terminology, or definitions that the student MUST memorize.
   - "flashcards": At least 4-6 interactive flashcards for active recall, targeting terms, mechanisms, or formula uses.
   - "quiz": At least 3-5 multiple-choice questions testing their active understanding. Provide 4 distinct options, specify the zero-based index of the correct answer, and write a helpful, reassuring explanation for immediate feedback.

Make sure all content is clear, engaging, and highly focused on aiding retention under tight exam pressures.
`;

  if (fileType === 'image' || fileType === 'document') {
    // Strip header from data URI if present (e.g. "data:image/jpeg;base64,")
    const match = base64OrText.match(/^data:([^;]+);base64,(.*)$/);
    const mimeType = match ? match[1] : (fileType === 'document' ? "application/pdf" : "image/jpeg");
    const base64Data = match ? match[2] : base64OrText;

    contents = {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: `${promptText}\n\nDocument Name: ${name}\nAnalyze the document/image above. It may contain text, images, diagrams, handwritten scribbles, or equations. Extract and synthesize everything.`,
        },
      ],
    };
  } else {
    contents = {
      parts: [
        {
          text: `${promptText}\n\nDocument Name: ${name}\n\nStudy Notes Content:\n${base64OrText}`,
        },
      ],
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A highly concise, high-impact summary suitable for rapid, last-minute revision reading.",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of critical bullet formulas, key equations, concepts, or dates.",
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "Front side of card - a short conceptual testing question." },
                  answer: { type: Type.STRING, description: "Back side of card - the exact, crisp answer." },
                },
                required: ["question", "answer"],
              },
              description: "A set of active-recall flashcards.",
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "A conceptual or factual multiple choice question." },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 options.",
                  },
                  correctAnswerIndex: { type: Type.INTEGER, description: "The correct option index (0 to 3)." },
                  explanation: { type: Type.STRING, description: "Why this answer is correct and why the others are wrong." },
                },
                required: ["question", "options", "correctAnswerIndex", "explanation"],
              },
              description: "A set of multiple choice questions.",
            },
          },
          required: ["summary", "keyPoints", "flashcards", "quiz"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    return JSON.parse(text) as GeneratedRevision;
  } catch (err: any) {
    console.error("Gemini API call failed:", err);
    throw new Error(`AI revision generation failed: ${err.message || err}`);
  }
}
