
import React, { useState, useEffect } from 'react';
import { NcmData, TaxCalculationResult } from '../types';

interface TaxCalculatorProps {
  ncm: NcmData;
}

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const TaxCalculator: React.FC<TaxCalculatorProps> = ({ ncm }) => {
  const [value, setValue] = useState<number>(0);
  const [origin, setOrigin] = useState('SP');
  const [destination, setDestination] = useState('SP');
  const [result, setResult] = useState<TaxCalculationResult | null>(null);

  const calculate = () => {
    if (value <= 0) return;

    const parseRate = (rateStr: string) => {
      const num = parseFloat(rateStr.replace('%', '').replace(',', '.'));
      return isNaN(num) ? 0 : num / 100;
    };

    const iiRate = parseRate(ncm.taxes.ii);
    const ipiRate = parseRate(ncm.taxes.ipi);
    const pisRate = parseRate(ncm.taxes.pis);
    const cofinsRate = parseRate(ncm.taxes.cofins);
    const icmsRate = parseRate(ncm.taxes.icms_avg);

    // Simplificação de cálculo de DIFAL (Apenas ilustrativo para o protótipo)
    // Em produção, usaria-se uma tabela de alíquotas interestaduais
    const isInterestadual = origin !== destination;
    const difalRate = isInterestadual ? 0.06 : 0; // 6% médio de diferença

    const iiVal = value * iiRate;
    const ipiVal = (value + iiVal) * ipiRate;
    const pisVal = value * pisRate;
    const cofinsVal = value * cofinsRate;
    const icmsVal = (value + iiVal + ipiVal) * icmsRate;
    const difalVal = value * difalRate;

    const totalTaxes = iiVal + ipiVal + pisVal + cofinsVal + icmsVal + difalVal;

    setResult({
      ii: iiVal,
      ipi: ipiVal,
      pis: pisVal,
      cofins: cofinsVal,
      icms: icmsVal,
      difal: difalVal,
      totalTaxes,
      finalValue: value + totalTaxes
    });
  };

  useEffect(() => {
    calculate();
  }, [value, origin, destination, ncm]);

  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner">
      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
        <i className="fas fa-calculator text-blue-600"></i> Calculadora de Impostos (Simulação)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor da Mercadoria (R$)</label>
          <input 
            type="number" 
            value={value || ''} 
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder="Ex: 1500,00"
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Origem</label>
          <select 
            value={origin} 
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
          >
            {BRAZIL_STATES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destino</label>
          <select 
            value={destination} 
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
          >
            {BRAZIL_STATES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
      </div>

      {result && value > 0 && (
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-500">I.I.:</span>
              <span className="font-bold">R$ {result.ii.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-500">IPI:</span>
              <span className="font-bold">R$ {result.ipi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-500">PIS/COFINS:</span>
              <span className="font-bold">R$ {(result.pis + result.cofins).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b pb-1">
              <span className="text-slate-500">ICMS:</span>
              <span className="font-bold">R$ {result.icms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b pb-1 col-span-2">
              <span className="text-slate-500">DIFAL (Estimado):</span>
              <span className="font-bold text-amber-600">R$ {result.difal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div className="pt-2 flex justify-between items-center text-lg border-t-2 border-slate-50">
            <span className="font-bold text-slate-400">Total Impostos:</span>
            <span className="font-black text-red-600">R$ {result.totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-xl">
            <span className="font-black text-slate-800">Custo Final:</span>
            <span className="font-black text-emerald-600">R$ {result.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
