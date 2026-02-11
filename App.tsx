
import React, { useState, useEffect, useCallback } from 'react';
import { NcmData, SearchHistory, ViewMode } from './types';
import { searchNcm } from './services/geminiService';
import NcmCard from './components/NcmCard';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NcmData[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>(ViewMode.SEARCH);
  const [selectedNcm, setSelectedNcm] = useState<NcmData | null>(null);
  const [favorites, setFavorites] = useState<NcmData[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const savedFavorites = localStorage.getItem('ncm_favorites');
    const savedHistory = localStorage.getItem('ncm_history');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    localStorage.setItem('ncm_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('ncm_history', JSON.stringify(history));
  }, [history]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setView(ViewMode.SEARCH);
    
    // Add to history
    const newHistory = [
      { query, timestamp: Date.now() },
      ...history.filter(h => h.query !== query)
    ].slice(0, 10);
    setHistory(newHistory);

    const data = await searchNcm(query);
    setResults(data);
    setLoading(false);
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
    localStorage.removeItem('ncm_history');
  };

  const filteredResults = activeFilter 
    ? results.filter(r => r.sector?.toLowerCase().includes(activeFilter.toLowerCase()))
    : results;

  const sectors = Array.from(new Set(results.map(r => r.sector).filter(Boolean))) as string[];

  const resetApp = () => {
    setQuery('');
    setResults([]);
    setView(ViewMode.SEARCH);
    setActiveFilter(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-slate-900 text-slate-300 p-6 flex flex-col shrink-0 border-r border-slate-800">
        {/* Logo Section - Gravelux */}
        <div 
          onClick={resetApp}
          className="mb-8 group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-xl bg-white p-1 border border-white/10 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
            <img 
              src="https://static.wixstatic.com/media/b51f66_1df9a8c2938844ecb9b434875a6f5c2c~mv2.jpg/v1/fill/w_448,h_282,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Logomarca%20-%20Gravelux%20-%20letra%20Azul.jpg" 
              alt="Gravelux Logo" 
              className="w-full h-auto rounded-lg group-hover:scale-[1.02] transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'py-4 text-center font-black text-blue-600 italic tracking-tighter text-2xl bg-white rounded-lg';
                  fallback.innerText = 'Gravelux';
                  parent.appendChild(fallback);
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Portal NCM</span>
            <span className="text-[10px] font-bold text-blue-500 animate-pulse">LIVE</span>
          </div>
        </div>

        <ul className="space-y-2 flex-grow">
          <li>
            <button 
              onClick={() => setView(ViewMode.SEARCH)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === ViewMode.SEARCH ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800'}`}
            >
              <i className="fas fa-search"></i> Consulta Inteligente
            </button>
          </li>
          <li>
            <button 
              onClick={() => setView(ViewMode.FAVORITES)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === ViewMode.FAVORITES ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
            >
              <i className="fas fa-star"></i> Favoritos
            </button>
          </li>
          <li>
            <button 
              onClick={() => setView(ViewMode.HISTORY)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === ViewMode.HISTORY ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
            >
              <i className="fas fa-history"></i> Histórico
            </button>
          </li>
        </ul>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 text-[10px] text-slate-500 mb-4 bg-slate-800/50 p-3 rounded-xl border border-white/5">
             <i className="fas fa-shield-halved text-blue-600 text-lg"></i>
             <div>
                <p className="font-bold text-slate-400 tracking-wider">NCM INTELIGENTE</p>
                <p>Powered by Gravelux</p>
             </div>
          </div>
          <p className="text-[10px] text-slate-600 text-center uppercase tracking-tighter">© 2025 Gravelux</p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-10 overflow-y-auto max-h-screen bg-slate-50">
        {/* Header/Search Bar */}
        <header className="mb-8 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome do produto ou código NCM..."
              className="w-full pl-12 pr-4 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all group-hover:shadow-md text-lg text-slate-900"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"></i>
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl transition-colors font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? <i className="fas fa-sync fa-spin"></i> : 'Consultar'}
            </button>
          </form>
          {view === ViewMode.SEARCH && results.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
               <button 
                onClick={() => setActiveFilter(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${!activeFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
              >
                Todos
              </button>
              {sectors.map(s => (
                <button 
                  key={s}
                  onClick={() => setActiveFilter(s === activeFilter ? null : s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${activeFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content Views */}
        <div className="max-w-7xl mx-auto">
          {view === ViewMode.SEARCH && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="animate-pulse font-medium">Analisando base de dados fiscal...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredResults.map(ncm => (
                    <NcmCard 
                      key={ncm.code} 
                      ncm={ncm} 
                      onSelect={handleSelectNcm}
                      isFavorite={favorites.some(f => f.code === ncm.code)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <i className="fas fa-search text-5xl text-slate-200 mb-4"></i>
                  <h3 className="text-slate-600 font-bold text-xl">Nenhum resultado encontrado</h3>
                  <p className="text-slate-400">Tente buscar por termos mais genéricos ou o código NCM direto.</p>
                </div>
              )}
            </>
          )}

          {view === ViewMode.FAVORITES && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <i className="fas fa-star text-amber-400"></i> Seus Favoritos
              </h2>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map(ncm => (
                    <NcmCard 
                      key={ncm.code} 
                      ncm={ncm} 
                      onSelect={handleSelectNcm}
                      isFavorite={true}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-400">Você ainda não salvou nenhum NCM como favorito.</p>
                </div>
              )}
            </div>
          )}

          {view === ViewMode.HISTORY && (
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Histórico de Buscas</h2>
                <button onClick={clearHistory} className="text-xs text-red-500 hover:underline">Limpar tudo</button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {history.length > 0 ? history.map((h, i) => (
                  <div 
                    key={i} 
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setQuery(h.query);
                      handleSearch();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-clock-rotate-left text-slate-300"></i>
                      <span className="font-medium text-slate-700">{h.query}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400 italic">Sem histórico disponível</div>
                )}
              </div>
            </div>
          )}

          {view === ViewMode.DETAILS && selectedNcm && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 p-8 text-white relative">
                <button 
                  onClick={() => setView(ViewMode.SEARCH)}
                  className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-arrow-left text-xl"></i>
                </button>
                <div className="mt-8">
                  <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-mono font-black text-blue-400 tracking-tight">{selectedNcm.code}</h1>
                    <button 
                      onClick={(e) => toggleFavorite(e, selectedNcm)}
                      className={`text-3xl ${favorites.some(f => f.code === selectedNcm.code) ? 'text-amber-400' : 'text-slate-700'}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  </div>
                  <p className="mt-4 text-slate-300 text-lg leading-relaxed">{selectedNcm.description}</p>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Detalhamento de Impostos</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Imposto de Importação (II)', val: selectedNcm.taxes.ii },
                        { label: 'IPI', val: selectedNcm.taxes.ipi },
                        { label: 'PIS', val: selectedNcm.taxes.pis },
                        { label: 'COFINS', val: selectedNcm.taxes.cofins },
                        { label: 'ICMS (Média)', val: selectedNcm.taxes.icms_avg },
                      ].map((tax, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-600 font-medium">{tax.label}</span>
                          <span className="text-blue-700 font-bold text-lg">{tax.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Restrições e Alertas</h3>
                    <div className="space-y-3">
                      {selectedNcm.restrictions && selectedNcm.restrictions.length > 0 ? (
                        selectedNcm.restrictions.map((r, i) => (
                          <div key={i} className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                            <i className="fas fa-triangle-exclamation mt-0.5"></i>
                            <p>{r}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm">
                          <i className="fas fa-check-circle mt-0.5"></i>
                          <p>Nenhuma restrição especial identificada para este código.</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedNcm.sector && (
                      <div className="mt-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Setor</h3>
                        <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold">
                          {selectedNcm.sector}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
