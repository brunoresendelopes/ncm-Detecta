
import { GoogleGenAI, Type } from "@google/genai";
import { NcmData, ProductClassificationInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NCM_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      code: { type: Type.STRING, description: "Código NCM formatado (ex: 8517.12.00)" },
      description: { type: Type.STRING, description: "Descrição oficial da Nomenclatura" },
      sector: { type: Type.STRING, description: "Setor comercial/industrial geral" },
      cest: { type: Type.STRING, description: "Código CEST correspondente ao NCM, se aplicável" },
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
      isObsolete: { type: Type.BOOLEAN, description: "Define se o NCM foi descontinuado ou substituído" },
      replacementCode: { type: Type.STRING, description: "Se isObsolete, indique o(s) código(s) novo(s)." },
      statusNote: { type: Type.STRING, description: "Explicação técnica da mudança ou desdobramento." },
      relevance: { type: Type.NUMBER, description: "Score de relevância de 0 a 1" }
    },
    required: ["code", "description", "taxes"]
  }
};

export const searchNcm = async (query: string): Promise<NcmData[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Atue como um Consultor Fiscal Sênior especializado em Comércio Exterior e TIPI. 
      Analise o termo ou código: "${query}". 
      
      REGRAS CRÍTICAS DE SEGURANÇA:
      1. Se o código foi EXTINTO e DESDOBRADO, retorne as novas opções individuais e marque o antigo como obsoleto.
      2. SEMPRE tente identificar o código CEST (Código Especificador da Substituição Tributária) correlacionado ao NCM.
      3. Explique detalhadamente a diferença técnica no 'statusNote'.
      4. Use como base a última atualização da TIPI e TEC de 2024/2025.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: NCM_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao buscar NCM:", error);
    return [];
  }
};

export const classifyProduct = async (input: ProductClassificationInput): Promise<NcmData[]> => {
  try {
    const prompt = `Atue como um Especialista em Classificação Tarifária (NCM) para Indústria e Comércio.
    O usuário deseja classificar um produto novo para fabricação ou revenda.
    
    DADOS DO PRODUTO:
    - NOME/NOME COMERCIAL: ${input.name}
    - COMPOSIÇÃO/MATERIAL: ${input.material}
    - APLICAÇÃO/FINALIDADE: ${input.application}
    
    REQUISITOS TÉCNICOS:
    1. Utilize as Regras Gerais de Interpretação (RGI) do Sistema Harmonizado.
    2. Apresente as 3 opções de NCM mais prováveis, da mais específica para a mais genérica.
    3. No campo 'statusNote', explique o PORQUÊ da sugestão baseando-se nas Notas de Seção ou de Capítulo.
    4. Indique obrigatoriamente as alíquotas da TIPI 2024 e o CEST provável.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: NCM_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao classificar produto:", error);
    return [];
  }
};

export const analyzeDocument = async (xmlContent?: string, nfKey?: string): Promise<NcmData[]> => {
  try {
    let prompt = "";
    
    if (xmlContent) {
      prompt = `EXTREMA PRECISÃO REQUERIDA: Analise o conteúdo XML de uma NF-e abaixo. 
      Identifique cada item (<det>) e extraia EXATAMENTE o que está nas tags <NCM> e <xProd>. 
      Para cada NCM encontrado no XML, retorne os dados fiscais atualizados (alíquotas, CEST, etc).
      
      CONTEÚDO XML:
      ${xmlContent}`;
    } else {
      prompt = `Analise a Chave de Acesso NF-e: ${nfKey}. 
      Tente identificar os produtos e NCMs vinculados a esta operação fiscal. 
      Se não houver dados públicos indexados para esta chave específica, tente deduzir os itens prováveis baseado no CNPJ emissor (se conhecido) ou no padrão da chave, mas PRIORIZE A VERDADE: se não tiver certeza, retorne os NCMs genéricos que costumam acompanhar este tipo de chave ou avise que o XML é necessário.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: NCM_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao analisar documento:", error);
    return [];
  }
};

export const checkLegislativeUpdates = async (ncms: string[]): Promise<Record<string, string>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Verifique se houve alterações recentes (Resoluções GECEX ou TIPI 2024/2025) para os seguintes NCMs: ${ncms.join(', ')}. 
      Retorne um JSON onde a chave é o NCM e o valor é uma descrição da alteração ou 'null' se não houver mudança.`,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao verificar atualizações:", error);
    return {};
  }
};
