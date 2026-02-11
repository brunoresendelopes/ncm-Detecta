
import React, { useState } from 'react';
import { analyzeDocument, classifyProduct } from '../services/geminiService';
import { NcmData, ProductClassificationInput } from '../types';

interface FiscalToolsProps {
  onResults: (data: NcmData[]) => void;
}

const FiscalTools: React.FC<FiscalToolsProps> = ({ onResults }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'key' | 'xml' | 'classify'>('classify');
  
  // States for different modes
  const [nfKey, setNfKey] = useState('');
  const [xmlContent, setXmlContent] = useState('');
  const [productInput, setProductInput] = useState<ProductClassificationInput>({
    name: '',
    material: '',
    application: ''
  });

  const handleProcess = async () => {
    setLoading(true);
    try {
      let results: NcmData[] = [];
      if (activeTab === 'classify') {
        results = await classifyProduct(productInput);
      } else {
        results = await analyzeDocument(
          activeTab === 'xml' ? xmlContent : undefined, 
          activeTab === 'key' ? nfKey : undefined
        );
      }
      onResults(results);
    } catch (error) {
      alert("Erro ao processar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ferramentas de Inteligência Fiscal</h2>
        <p className="text-slate-500 mt-2">Classifique produtos ou extraia dados de documentos oficiais.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
        {[
          { id: 'classify', label: 'Classificador Guiado', icon: 'fa-wand-magic-sparkles', color: 'text-blue-600' },
          { id: 'xml', label: 'Importar XML', icon: 'fa-code', color: 'text-emerald-600' },
          { id: 'key', label: 'Chave de NF-e', icon: 'fa-barcode', color: 'text-indigo-600' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? `bg-white ${tab.color} shadow-lg` : 'text-slate-500 hover:text-slate-700'}`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-8">
        
        {/* TAB: CLASSIFY */}
        {activeTab === 'classify' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto ou Termo Comercial</label>
                <input 
                  type="text" 
                  value={productInput.name}
                  onChange={(e) => setProductInput({...productInput, name: e.target.value})}
                  placeholder="Ex: Suporte Articulado para TV, Válvula de Esfera..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material / Composição</label>
                <input 
                  type="text" 
                  value={productInput.material}
                  onChange={(e) => setProductInput({...productInput, material: e.target.value})}
                  placeholder="Ex: Aço, Plástico, Alumínio..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Função / Aplicação</label>
                <input 
                  type="text" 
                  value={productInput.application}
                  onChange={(e) => setProductInput({...productInput, application: e.target.value})}
                  placeholder="Ex: Uso Industrial, Doméstico, Automotivo..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <i className="fas fa-lightbulb text-blue-600"></i>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                <strong>Dica de Especialista:</strong> Quanto mais detalhes você fornecer sobre o <strong>material</strong> e o <strong>uso</strong>, mais precisa será a classificação baseada nas Regras de Interpretação (RGI).
              </p>
            </div>
          </div>
        )}

        {/* TAB: XML */}
        {activeTab === 'xml' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteúdo do Arquivo XML</label>
              <textarea 
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                rows={10}
                placeholder="Abra o XML da nota no bloco de notas, copie tudo e cole aqui..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 italic text-center">
              Ao colar o XML, iremos ler as tags reais de cada produto (<span className="font-mono">&lt;xProd&gt;</span> e <span className="font-mono">&lt;NCM&gt;</span>).
            </p>
          </div>
        )}

        {/* TAB: KEY */}
        {activeTab === 'key' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave de Acesso (44 dígitos)</label>
              <input 
                type="text" 
                maxLength={44}
                value={nfKey}
                onChange={(e) => setNfKey(e.target.value.replace(/\D/g, ''))}
                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl text-center tracking-[0.1em] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
              <div className="flex justify-between px-1">
                <span className="text-[10px] text-slate-400 font-bold">{nfKey.length} / 44 dígitos</span>
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <i className="fas fa-triangle-exclamation text-amber-500 mt-1"></i>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Aviso:</strong> A consulta por chave pública tenta identificar os itens via Portal Fiscal, mas para precisão absoluta em itens de revenda, prefira o <strong>XML</strong>.
              </p>
            </div>
          </div>
        )}

        <button 
          onClick={handleProcess}
          disabled={loading || (activeTab === 'classify' && !productInput.name) || (activeTab === 'key' && nfKey.length < 44) || (activeTab === 'xml' && !xmlContent)}
          className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${activeTab === 'classify' ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700' : activeTab === 'xml' ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700' : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'} text-white`}
        >
          {loading ? (
            <>
              <i className="fas fa-sync fa-spin"></i>
              {activeTab === 'classify' ? 'Classificando Produto...' : 'Analisando Documento...'}
            </>
          ) : (
            <>
              <i className={activeTab === 'classify' ? "fas fa-wand-magic-sparkles" : activeTab === 'xml' ? "fas fa-file-import" : "fas fa-magnifying-glass-chart"}></i>
              {activeTab === 'classify' ? 'Gerar Sugestões de NCM' : activeTab === 'xml' ? 'Processar Itens do XML' : 'Consultar pela Chave'}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <i className="fas fa-check-double"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados</p>
            <p className="text-xs font-bold text-slate-700">TIPI/TEC 2024</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <i className="fas fa-scale-balanced"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metodologia</p>
            <p className="text-xs font-bold text-slate-700">Regras RGI/SH</p>
          </div>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <i className="fas fa-tags"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suporte</p>
            <p className="text-xs font-bold text-slate-700">Sugestão CEST</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscalTools;
