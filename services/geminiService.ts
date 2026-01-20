
import { GoogleGenAI, Type } from "@google/genai";
import { TOQUES, ORIXAS_GUIAS_DEFAULT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeLyrics = async (lyrics: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise a seguinte letra de música e sugira: 
      1. Qual destes toques rítmicos melhor se aplica: ${TOQUES.join(', ')}.
      2. Uma lista de instrumentos de percussão que combinam com a letra.
      3. Identifique especificamente quais Orixás ou Guias estão relacionados à letra. Considere estes comuns: ${ORIXAS_GUIAS_DEFAULT.join(', ')}, mas identifique outros se necessário.
      4. Um breve resumo do sentimento ou intenção da música.
      
      Letra: ${lyrics}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedToque: { type: Type.STRING },
            suggestedInstruments: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            orixasGuias: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Orixás ou Guias identificados"
            },
            moodSummary: { type: Type.STRING }
          },
          required: ["suggestedToque", "suggestedInstruments", "orixasGuias", "moodSummary"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
