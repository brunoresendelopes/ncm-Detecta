
import React from 'react';
import { NcmData } from '../types';

interface NcmCardProps {
  ncm: NcmData;
  onSelect: (ncm: NcmData) => void;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, ncm: NcmData) => void;
}

const NcmCard: React.FC<NcmCardProps> = ({ ncm, onSelect, isFavorite, onToggleFavorite }) => {
  return (
    <div 
      onClick={() => onSelect(ncm)}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-blue-600 font-mono font-bold text-lg">{ncm.code}</span>
        <button 
          onClick={(e) => onToggleFavorite(e, ncm)}
          className={`text-xl transition-colors ${isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
        >
          <i className={isFavorite ? "fas fa-star" : "far fa-star"}></i>
        </button>
      </div>
      
      <p className="text-slate-700 text-sm line-clamp-2 mb-3 leading-relaxed">
        {ncm.description}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto">
        {ncm.sector && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-slate-100 text-slate-500 rounded">
            {ncm.sector}
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          <div className="text-[10px] text-slate-400">
            IPI: <span className="font-semibold text-slate-600">{ncm.taxes.ipi}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            II: <span className="font-semibold text-slate-600">{ncm.taxes.ii}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NcmCard;
