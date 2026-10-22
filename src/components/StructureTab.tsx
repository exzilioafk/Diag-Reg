import React, { useState } from 'react';
import {
  PieChart,
  Compass,
  Award,
  Layers,
  MapPin,
  Info,
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  Table2,
  LayoutGrid,
} from 'lucide-react';
import { StructurePeriodResult, StudyConfig } from '../types/regional';
import { formatNumber } from '../utils/mathEngine';

interface StructureTabProps {
  config: StudyConfig;
  structT0: StructurePeriodResult;
  structT1: StructurePeriodResult;
}

export const StructureTab: React.FC<StructureTabProps> = ({
  config,
  structT0,
  structT1,
}) => {
  const [viewMode, setViewMode] = useState<'t0' | 't1' | 'compare'>(
    config.periodType === '2_periods' ? 'compare' : 't0'
  );
  const [layoutMode, setLayoutMode] = useState<'matrix' | 'cards'>('matrix');

  const d = config.displayDecimals;
  const effectiveMode = config.periodType === '1_period' ? 't0' : viewMode;

  const getQijBadge = (val: number) => {
    const eps = 0.0001;
    if (val > 1 + eps) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-xs shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          {formatNumber(val, d)}
        </span>
      );
    }
    if (Math.abs(val - 1) <= eps) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 border border-slate-300 font-mono font-semibold text-xs">
          <MinusCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          {formatNumber(val, d)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
        {formatNumber(val, d)}
      </span>
    );
  };

  // Mobile/Vertical Card View per Region
  const renderCardsByRegion = (st: StructurePeriodResult) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {config.regions.map((reg, j) => {
          const basicSectors = config.sectors
            .map((sec, i) => ({
              sec,
              i,
              vij: st.matrix[i][j],
              pij: st.pijPercent[i][j],
              pji: st.pjiPercent[i][j],
              qij: st.qij[i][j],
            }))
            .filter((item) => item.qij > 1.0001);

          return (
            <div
              key={j}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    Ficha Territorial de Estructura ({st.periodLabel})
                  </span>
                  <h4 className="font-extrabold text-base">{reg}</h4>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400">
                    Total Regional (Σᵢ Vᵢⱼ)
                  </div>
                  <div className="text-sm font-bold text-emerald-300">
                    {formatNumber(st.regionTotals[j], 2)}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Summary KPIs for Region */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200">
                    <div className="text-[10px] font-bold uppercase text-violet-700">
                      Especialización Qᴿ
                    </div>
                    <div className="font-mono font-extrabold text-sm text-violet-950 mt-0.5">
                      {formatNumber(st.qr[j], d)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <div className="text-[10px] font-bold uppercase text-indigo-700">
                      Diversificación 1-Qᴿ
                    </div>
                    <div className="font-mono font-extrabold text-sm text-indigo-950 mt-0.5">
                      {formatNumber(st.cDivR[j], d)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      Sectores Básicos
                    </div>
                    <div className="font-mono font-extrabold text-sm text-emerald-950 mt-0.5">
                      {basicSectors.length} de {config.sectors.length}
                    </div>
                  </div>
                </div>

                {/* Vertical list of sectors inside the region card */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {config.sectors.map((sec, i) => {
                    const isBasic = st.qij[i][j] > 1.0001;
                    return (
                      <div
                        key={i}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          isBasic ? 'bg-emerald-50/40' : 'bg-white'
                        }`}
                      >
                        <div className="font-semibold text-slate-800">
                          {sec}
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            Vᵢⱼ = {formatNumber(st.matrix[i][j], 2)} | Pᵢⱼ ={' '}
                            {formatNumber(st.pijPercent[i][j], 2)}% | Pⱼᵢ ={' '}
                            {formatNumber(st.pjiPercent[i][j], 2)}%
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            Qᵢⱼ:
                          </span>
                          {getQijBadge(st.qij[i][j])}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sectoral Spatial Concentration Card (QS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-500" />
          Concentración Espacial por Sector (Q_S y CDist_S = 1 - Q_S) —{' '}
          {st.periodLabel}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {config.sectors.map((sec, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
            >
              <span className="font-semibold text-slate-800 line-clamp-2">
                {sec}
              </span>
              <div className="text-right font-mono shrink-0">
                <div className="font-bold text-amber-900">
                  Q_S: {formatNumber(st.qs[i], d)}
                </div>
                <div className="text-[10px] text-emerald-700">
                  1-Q_S: {formatNumber(st.cDistS[i], d)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSinglePeriodStructure = (st: StructurePeriodResult) => {
    if (layoutMode === 'cards') {
      return renderCardsByRegion(st);
    }

    const specializedPairs: string[] = [];
    config.regions.forEach((reg, j) => {
      const specs = config.sectors
        .filter((_, i) => st.qij[i][j] > 1.0001)
        .map((sec) => {
          const idx = config.sectors.indexOf(sec);
          return `${sec} (Q=${formatNumber(st.qij[idx][j], 2)})`;
        });
      if (specs.length > 0) {
        specializedPairs.push(`${reg} se especializa en ${specs.join(', ')}`);
      } else {
        specializedPairs.push(
          `${reg} no presenta especialización relativa (>1)`
        );
      }
    });

    const dominantPij = config.regions.map((reg, j) => {
      let maxIdx = 0;
      st.pijPercent.forEach((row, i) => {
        if (row[j] > st.pijPercent[maxIdx][j]) maxIdx = i;
      });
      return `${reg}: mayor peso en ${config.sectors[maxIdx]} (${formatNumber(
        st.pijPercent[maxIdx][j],
        2
      )}%)`;
    });

    const mostDiversifiedIdx = st.cDivR.reduce(
      (best, val, idx) => (val > st.cDivR[best] ? idx : best),
      0
    );
    const mostSpecializedIdx = st.qr.reduce(
      (best, val, idx) => (val > st.qr[best] ? idx : best),
      0
    );

    const mostConcentratedSectorIdx = st.qs.reduce(
      (best, val, idx) => (val > st.qs[best] ? idx : best),
      0
    );

    return (
      <div className="space-y-8">
        {/* 1. COCIENTE DE LOCALIZACIÓN Qij */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
          <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm md:text-base">
                  1. Cociente de Localización (Qᵢⱼ) — {st.periodLabel}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Qᵢⱼ = (Vᵢⱼ / Σᵢ Vᵢⱼ) / (Σⱼ Vᵢⱼ / ΣᵢΣⱼ Vᵢⱼ)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                Verde: Qᵢⱼ &gt; 1 (Básico / Exportador)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-500/30 border border-slate-400/40 text-slate-200">
                Gris: Qᵢⱼ = 1
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200">
                Ámbar: Qᵢⱼ &lt; 1 (No Básico)
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    SEC \ REG
                  </th>
                  {config.regions.map((reg, j) => (
                    <th
                      key={j}
                      className="py-2.5 px-3 text-right font-bold text-xs uppercase min-w-[110px]"
                    >
                      {reg}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-slate-50 text-slate-600 border-l border-slate-200 min-w-[120px]">
                    Peso Ref. (ΣⱼVᵢⱼ / Total)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="sticky left-0 z-10 bg-white py-2.5 px-3 font-semibold text-slate-800 text-xs sm:text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => (
                      <td key={j} className="py-2 px-3 text-right">
                        {getQijBadge(st.qij[i][j])}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-600 bg-slate-50/60 border-l border-slate-200">
                      {formatNumber(st.baseSectorShareDecimal[i], d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-600" />
                Interpretación Ejecutiva (Especialización Relativa —
                Intrarregional e Intersectorial):
              </div>
              <p className="leading-relaxed">
                Un valor <strong className="text-emerald-800">Qᵢⱼ &gt; 1</strong>{' '}
                indica que el sector tiene un tamaño relativo mayor en la región
                que en el referente ({config.baseTotalName}), revelando
                especialización relativa y capacidad exportadora básica.{' '}
                <strong>Hallazgos ({st.periodLabel}):</strong>{' '}
                {specializedPairs.join(' • ')}.
              </p>
            </div>
          </div>
        </div>

        {/* 2 y 3. PARTICIPACIÓN SECTORIAL Pij Y REGIONAL Pji */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pij */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
            <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    2. Participación Sectorial en la Región (Pᵢⱼ) —{' '}
                    {st.periodLabel}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Pᵢⱼ = 100 × (Vᵢⱼ / Σᵢ Vᵢⱼ) — Intrarregional e Intersectorial
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="sticky left-0 z-10 bg-slate-100 py-2 px-2.5 text-left font-bold text-xs min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      SEC \ REG
                    </th>
                    {config.regions.map((reg, j) => (
                      <th
                        key={j}
                        className="py-2 px-2.5 text-right font-bold text-xs min-w-[100px]"
                      >
                        {reg}
                      </th>
                    ))}
                    <th className="py-2 px-2.5 text-right font-bold text-xs bg-indigo-50 text-indigo-900 border-l border-indigo-200 min-w-[110px]">
                      {config.baseTotalName}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {config.sectors.map((sec, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white py-2 px-2.5 font-semibold text-slate-800 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        {sec}
                      </td>
                      {config.regions.map((_, j) => (
                        <td
                          key={j}
                          className="py-2 px-2.5 text-right font-mono text-xs"
                        >
                          <div className="font-semibold text-slate-900">
                            {formatNumber(st.pijPercent[i][j], 2)}%
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ({formatNumber(st.pijDecimal[i][j], d)})
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-2.5 text-right font-mono text-xs bg-indigo-50/40 border-l border-indigo-100 font-semibold text-indigo-900">
                        {formatNumber(st.baseSectorShareDecimal[i] * 100, 2)}%
                        <div className="text-[10px] text-indigo-500 font-normal">
                          ({formatNumber(st.baseSectorShareDecimal[i], d)})
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                    <td className="sticky left-0 z-10 bg-slate-100 py-2 px-2.5">
                      TOTAL (Σᵢ)
                    </td>
                    {config.regions.map((_, j) => (
                      <td key={j} className="py-2 px-2.5 text-right font-mono">
                        100.00%
                      </td>
                    ))}
                    <td className="py-2 px-2.5 text-right font-mono bg-indigo-100 text-indigo-950 border-l border-indigo-200">
                      100.00%
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <strong>Especialización Absoluta Intrarregional:</strong>{' '}
                {dominantPij.join(' | ')}.
              </div>
            </div>
          </div>

          {/* Pji */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
            <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    3. Participación de la Región en el Sector (Pⱼᵢ) —{' '}
                    {st.periodLabel}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Pⱼᵢ = 100 × (Vᵢⱼ / Σⱼ Vᵢⱼ) — Interregional e Intrasectorial
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="sticky left-0 z-10 bg-slate-100 py-2 px-2.5 text-left font-bold text-xs min-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      SEC \ REG
                    </th>
                    {config.regions.map((reg, j) => (
                      <th
                        key={j}
                        className="py-2 px-2.5 text-right font-bold text-xs min-w-[100px]"
                      >
                        {reg}
                      </th>
                    ))}
                    <th className="py-2 px-2.5 text-right font-bold text-xs bg-sky-50 text-sky-900 border-l border-sky-200 min-w-[110px]">
                      TOTAL SECTOR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {config.sectors.map((sec, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white py-2 px-2.5 font-semibold text-slate-800 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        {sec}
                      </td>
                      {config.regions.map((_, j) => (
                        <td
                          key={j}
                          className="py-2 px-2.5 text-right font-mono text-xs"
                        >
                          <div className="font-semibold text-slate-900">
                            {formatNumber(st.pjiPercent[i][j], 2)}%
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ({formatNumber(st.pjiDecimal[i][j], d)})
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-2.5 text-right font-mono text-xs bg-sky-50/40 border-l border-sky-100 font-semibold text-sky-900">
                        100.00%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                    <td className="sticky left-0 z-10 bg-slate-100 py-2 px-2.5">
                      Distribución Ref. (ΣᵢVᵢⱼ / Total)
                    </td>
                    {config.regions.map((_, j) => (
                      <td key={j} className="py-2 px-2.5 text-right font-mono">
                        {formatNumber(st.baseRegionShareDecimal[j] * 100, 2)}%
                        <div className="text-[10px] font-normal text-slate-500">
                          ({formatNumber(st.baseRegionShareDecimal[j], d)})
                        </div>
                      </td>
                    ))}
                    <td className="py-2 px-2.5 text-right font-mono bg-sky-100 text-sky-950 border-l border-sky-200">
                      100.00%
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <strong>Concentración Absoluta Interregional:</strong> Muestra
                qué porcentaje del total de cada industria se localiza en cada
                territorio.
              </div>
            </div>
          </div>
        </div>

        {/* 4. COEFICIENTE DE ESPECIALIZACIÓN QR Y DIVERSIFICACIÓN CDivR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
          <div className="bg-slate-800 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-violet-400" />
              <div>
                <h3 className="font-bold text-sm md:text-base">
                  4. Coeficiente de Especialización (Qᴿ) y Coeficiente de
                  Diversificación (CDivᴿ = 1 - Qᴿ) — {st.periodLabel}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Qᴿⱼ = ½ Σᵢ | (Vᵢⱼ / Σᵢ Vᵢⱼ) - (Σⱼ Vᵢⱼ / ΣᵢΣⱼ Vᵢⱼ) |
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 overflow-x-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Diferencias Sector por Sector: (Vᵢⱼ / Σᵢ Vᵢⱼ) - (Σⱼ Vᵢⱼ / ΣᵢΣⱼ
              Vᵢⱼ) y Ajuste dividido entre 2
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 text-left font-bold text-xs min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    SEC \ REG
                  </th>
                  {config.regions.map((reg, j) => (
                    <th
                      key={j}
                      className="py-2.5 px-3 text-right font-bold text-xs min-w-[110px]"
                    >
                      {reg} - ΣⱼSEC
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white py-2 px-3 font-semibold text-slate-800 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => {
                      const val = st.qrDiffSigned[i][j];
                      return (
                        <td
                          key={j}
                          className={`py-2 px-3 text-right font-mono text-xs ${
                            val > 0
                              ? 'text-emerald-700 font-semibold'
                              : val < 0
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {val > 0
                            ? `+${formatNumber(val, d)}`
                            : formatNumber(val, d)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300">
                <tr className="bg-slate-100 font-mono text-xs font-bold text-slate-800">
                  <td className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 font-sans">
                    Ajuste (Σᵢ |Diferencias| / 2)
                  </td>
                  {config.regions.map((_, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(st.qrAdjustmentSum[j], d)} / 2
                    </td>
                  ))}
                </tr>
                <tr className="bg-violet-50 font-mono text-sm font-extrabold text-violet-950 border-t border-violet-200">
                  <td className="sticky left-0 z-10 bg-violet-50 py-2.5 px-3 font-sans">
                    Coeficiente de Especialización (Qᴿⱼ)
                  </td>
                  {config.regions.map((_, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(st.qr[j], d)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-indigo-50 font-mono text-sm font-extrabold text-indigo-950 border-t border-indigo-200">
                  <td className="sticky left-0 z-10 bg-indigo-50 py-2.5 px-3 font-sans">
                    Coeficiente de Diversificación (1 - Qᴿⱼ)
                  </td>
                  {config.regions.map((_, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(st.cDivR[j], d)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>

            <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-violet-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-violet-600" />
                Interpretación Ejecutiva de Qᴿ y 1 - Qᴿ:
              </div>
              <p className="leading-relaxed">
                Un <strong>Qᴿ → 0</strong> (y <strong>1 - Qᴿ → 1</strong>)
                indica que la estructura económica regional es diversificada y
                semejante al referente ({config.baseTotalName}). Un{' '}
                <strong>Qᴿ → 1</strong> indica alta especialización.{' '}
                <strong>En {st.periodLabel}:</strong> Mayor diversificación en{' '}
                <strong>
                  {config.regions[mostDiversifiedIdx]} (Qᴿ ={' '}
                  {formatNumber(st.qr[mostDiversifiedIdx], d)})
                </strong>
                ; mayor especialización en{' '}
                <strong>
                  {config.regions[mostSpecializedIdx]} (Qᴿ ={' '}
                  {formatNumber(st.qr[mostSpecializedIdx], d)})
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {/* 5. COEFICIENTE DE LOCALIZACIÓN ESPACIAL QS Y DISTRIBUCIÓN CDistS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
          <div className="bg-slate-800 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-sm md:text-base">
                  5. Coeficiente de Localización/Concentración Espacial (Q_S) y
                  Distribución (1 - Q_S) — {st.periodLabel}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Q_Si = ½ Σⱼ | (Vᵢⱼ / Σⱼ Vᵢⱼ) - (Σᵢ Vᵢⱼ / ΣᵢΣⱼ Vᵢⱼ) |
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 text-left font-bold text-xs min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    SEC \ REG
                  </th>
                  {config.regions.map((reg, j) => (
                    <th
                      key={j}
                      className="py-2.5 px-3 text-right font-bold text-xs min-w-[100px]"
                    >
                      {reg} - ΣᵢREG
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-xs bg-slate-200/70 min-w-[110px]">
                    AJUSTE (Σⱼ|d| / 2)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs bg-amber-100 text-amber-950 min-w-[110px]">
                    Q_Si (Concentración)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs bg-emerald-100 text-emerald-950 min-w-[110px]">
                    1 - Q_Si (Distribución)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white py-2 px-3 font-semibold text-slate-800 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => {
                      const val = st.qsDiffSigned[i][j];
                      return (
                        <td
                          key={j}
                          className={`py-2 px-3 text-right font-mono text-xs ${
                            val > 0
                              ? 'text-emerald-700 font-semibold'
                              : val < 0
                              ? 'text-rose-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {val > 0
                            ? `+${formatNumber(val, d)}`
                            : formatNumber(val, d)}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right font-mono text-xs bg-slate-50 font-semibold">
                      {formatNumber(st.qsAdjustmentSum[i], d)} / 2
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-sm font-bold bg-amber-50/70 text-amber-950">
                      {formatNumber(st.qs[i], d)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-sm font-bold bg-emerald-50/70 text-emerald-950">
                      {formatNumber(st.cDistS[i], d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                Interpretación Ejecutiva de Q_S y 1 - Q_S:
              </div>
              <p className="leading-relaxed">
                El sector con mayor concentración espacial en {st.periodLabel}{' '}
                es{' '}
                <strong>
                  {config.sectors[mostConcentratedSectorIdx]} (Q_S ={' '}
                  {formatNumber(st.qs[mostConcentratedSectorIdx], d)}, 1 - Q_S ={' '}
                  {formatNumber(st.cDistS[mostConcentratedSectorIdx], d)})
                </strong>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Period Selector & Mobile View Mode (Matrix vs Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Modo de Vista:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setLayoutMode('matrix')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                layoutMode === 'matrix'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Vista de Matriz Completa
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                layoutMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Vista de Tarjetas por Región
            </button>
          </div>
        </div>

        {config.periodType === '2_periods' && (
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('t0')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                effectiveMode === 't0'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {config.year0Label} (t₀)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('t1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                effectiveMode === 't1'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {config.year1Label} (t₁)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                effectiveMode === 'compare'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comparativo ({config.year0Label} vs {config.year1Label})
            </button>
          </div>
        )}
      </div>

      {effectiveMode === 't0' && renderSinglePeriodStructure(structT0)}
      {effectiveMode === 't1' && renderSinglePeriodStructure(structT1)}
      {effectiveMode === 'compare' && (
        <div className="space-y-10">
          {/* Quick side-by-side summary of QR and QS */}
          <div className="bg-indigo-950 text-white rounded-2xl p-5 shadow-md">
            <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-300 mb-3">
              Síntesis Comparativa de Estructura ({config.year0Label} →{' '}
              {config.year1Label})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 border border-white/15 overflow-x-auto">
                <div className="text-xs font-bold text-indigo-200 mb-2">
                  Evolución de Especialización Regional (Qᴿ y 1 - Qᴿ)
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-indigo-300 border-b border-white/15">
                      <th className="py-1 text-left">Región</th>
                      <th className="py-1 text-right">
                        Qᴿ ({config.year0Label})
                      </th>
                      <th className="py-1 text-right">
                        Qᴿ ({config.year1Label})
                      </th>
                      <th className="py-1 text-right">
                        1 - Qᴿ ({config.year1Label})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {config.regions.map((reg, j) => (
                      <tr key={j}>
                        <td className="py-1.5 font-sans font-semibold">
                          {reg}
                        </td>
                        <td className="py-1.5 text-right">
                          {formatNumber(structT0.qr[j], d)}
                        </td>
                        <td className="py-1.5 text-right font-bold text-emerald-300">
                          {formatNumber(structT1.qr[j], d)}
                        </td>
                        <td className="py-1.5 text-right">
                          {formatNumber(structT1.cDivR[j], d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white/10 rounded-xl p-4 border border-white/15 overflow-x-auto max-h-60">
                <div className="text-xs font-bold text-indigo-200 mb-2">
                  Evolución de Concentración Espacial Sectorial (Q_S y 1 - Q_S)
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-indigo-300 border-b border-white/15">
                      <th className="py-1 text-left">Sector</th>
                      <th className="py-1 text-right">
                        Q_S ({config.year0Label})
                      </th>
                      <th className="py-1 text-right">
                        Q_S ({config.year1Label})
                      </th>
                      <th className="py-1 text-right">
                        1 - Q_S ({config.year1Label})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {config.sectors.map((sec, i) => (
                      <tr key={i}>
                        <td className="py-1.5 font-sans font-semibold truncate max-w-[160px]">
                          {sec}
                        </td>
                        <td className="py-1.5 text-right">
                          {formatNumber(structT0.qs[i], d)}
                        </td>
                        <td className="py-1.5 text-right font-bold text-amber-300">
                          {formatNumber(structT1.qs[i], d)}
                        </td>
                        <td className="py-1.5 text-right">
                          {formatNumber(structT1.cDistS[i], d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              Resultados — Periodo Final ({config.year1Label})
            </div>
            {renderSinglePeriodStructure(structT1)}
          </div>

          <div className="space-y-4 pt-6 border-t-2 border-dashed border-slate-300">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider">
              Resultados — Periodo Inicial ({config.year0Label})
            </div>
            {renderSinglePeriodStructure(structT0)}
          </div>
        </div>
      )}
    </div>
  );
};
