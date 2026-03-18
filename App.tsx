
import React, { useState, useEffect } from 'react';
import { NcmData, SearchHistory, ViewMode } from './types';
import { searchNcm, checkLegislativeUpdates } from './services/geminiService';
import NcmCard from './components/NcmCard';
import TaxCalculator from './components/TaxCalculator';
import FiscalTools from './components/FiscalTools';
import CfopConsultant from './components/CfopConsultant';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NcmData[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>(ViewMode.SEARCH);
  const [selectedNcm, setSelectedNcm] = useState<NcmData | null>(null);
  const [favorites, setFavorites] = useState<NcmData[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Persistence
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('ncm_favorites');
      const savedHistory = localStorage.getItem('ncm_history');
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (err) {
      console.warn('Não foi possível carregar dados salvos:', err);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('ncm_favorites', JSON.stringify(favorites));
    } catch (err) {
      console.warn('Não foi possível salvar favoritos:', err);
    }
  }, [favorites, initialized]);

  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('ncm_history', JSON.stringify(history));
    } catch (err) {
      console.warn('Não foi possível salvar histórico:', err);
    }
  }, [history, initialized]);

  // Executa a busca — usada internamente por ambos os handlers
  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setView(ViewMode.SEARCH);

    try {
      const newHistory = [
        { query: searchTerm, timestamp: Date.now() },
        ...history.filter(h => h.query !== searchTerm)
      ].slice(0, 10);
      setHistory(newHistory);

      const data = await searchNcm(searchTerm);
      setResults(data);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler do formulário (chamado pelo onSubmit do <form>)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleFiscalResults = (data: NcmData[]) => {
    setResults(data);
    setView(ViewMode.SEARCH);
  };

  const checkUpdates = async () => {
    if (favorites.length === 0) return;
    setIsCheckingUpdates(true);
    const codes = favorites.map(f => f.code);
    const newUpdates = await checkLegislativeUpdates(codes);
    setUpdates(newUpdates);
    setIsCheckingUpdates(false);
  };

  const toggleFavorite = (e: React.MouseEvent, ncm: NcmData) => {
    e.stopPropagation();
    const isFav = favorites.some(f => f.code === ncm.code);
    if (isFav) {
      setFavorites(favorites.filter(f => f.code !== ncm.code));
    } else {
      setFavorites([...favorites, ncm]);
    }
  };

  const handleSelectNcm = (ncm: NcmData) => {
    setSelectedNcm(ncm);
    setView(ViewMode.DETAILS);
  };

  const clearHistory = () => {
    setHistory([]);
    // localStorage é atualizado automaticamente pelo useEffect
  };

  const deleteHistoryItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newHistory = [...history];
    newHistory.splice(index, 1);
    setHistory(newHistory);
    // localStorage é atualizado automaticamente pelo useEffect
  };

  const resetApp = () => {
    setQuery('');
    setResults([]);
    setView(ViewMode.SEARCH);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 md:p-6 flex flex-row md:flex-col shrink-0 border-b md:border-r border-slate-800 z-20 overflow-x-auto md:overflow-x-visible no-scrollbar">
        <div onClick={resetApp} className="mb-0 md:mb-8 group cursor-pointer shrink-0 flex items-center md:block mr-4 md:mr-0">
          <div className="relative overflow-hidden rounded-lg bg-white p-1 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg w-10 h-10 md:w-full md:h-auto">
            <img src="https://static.wixstatic.com/media/b51f66_1df9a8c2938844ecb9b434875a6f5c2c~mv2.jpg/v1/fill/w_448,h_282,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logomarca%20-%20Gravelux%20-%20letra%20Azul.jpg" alt="Gravelux Logo" className="w-full h-full md:h-auto object-contain rounded" />
          </div>
          <div className="hidden md:flex mt-3 items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Inteligência Fiscal</span>
          </div>
        </div>

        <ul className="flex flex-row md:flex-col gap-2 flex-grow">
          <li className="shrink-0">
            <button onClick={() => setView(ViewMode.SEARCH)} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors font-bold text-xs md:text-sm whitespace-nowrap ${view === ViewMode.SEARCH ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
              <i className="fas fa-search"></i> <span className="md:inline">Consulta</span>
            </button>
          </li>
          <li className="shrink-0">
            <button onClick={() => setView(ViewMode.TOOLS)} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors font-bold text-xs md:text-sm whitespace-nowrap ${view === ViewMode.TOOLS ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'hover:bg-slate-800'}`}>
              <i className="fas fa-wand-magic-sparkles"></i> <span className="md:inline">Classificador</span>
            </button>
          </li>
          <li className="shrink-0">
            <button onClick={() => setView(ViewMode.CFOP)} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors font-bold text-xs md:text-sm whitespace-nowrap ${view === ViewMode.CFOP ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}>
              <i className="fas fa-exchange-alt"></i> <span className="md:inline">CFOP</span>
            </button>
          </li>
          <li className="shrink-0">
            <button onClick={() => setView(ViewMode.FAVORITES)} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors font-bold text-xs md:text-sm whitespace-nowrap ${view === ViewMode.FAVORITES ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}>
              <i className="fas fa-star"></i> <span className="md:inline">Favoritos</span>
            </button>
          </li>
          <li className="shrink-0">
            <button onClick={() => setView(ViewMode.HISTORY)} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors font-bold text-xs md:text-sm whitespace-nowrap ${view === ViewMode.HISTORY ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}>
              <i className="fas fa-history"></i> <span className="md:inline">Histórico</span>
            </button>
          </li>
        </ul>

        {/* Disclaimer na Sidebar - Escondido no mobile para economizar espaço */}
        <div className="hidden md:block mt-auto space-y-4">
          <div className="p-4 bg-blue-600/10 rounded-xl border border-blue-600/20">
            <p className="text-[9px] text-blue-400 uppercase font-bold tracking-wider mb-2">Dica de App</p>
            <p className="text-[10px] text-blue-200 leading-tight">
              Para usar em tela cheia no celular, toque em "Compartilhar" e selecione "Adicionar à Tela de Início".
            </p>
          </div>
          
          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-2">Aviso Legal</p>
            <p className="text-[10px] text-slate-400 leading-tight">
              As informações apresentadas têm caráter informativo. Recomendamos validar a classificação definitiva com seu contador ou nos canais oficiais.
            </p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-10 overflow-y-auto md:max-h-screen">
        {view !== ViewMode.TOOLS && view !== ViewMode.CFOP && view !== ViewMode.DETAILS && (
          <header className="mb-8 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="relative group z-30">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite o código ou descrição..."
                className="w-full pl-10 md:pl-12 pr-16 md:pr-36 py-4 md:py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 outline-none text-base md:text-lg text-slate-900"
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg md:text-xl"></i>
              <button type="submit" disabled={loading} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-8 py-2 md:py-2.5 rounded-xl transition-colors font-bold disabled:opacity-50 z-40">
                {loading ? <i className="fas fa-sync fa-spin"></i> : <><i className="fas fa-arrow-right md:hidden"></i><span className="hidden md:inline">Consultar</span></>}
              </button>
            </form>
          </header>
        )}

        <div className="max-w-7xl mx-auto pb-20">
          {view === ViewMode.TOOLS && (
            <FiscalTools onResults={handleFiscalResults} />
          )}

          {view === ViewMode.CFOP && (
            <CfopConsultant />
          )}

          {view === ViewMode.SEARCH && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-600">Consultando base de dados fiscal...</p>
                <p className="text-xs mt-1">Verificando TEC, TIPI, CEST e Resoluções GECEX</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {results.map(ncm => (
                  <NcmCard key={ncm.code} ncm={ncm} onSelect={handleSelectNcm} isFavorite={favorites.some(f => f.code === ncm.code)} onToggleFavorite={toggleFavorite} />
                ))}
                {results.length === 0 && query && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <i className="fas fa-box-open text-slate-100 text-7xl mb-4"></i>
                    <p className="text-slate-400 font-medium">Nenhum resultado encontrado para "{query}".</p>
                    <button onClick={() => setView(ViewMode.TOOLS)} className="mt-4 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:underline">Tente usar o Classificador Guiado</button>
                  </div>
                )}
              </div>
            )
          )}

          {view === ViewMode.DETAILS && selectedNcm && (
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              {/* Header de Detalhes */}
              <div className={`${selectedNcm.isObsolete ? 'bg-red-900' : 'bg-slate-900'} p-8 text-white relative`}>
                <button onClick={() => setView(ViewMode.SEARCH)} className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors">
                  <i className="fas fa-arrow-left text-xl"></i>
                </button>
                <div className="mt-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className={`text-4xl font-mono font-black tracking-tight ${selectedNcm.isObsolete ? 'text-red-400 line-through opacity-80' : 'text-blue-400'}`}>
                        {selectedNcm.code}
                      </h1>
                      <div className="flex gap-2 mt-2">
                        {selectedNcm.isObsolete && (
                          <div className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest w-fit">
                            NCM Inativo / Substituído
                          </div>
                        )}
                        {selectedNcm.cest && (
                          <div className="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest w-fit">
                            CEST: {selectedNcm.cest}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={(e) => toggleFavorite(e, selectedNcm)} className={`text-3xl ${favorites.some(f => f.code === selectedNcm.code) ? 'text-amber-400' : 'text-slate-700'}`}>
                      <i className="fas fa-star"></i>
                    </button>
                  </div>
                  <p className="mt-6 text-slate-300 text-lg leading-relaxed font-medium">{selectedNcm.description}</p>
                </div>
              </div>

              {/* Seção Principal de Detalhes */}
              <div className="p-8 space-y-10">
                {/* Alerta Fiscal de Obsoleto */}
                {selectedNcm.isObsolete && (
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 flex gap-5">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                      <i className="fas fa-triangle-exclamation text-amber-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-amber-900 text-lg uppercase tracking-tight">Mudança na Nomenclatura</h4>
                      <p className="text-amber-800 mt-1 leading-relaxed">{selectedNcm.statusNote}</p>
                      {selectedNcm.replacementCode && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <p className="text-xs font-bold text-amber-600 uppercase w-full mb-1">Substituição Recomendada:</p>
                          {selectedNcm.replacementCode.split(',').map(code => (
                            <button 
                              key={code}
                              onClick={() => { setQuery(code.trim()); executeSearch(code.trim()); }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all"
                            >
                              {code.trim()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nota Técnica / Lógica de Classificação (Se vindo do Classificador) */}
                {selectedNcm.statusNote && !selectedNcm.isObsolete && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex gap-5">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <i className="fas fa-clipboard-check text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-900 text-sm uppercase tracking-widest">Fundamento Técnico da Sugestão</h4>
                      <p className="text-blue-800 mt-1 text-sm leading-relaxed">{selectedNcm.statusNote}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Tabela de Impostos */}
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Alíquotas Federais e Estaduais</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Importação (II)', val: selectedNcm.taxes.ii, icon: 'fa-ship' },
                        { label: 'IPI', val: selectedNcm.taxes.ipi, icon: 'fa-industry' },
                        { label: 'PIS', val: selectedNcm.taxes.pis, icon: 'fa-receipt' },
                        { label: 'COFINS', val: selectedNcm.taxes.cofins, icon: 'fa-building-columns' },
                        { label: 'ICMS (Médio)', val: selectedNcm.taxes.icms_avg, icon: 'fa-map' },
                      ].map((tax, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                          <div className="flex items-center gap-3">
                            <i className={`fas ${tax.icon} text-slate-300`}></i>
                            <span className="text-slate-600 font-semibold">{tax.label}</span>
                          </div>
                          <span className="text-blue-700 font-black text-lg">{tax.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Restrições e Notas */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Restrições e Notas Técnicas</h3>
                    {selectedNcm.restrictions && selectedNcm.restrictions.length > 0 ? (
                      selectedNcm.restrictions.map((r, i) => (
                        <div key={i} className="flex gap-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-amber-900 text-sm">
                          <i className="fas fa-circle-exclamation text-amber-500 text-lg shrink-0"></i>
                          <p>{r}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900 text-sm flex gap-4">
                        <i className="fas fa-shield-check text-emerald-500 text-lg"></i>
                        <p>Nenhuma licença especial ou restrição automática detectada para este código.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculadora de Impostos */}
                <TaxCalculator ncm={selectedNcm} />
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-medium">
                  <i className="fas fa-info-circle mr-1"></i> Cálculos e alíquotas baseados na TEC/TIPI 2024. Sujeito a variações por benefício fiscal ou Ex-Tarifário.
                </p>
              </div>
            </div>
          )}

          {view === ViewMode.FAVORITES && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <i className="fas fa-star text-amber-400"></i> Meus Produtos Favoritos
                </h2>
                <button 
                  onClick={checkUpdates}
                  disabled={isCheckingUpdates || favorites.length === 0}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 disabled:opacity-50 hover:bg-slate-800"
                >
                  {isCheckingUpdates ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-bell"></i>}
                  {isCheckingUpdates ? 'Verificando Atualizações...' : 'Verificar Mudanças Legislativas'}
                </button>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <i className="fas fa-star text-slate-100 text-7xl mb-4"></i>
                  <p className="text-slate-400 font-medium">Você ainda não favoritou nenhum produto ou NCM.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map(ncm => (
                    <NcmCard 
                      key={ncm.code} 
                      ncm={ncm} 
                      onSelect={handleSelectNcm} 
                      isFavorite={true} 
                      onToggleFavorite={toggleFavorite}
                      updateNote={updates[ncm.code] || undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {view === ViewMode.HISTORY && (
            <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800">Consultas Recentes</h2>
                <button onClick={clearHistory} className="text-xs font-bold text-red-500 uppercase tracking-widest hover:underline">Limpar Tudo</button>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {history.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">Nenhum histórico disponível.</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group" onClick={() => { setQuery(h.query); executeSearch(h.query); }}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <i className="fas fa-search text-xs"></i>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{h.query}</span>
                          <span className="text-[10px] font-bold text-slate-300">{new Date(h.timestamp).toLocaleDateString()} às {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(e, i)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 bg-red-50 md:bg-transparent md:text-slate-300 hover:bg-red-100 hover:text-red-600 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20"
                        title="Remover do histórico"
                      >
                        <i className="fas fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
