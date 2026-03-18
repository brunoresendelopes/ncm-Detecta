
import React, { useState, useEffect } from 'react';
import { CfopConsultation, NcmData, BRAZIL_STATES } from '../types';
import { searchNcm } from '../services/geminiService';

const CFOP_DESCRIPTIONS: Record<string, string> = {
  '1102': 'Compra para comercialização (Dentro do Estado)',
  '2102': 'Compra para comercialização (De outro Estado)',
  '3102': 'Compra para comercialização (Do Exterior)',
  '1403': 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária (Dentro do Estado)',
  '2403': 'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária (De outro Estado)',
  '5102': 'Venda de mercadoria adquirida ou recebida de terceiros (Dentro do Estado)',
  '6102': 'Venda de mercadoria adquirida ou recebida de terceiros (Para outro Estado)',
  '7102': 'Venda de mercadoria adquirida ou recebida de terceiros (Para o Exterior)',
  '5403': 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto (Dentro do Estado)',
  '6403': 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituto (Para outro Estado)',
  '5405': 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária, na condição de contribuinte substituído (Dentro do Estado)',
};

const CfopConsultant: React.FC = () => {
  const [userState, setUserState] = useState(() => localStorage.getItem('user_state') || 'MG');
  const [originalCfop, setOriginalCfop] = useState('');
  const [originState, setOriginState] = useState('SP');
  const [destinationState, setDestinationState] = useState('MG');
  const [ncmQuery, setNcmQuery] = useState('');
  const [isSearchingNcm, setIsSearchingNcm] = useState(false);
  const [isStProduct, setIsStProduct] = useState(false);
  const [stAlreadyWithheld, setStAlreadyWithheld] = useState(false);
  
  const [result, setResult] = useState<CfopConsultation | null>(null);
  const [history, setHistory] = useState<CfopConsultation[]>([]);

  useEffect(() => {
    localStorage.setItem('user_state', userState);
  }, [userState]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('cfop_history_v2');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveToHistory = (consultation: CfopConsultation) => {
    const newHistory = [consultation, ...history.filter(h => h.id !== consultation.id)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('cfop_history_v2', JSON.stringify(newHistory));
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('cfop_history_v2', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cfop_history_v2');
  };

  const detectSt = (ncmData: NcmData[]): { hasSt: boolean; alerts: string[] } => {
    if (ncmData.length === 0) return { hasSt: false, alerts: [] };
    
    const primary = ncmData[0];
    const hasCest = !!primary.cest;
    const statusNote = primary.statusNote?.toLowerCase() || '';
    const description = primary.description.toLowerCase();
    
    const stKeywords = ['substituição tributária', 'st', 'icms-st', 'icms st', 'retido'];
    const hasStKeyword = stKeywords.some(k => statusNote.includes(k) || description.includes(k));
    
    const alerts: string[] = [];
    if (hasCest || hasStKeyword) {
      alerts.push(`Produto sujeito a Substituição Tributária (CEST: ${primary.cest || 'Não informado'}).`);
    }
    
    const exemptionKeywords = ['isenção', 'isento', 'redução de base', 'regime especial', 'diferimento'];
    if (exemptionKeywords.some(k => statusNote.includes(k) || description.includes(k))) {
      alerts.push("Possível isenção, redução de base ou regime especial de ICMS detectado. Verifique a legislação específica.");
    }

    return { hasSt: hasCest || hasStKeyword, alerts };
  };

  const convertCfop = (cfop: string, fromState: string, toState: string, isEntry: boolean, hasSt: boolean, stWithheld: boolean): string => {
    if (!cfop || cfop.length < 4) return '';
    const lastThree = cfop.substring(1);
    
    if (isEntry) {
      let prefix = '1';
      if (fromState === 'EX') prefix = '3';
      else if (fromState !== toState) prefix = '2';
      
      if (hasSt) {
        if (stWithheld) return prefix + '102'; // If already withheld, use normal purchase CFOP
        return prefix + '403'; // If not withheld, use ST purchase CFOP
      }
      return prefix + lastThree;
    } else {
      let prefix = '5';
      if (toState === 'EX') prefix = '7';
      else if (toState !== userState) prefix = '6';
      
      if (hasSt) {
        if (stWithheld) return prefix + '102'; // If already withheld, use normal resale CFOP
        return prefix + '403'; // If not withheld, use ST resale CFOP
      }
      return prefix + lastThree;
    }
  };

  const handleConsult = async () => {
    if (!originalCfop || originalCfop.length < 4) return;

    let hasSt = false;
    let alerts: string[] = [];
    let productDescription = '';

    try {
      if (ncmQuery.trim()) {
        setIsSearchingNcm(true);
        const ncmData = await searchNcm(ncmQuery);
        const stInfo = detectSt(ncmData);
        hasSt = stInfo.hasSt;
        alerts = stInfo.alerts;
        if (ncmData.length > 0) {
          productDescription = ncmData[0].description;
        }
        setIsStProduct(hasSt);
      } else {
        setIsStProduct(false);
      }

      const entry = convertCfop(originalCfop, originState, userState, true, hasSt, stAlreadyWithheld);
      const exit = convertCfop(originalCfop, userState, destinationState, false, hasSt, stAlreadyWithheld);
      const internalExit = convertCfop(originalCfop, userState, userState, false, hasSt, stAlreadyWithheld);

      const newConsultation: CfopConsultation = {
        id: Date.now().toString(),
        productDescription,
        ncm: ncmQuery,
        originalCfop,
        originState,
        userState,
        destinationState,
        suggestedEntryCfop: entry,
        suggestedExitCfop: exit,
        suggestedInternalExitCfop: internalExit,
        hasSt,
        alerts,
        timestamp: Date.now()
      };

      setResult(newConsultation);
      saveToHistory(newConsultation);
    } catch (error) {
      console.error("Erro na consulta de CFOP:", error);
    } finally {
      setIsSearchingNcm(false);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isAtypical = (cfop: string) => {
    const atypicalPrefixes = ['59', '69', '55', '65', '56', '66'];
    return atypicalPrefixes.some(p => cfop.startsWith(p));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <i className="fas fa-exchange-alt text-blue-600"></i> Consultor de CFOP
            </h2>
            <p className="text-slate-500 text-sm mt-1">Identifique os códigos de entrada e saída com inteligência fiscal.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Meu Estado:</span>
            <select 
              value={userState}
              onChange={(e) => setUserState(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BRAZIL_STATES.filter(s => s !== 'EX').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">CFOP da NF de Origem</label>
                <input 
                  type="text" 
                  value={originalCfop}
                  onChange={(e) => setOriginalCfop(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                  placeholder="Ex: 6102"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Estado de Origem</label>
                <select 
                  value={originState}
                  onChange={(e) => setOriginState(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {BRAZIL_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">NCM do Produto (Opcional)</label>
                <input 
                  type="text" 
                  value={ncmQuery}
                  onChange={(e) => setNcmQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                  placeholder="Ex: 8482.10.10"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Estado de Destino</label>
                <select 
                  value={destinationState}
                  onChange={(e) => setDestinationState(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  {BRAZIL_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {isStProduct && (
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-bold text-blue-900">A nota fiscal já possui ST retida pelo fornecedor (campo vICMSST preenchido)?</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setStAlreadyWithheld(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${stAlreadyWithheld ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200'}`}
                  >
                    Sim
                  </button>
                  <button 
                    onClick={() => setStAlreadyWithheld(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!stAlreadyWithheld ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200'}`}
                  >
                    Não
                  </button>
                </div>
                <p className="text-[10px] text-blue-700 leading-tight italic">
                  "Se a nota do fornecedor tiver o campo vICMSST preenchido com valor, a ST já foi recolhida por ele. Caso contrário, você é o substituto tributário."
                </p>
              </div>
            )}

            <button 
              onClick={handleConsult}
              disabled={isSearchingNcm || originalCfop.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearchingNcm ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-calculator"></i>}
              {isSearchingNcm ? 'Analisando NCM...' : 'Consultar CFOPs'}
            </button>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-center min-h-[350px]">
            {result ? (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="text-center pb-4 border-b border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resultado da Operação</p>
                  <h3 className="text-lg font-bold text-slate-900">
                    {result.productDescription || `CFOP Original: ${result.originalCfop}`}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-500 transition-all relative">
                    <button 
                      onClick={() => copyToClipboard(result.suggestedEntryCfop, 'entry')}
                      className={`absolute top-4 right-4 transition-colors ${copiedId === 'entry' ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-600'}`}
                      title="Copiar CFOP"
                    >
                      <i className={`fas ${copiedId === 'entry' ? 'fa-check' : 'fa-copy'}`}></i>
                    </button>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Entrada Sugerida</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-mono font-black text-slate-900">{result.suggestedEntryCfop}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                      {CFOP_DESCRIPTIONS[result.suggestedEntryCfop] || 'Código de entrada para comercialização.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm group hover:border-emerald-500 transition-all relative">
                      <button 
                        onClick={() => copyToClipboard(result.suggestedExitCfop, 'exit')}
                        className={`absolute top-4 right-4 transition-colors ${copiedId === 'exit' ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-600'}`}
                        title="Copiar CFOP"
                      >
                        <i className={`fas ${copiedId === 'exit' ? 'fa-check' : 'fa-copy'}`}></i>
                      </button>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Saída ({result.destinationState})</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-mono font-black text-slate-900">{result.suggestedExitCfop}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                        {CFOP_DESCRIPTIONS[result.suggestedExitCfop] || 'Código de saída para revenda.'}
                      </p>
                    </div>
                  </div>
                </div>

                {result.alerts.length > 0 && (
                  <div className="space-y-2">
                    {result.alerts.map((alert, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <i className="fas fa-exclamation-circle text-amber-600 mt-0.5"></i>
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">{alert}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <i className="fas fa-calculator text-5xl mb-4 opacity-20"></i>
                <p className="text-sm font-medium">Preencha os dados ao lado para ver as sugestões de CFOP.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de CFOP Atípico */}
      {originalCfop && isAtypical(originalCfop) && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex gap-4 items-start animate-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <i className="fas fa-exclamation-triangle text-red-600"></i>
          </div>
          <div>
            <h4 className="text-red-900 font-bold text-sm">CFOP de Origem Atípico</h4>
            <p className="text-red-800 text-xs mt-1 leading-relaxed">
              O CFOP informado ({originalCfop}) é comumente usado para remessas, devoluções ou outras operações que não são de compra para comercialização. 
              Verifique se este produto realmente se destina à revenda antes de prosseguir.
            </p>
          </div>
        </div>
      )}

      {/* Histórico Recente */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-history text-slate-400"></i> Consultas Recentes
            </h3>
            <button onClick={clearHistory} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Limpar Tudo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(item => (
              <div 
                key={item.id} 
                onClick={() => {
                  setOriginalCfop(item.originalCfop);
                  setOriginState(item.originState);
                  setDestinationState(item.destinationState);
                  setNcmQuery(item.ncm || '');
                  setResult(item);
                }}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-500 cursor-pointer transition-all group relative"
              >
                <button 
                  onClick={(e) => deleteHistoryItem(e, item.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 md:bg-white md:border-slate-200 md:text-slate-300 hover:text-red-600 hover:border-red-200 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20"
                  title="Remover"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.hasSt ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.hasSt ? 'COM ST' : 'NORMAL'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors pr-6">
                  {item.productDescription || `CFOP ${item.originalCfop}`}
                </p>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entrada</p>
                    <p className="text-xs font-mono font-bold text-slate-900">{item.suggestedEntryCfop}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saída</p>
                    <p className="text-xs font-mono font-bold text-slate-900">{item.suggestedExitCfop}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CfopConsultant;
