
import { GoogleGenAI, Type } from "@google/genai";
import { NcmData } from "../types";

// Initialize the Gemini API client using the environment variable directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NCM_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      code: { type: Type.STRING, description: "Código NCM formatado (ex: 8517.12.00)" },
      description: { type: Type.STRING, description: "Descrição oficial da Nomenclatura" },
      sector: { type: Type.STRING, description: "Setor comercial/industrial geral" },
      taxes: {
        type: Type.OBJECT,
        properties: {
          ii: { type: Type.STRING, description: "Alíquota Imposto de Importação (%)" },
          ipi: { type: Type.STRING, description: "Alíquota IPI (%)" },
          pis: { type: Type.STRING, description: "Alíquota PIS (%)" },
          cofins: { type: Type.STRING, description: "Alíquota COFINS (%)" },
          icms_avg: { type: Type.STRING, description: "Média estimada ICMS (%)" }
        },
        required: ["ii", "ipi", "pis", "cofins", "icms_avg"]
      },
      restrictions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Eventuais restrições ou licenças de importação"
      },
      relevance: { type: Type.NUMBER, description: "Score de relevância de 0 a 1" }
    },
    required: ["code", "description", "taxes"]
  }
};

export const searchNcm = async (query: string): Promise<NcmData[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Atue como um especialista fiscal brasileiro. Busque o código NCM (ou uma lista de códigos relevantes) para a consulta: "${query}". 
      Considere sinônimos, termos coloquiais e possíveis erros de digitação. 
      Retorne os dados formatados exatamente de acordo com a tabela oficial da Receita Federal e TEC (Tarifa Externa Comum).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: NCM_SCHEMA as any,
      },
    });

    // Access the text property directly without calling it as a function.
    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("Erro ao buscar NCM:", error);
    return [];
  }
};

export const getNcmByCode = async (code: string): Promise<NcmData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Forneça os detalhes completos do NCM "${code}". Inclua alíquotas de II, IPI, PIS, COFINS e a descrição oficial completa.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY, // We use array but expect 1 item
          items: (NCM_SCHEMA as any).items
        } as any,
      },
    });

    // Access the text property directly without calling it as a function.
    const results = JSON.parse(response.text || "[]");
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("Erro ao obter detalhes do NCM:", error);
    return null;
  }
};
