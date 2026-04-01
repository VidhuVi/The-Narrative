/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface ExtractedData {
  summary: string;
  decisions: { text: string; category: string }[];
  actionItems: { responsible: string; task: string; dueDate: string }[];
  sentiment: {
    overall: number; // 0-100
    segments: { time: string; sentiment: string; text: string; speaker: string }[];
  };
  speakers: string[];
  title: string;
}

export const geminiService = {
  async extractIntelligence(transcript: string): Promise<ExtractedData> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following meeting transcript and extract:
      1. A concise executive summary.
      2. Key decisions made.
      3. Action items with responsible person and due date (if mentioned).
      4. Sentiment analysis (overall score 0-100 and segment-level analysis including the speaker name for each segment).
      5. List of speakers.
      6. A descriptive title for the meeting.

      Transcript:
      ${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            speakers: { type: Type.ARRAY, items: { type: Type.STRING } },
            decisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["text", "category"]
              }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  responsible: { type: Type.STRING },
                  task: { type: Type.STRING },
                  dueDate: { type: Type.STRING }
                },
                required: ["responsible", "task"]
              }
            },
            sentiment: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.NUMBER },
                segments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      sentiment: { type: Type.STRING, enum: ["Agreement", "Neutral", "Conflict"] },
                      text: { type: Type.STRING },
                      speaker: { type: Type.STRING }
                    },
                    required: ["time", "sentiment", "text", "speaker"]
                  }
                }
              },
              required: ["overall", "segments"]
            }
          },
          required: ["title", "summary", "speakers", "decisions", "actionItems", "sentiment"]
        }
      }
    });

    return JSON.parse(response.text);
  },

  async chatWithTranscripts(query: string, transcripts: { title: string; content: string }[]): Promise<string> {
    const context = transcripts.map(t => `Meeting: ${t.title}\nContent: ${t.content}`).join("\n\n---\n\n");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `You are an AI assistant for "The Narrative", an editorial intelligence hub. 
      Answer the user's question explicitly based on the following meeting transcripts. 
      
      CRITICAL INSTRUCTION: You must ALWAYS cite your sources using exact verbatim quotes from the part of the transcript your answer came from.
      Format citations cleanly, for example:
      "According to the [Meeting Title]: > 'insert exact transcript quote here'"
      
      Context:
      ${context}
      
      Question: ${query}`,
    });
    return response.text;
  }
};
