
import React from 'react';
import { NcmData } from '../types';

interface NcmCardProps {
  ncm: NcmData;
  onSelect: (ncm: NcmData) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, ncm: NcmData) => void;
  updateNote?: string;
}

const NcmCard: React.FC<NcmCardProps> = ({ ncm, onSelect, isFavorite, onToggleFavorite, updateNote }) => {
  return (
    <div 
      onClick={() => onSelect(ncm)}
      className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative ${ncm.isObsolete ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} ${updateNote ? 'ring-2 ring-amber-400' : ''}`}
    >
      {updateNote && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] px-2 py-1 rounded-full font-black uppercase shadow-lg z-10 animate-bounce">
          Atualizado
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className={`font-mono font-bold text-lg ${ncm.isObsolete ? 'text-red-600 line-through opacity-70' : 'text-blue-600'}`}>
            {ncm.code}
          </span>
          <div className="flex gap-1 mt-1">
            {ncm.isObsolete && (
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter w-fit">
                Descontinuado
              </span>
            )}
            {ncm.cest && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter w-fit border border-emerald-200">
                CEST: {ncm.cest}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => onToggleFavorite(e, ncm)}
          className={`text-xl transition-colors ${isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
        >
          <i className={isFavorite ? "fas fa-star" : "far fa-star"}></i>
        </button>
      </div>
      
      <p className="text-slate-700 text-sm line-clamp-2 mb-3 leading-relaxed flex-grow">
        {ncm.description}
      </p>

      {ncm.isObsolete && ncm.replacementCode && (
        <div className="mb-3 p-2 bg-blue-100/50 border border-blue-200 rounded text-[11px] text-blue-800 font-bold">
          <i className="fas fa-arrow-right mr-1"></i> Substituído por: {ncm.replacementCode}
        </div>
      )}

      {updateNote && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 italic">
          <i className="fas fa-info-circle mr-1"></i> {updateNote}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-auto">
        {ncm.sector && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded">
            {ncm.sector}
          </span>
        )}
        <div className="flex gap-2 ml-auto items-center text-xs">
          <div className="text-slate-400">
            IPI: <span className="font-semibold text-slate-600">{ncm.taxes.ipi}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcmCard;
