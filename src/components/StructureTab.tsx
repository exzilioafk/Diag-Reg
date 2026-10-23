import React from 'react';
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
  Sparkles,
} from 'lucide-react';
import { StructurePeriodResult, StudyConfig } from '../types/regional';
import { formatNumber } from '../utils/mathEngine';
import { usePersistentState } from '../hooks/usePersistentState';

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
  const [viewMode, setViewMode] = usePersistentState<'t0' | 't1' | 'compare'>(
    'diagnostico_regional_structure_view_v2',
    config.periodType === '2_periods' ? 'compare' : 't0'
  );
  const [layoutMode, setLayoutMode] = usePersistentState<'matrix' | 'cards'>(
    'diagnostico_regional_structure_layout_v2',
    'matrix'
  );

  const d = config.displayDecimals;
  const effectiveMode = config.periodType === '1_period' ? 't0' : viewMode;

  const getQijBadge = (val: number) => {
    const eps = 0.0001;
    if (val > 1 + eps) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 font-mono tabular-nums font-bold text-xs shadow-sm shadow-emerald-500/10">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          {formatNumber(val, d)}
        </span>
      );
    }
    if (Math.abs(val - 1) <= eps) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-white/10 font-mono tabular-nums font-semibold text-xs">
          <MinusCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          {formatNumber(val, d)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono tabular-nums text-xs">
        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
        {formatNumber(val, d)}
      </span>
    );
  };

  // Streaming Stories / Bento Feed of Regional Specialization
  const renderRegionalStoriesFeed = (st: StructurePeriodResult) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {config.regions.map((reg, j) => {
        const qrVal = st.qr[j] || 0;
        const divVal = st.cDivR[j] || 0;
        const divPct = Math.max(0, Math.min(100, Math.round(divVal * 100)));
        const topSpecialized = config.sectors
          .map((sec, i) => ({
            sec,
            q: st.qij[i][j],
            pij: st.pijPercent[i][j],
          }))
          .filter((s) => s.q > 1.0001)
          .sort((a, b) => b.q - a.q);

        return (
          <div
            key={j}
            className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Story de Estructura • {st.periodLabel}</span>
                </div>
                <h4 className="font-extrabold text-base sm:text-lg text-white mt-1.5">
                  {reg}
                </h4>
                <div className="text-xs font-mono tabular-nums text-zinc-400">
                  Volumen ΣᵢVᵢⱼ:{' '}
                  <strong className="text-emerald-300">
                    {formatNumber(st.regionTotals[j], 0)}
                  </strong>
                </div>
              </div>

              {/* Circular SVG Gauge for QR vs 1-QR */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.round((divPct / 100) * 163.36)} 163.36`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums">
                  <span className="text-[11px] font-extrabold text-emerald-400">
                    {formatNumber(divVal, 2)}
                  </span>
                  <span className="text-[8px] text-zinc-400">1-Qᴿ</span>
                </div>
              </div>
            </div>

            {/* Linear Progress Bars for QR and Top Basic Sectors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  Especialización Regional (Qᴿ)
                </span>
                <span className="font-mono tabular-nums font-bold text-violet-300">
                  {formatNumber(qrVal, d)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                  style={{
                    width: `${Math.min(100, Math.max(6, Math.round(qrVal * 100)))}%`,
                  }}
                />
              </div>

              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-zinc-300">
                    Sectores Especializados (Qᵢⱼ &gt; 1)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono tabular-nums font-bold text-[10px]">
                    {topSpecialized.length} de {config.sectors.length}
                  </span>
                </div>
                {topSpecialized.length > 0 ? (
                  <div className="space-y-1.5">
                    {topSpecialized.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-300 truncate max-w-[180px]">
                            {item.sec}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-emerald-400">
                            Q={formatNumber(item.q, 2)}
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(20, Math.round((item.q / 3) * 100))
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-zinc-500 italic">
                    Sin sectores con Qᵢⱼ &gt; 1
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

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
              className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden"
            >
              <div className="bg-[#18181B] border-b border-white/[0.07] px-5 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                    Ficha Territorial de Estructura ({st.periodLabel})
                  </span>
                  <h4 className="font-extrabold text-base text-white">{reg}</h4>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] text-zinc-400">
                    Total Regional (Σᵢ Vᵢⱼ)
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {formatNumber(st.regionTotals[j], 2)}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Summary KPIs for Region */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/25">
                    <div className="text-[10px] font-bold uppercase text-violet-300">
                      Especialización Qᴿ
                    </div>
                    <div className="font-mono tabular-nums font-extrabold text-sm text-white mt-0.5">
                      {formatNumber(st.qr[j], d)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25">
                    <div className="text-[10px] font-bold uppercase text-indigo-300">
                      Diversificación 1-Qᴿ
                    </div>
                    <div className="font-mono tabular-nums font-extrabold text-sm text-white mt-0.5">
                      {formatNumber(st.cDivR[j], d)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                    <div className="text-[10px] font-bold uppercase text-emerald-300">
                      Sectores Básicos
                    </div>
                    <div className="font-mono tabular-nums font-extrabold text-sm text-emerald-300 mt-0.5">
                      {basicSectors.length} de {config.sectors.length}
                    </div>
                  </div>
                </div>

                {/* Vertical list of sectors inside the region card */}
                <div className="divide-y divide-white/[0.06] border border-white/[0.07] rounded-2xl overflow-hidden">
                  {config.sectors.map((sec, i) => {
                    const isBasic = st.qij[i][j] > 1.0001;
                    return (
                      <div
                        key={i}
                        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                          isBasic ? 'bg-emerald-500/[0.06]' : 'bg-[#18181B]/60'
                        }`}
                      >
                        <div className="font-semibold text-zinc-200">
                          {sec}
                          <div className="text-[11px] font-mono tabular-nums text-zinc-400 mt-0.5">
                            Vᵢⱼ = {formatNumber(st.matrix[i][j], 2)} | Pᵢⱼ ={' '}
                            {formatNumber(st.pijPercent[i][j], 2)}% | Pⱼᵢ ={' '}
                            {formatNumber(st.pjiPercent[i][j], 2)}%
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <span className="text-[10px] font-mono text-zinc-500">
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
      <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl p-5">
        <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          Concentración Espacial por Sector (Q_S y CDist_S = 1 - Q_S) —{' '}
          {st.periodLabel}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {config.sectors.map((sec, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-[#18181B] border border-white/[0.07] flex items-center justify-between gap-2 text-xs"
            >
              <span className="font-semibold text-zinc-200 line-clamp-2">
                {sec}
              </span>
              <div className="text-right font-mono tabular-nums shrink-0">
                <div className="font-bold text-amber-300">
                  Q_S: {formatNumber(st.qs[i], d)}
                </div>
                <div className="text-[10px] text-emerald-400">
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
      <div className="space-y-7">
        {/* STORIES / STREAMING STATS BENTO FEED */}
        {renderRegionalStoriesFeed(st)}

        {/* 1. COCIENTE DE LOCALIZACIÓN Qij */}
        <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
          <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-white">
                  1. Cociente de Localización (Qᵢⱼ) —{' '}
                  <span className="text-emerald-400">{st.periodLabel}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono tabular-nums">
                  Qᵢⱼ = (Vᵢⱼ / Σᵢ Vᵢⱼ) / (Σⱼ Vᵢⱼ / ΣᵢΣⱼ Vᵢⱼ)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-semibold">
                Esmeralda: Qᵢⱼ &gt; 1 (Básico / Exportador)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-300">
                Gris: Qᵢⱼ = 1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
                Ámbar: Qᵢⱼ &lt; 1 (No Básico)
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                  <th className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[150px] border-r border-white/[0.05]">
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
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-zinc-950/60 text-zinc-400 border-l border-white/[0.06] min-w-[120px]">
                    Peso Ref. (ΣⱼVᵢⱼ / Total)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="sticky left-0 z-10 bg-[#121214] py-2.5 px-3 font-semibold text-zinc-200 text-xs sm:text-sm border-r border-white/[0.05]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => (
                      <td key={j} className="py-2 px-3 text-right">
                        {getQijBadge(st.qij[i][j])}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-zinc-400 bg-zinc-950/40 border-l border-white/[0.05]">
                      {formatNumber(st.baseSectorShareDecimal[i], d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-zinc-300 space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-400" />
                Interpretación Ejecutiva (Especialización Relativa —
                Intrarregional e Intersectorial):
              </div>
              <p className="leading-relaxed">
                Un valor{' '}
                <strong className="text-emerald-300">Qᵢⱼ &gt; 1</strong> indica
                que el sector tiene un tamaño relativo mayor en la región que en
                el referente ({config.baseTotalName}), revelando especialización
                relativa y capacidad exportadora básica.{' '}
                <strong className="text-white">
                  Hallazgos ({st.periodLabel}):
                </strong>{' '}
                {specializedPairs.join(' • ')}.
              </p>
            </div>
          </div>
        </div>

        {/* 2 y 3. PARTICIPACIÓN SECTORIAL Pij Y REGIONAL Pji */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Pij */}
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
            <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PieChart className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    2. Participación Sectorial en la Región (Pᵢⱼ) —{' '}
                    <span className="text-violet-300">{st.periodLabel}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono tabular-nums">
                    Pᵢⱼ = 100 × (Vᵢⱼ / Σᵢ Vᵢⱼ) — Intrarregional e Intersectorial
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                    <th className="sticky left-0 z-10 bg-zinc-900 py-2 px-2.5 text-left font-bold text-xs min-w-[140px] border-r border-white/[0.05]">
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
                    <th className="py-2 px-2.5 text-right font-bold text-xs bg-violet-950/30 text-violet-200 border-l border-violet-500/20 min-w-[110px]">
                      {config.baseTotalName}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {config.sectors.map((sec, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="sticky left-0 z-10 bg-[#121214] py-2 px-2.5 font-semibold text-zinc-200 text-xs border-r border-white/[0.05]">
                        {sec}
                      </td>
                      {config.regions.map((_, j) => (
                        <td
                          key={j}
                          className="py-2 px-2.5 text-right font-mono tabular-nums text-xs"
                        >
                          <div className="font-semibold text-zinc-100">
                            {formatNumber(st.pijPercent[i][j], 2)}%
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            ({formatNumber(st.pijDecimal[i][j], d)})
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-xs bg-violet-950/15 border-l border-violet-500/20 font-semibold text-violet-200">
                        {formatNumber(st.baseSectorShareDecimal[i] * 100, 2)}%
                        <div className="text-[10px] text-violet-400 font-normal">
                          ({formatNumber(st.baseSectorShareDecimal[i], d)})
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-900 font-bold text-xs border-t border-white/10 text-white">
                    <td className="sticky left-0 z-10 bg-zinc-900 py-2 px-2.5 border-r border-white/[0.05]">
                      TOTAL (Σᵢ)
                    </td>
                    {config.regions.map((_, j) => (
                      <td
                        key={j}
                        className="py-2 px-2.5 text-right font-mono tabular-nums"
                      >
                        100.00%
                      </td>
                    ))}
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums bg-violet-950/40 text-violet-200 border-l border-violet-500/30">
                      100.00%
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-3 p-3 rounded-2xl bg-[#18181B] border border-white/[0.06] text-xs text-zinc-300">
                <strong className="text-violet-300">
                  Especialización Absoluta Intrarregional:
                </strong>{' '}
                {dominantPij.join(' | ')}.
              </div>
            </div>
          </div>

          {/* Pji */}
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
            <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    3. Participación de la Región en el Sector (Pⱼᵢ) —{' '}
                    <span className="text-teal-300">{st.periodLabel}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono tabular-nums">
                    Pⱼᵢ = 100 × (Vᵢⱼ / Σⱼ Vᵢⱼ) — Interregional e Intrasectorial
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                    <th className="sticky left-0 z-10 bg-zinc-900 py-2 px-2.5 text-left font-bold text-xs min-w-[140px] border-r border-white/[0.05]">
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
                    <th className="py-2 px-2.5 text-right font-bold text-xs bg-teal-950/30 text-teal-200 border-l border-teal-500/20 min-w-[110px]">
                      TOTAL SECTOR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {config.sectors.map((sec, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="sticky left-0 z-10 bg-[#121214] py-2 px-2.5 font-semibold text-zinc-200 text-xs border-r border-white/[0.05]">
                        {sec}
                      </td>
                      {config.regions.map((_, j) => (
                        <td
                          key={j}
                          className="py-2 px-2.5 text-right font-mono tabular-nums text-xs"
                        >
                          <div className="font-semibold text-zinc-100">
                            {formatNumber(st.pjiPercent[i][j], 2)}%
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            ({formatNumber(st.pjiDecimal[i][j], d)})
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums text-xs bg-teal-950/15 border-l border-teal-500/20 font-semibold text-teal-300">
                        100.00%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-900 font-bold text-xs border-t border-white/10 text-white">
                    <td className="sticky left-0 z-10 bg-zinc-900 py-2 px-2.5 border-r border-white/[0.05]">
                      Distribución Ref. (ΣᵢVᵢⱼ / Total)
                    </td>
                    {config.regions.map((_, j) => (
                      <td
                        key={j}
                        className="py-2 px-2.5 text-right font-mono tabular-nums"
                      >
                        {formatNumber(st.baseRegionShareDecimal[j] * 100, 2)}%
                        <div className="text-[10px] font-normal text-zinc-500">
                          ({formatNumber(st.baseRegionShareDecimal[j], d)})
                        </div>
                      </td>
                    ))}
                    <td className="py-2 px-2.5 text-right font-mono tabular-nums bg-teal-950/40 text-teal-200 border-l border-teal-500/30">
                      100.00%
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="mt-3 p-3 rounded-2xl bg-[#18181B] border border-white/[0.06] text-xs text-zinc-300">
                <strong className="text-teal-300">
                  Concentración Absoluta Interregional:
                </strong>{' '}
                Muestra qué proporción del total de cada industria se localiza
                en cada territorio.
              </div>
            </div>
          </div>
        </div>

        {/* 4. COEFICIENTE DE ESPECIALIZACIÓN QR Y DIVERSIFICACIÓN CDivR */}
        <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
          <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-white">
                  4. Coeficiente de Especialización (Qᴿ) y Coeficiente de
                  Diversificación (CDivᴿ = 1 - Qᴿ) —{' '}
                  <span className="text-violet-300">{st.periodLabel}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono tabular-nums">
                  Qᴿⱼ = ½ Σᵢ | (Vᵢⱼ / Σᵢ Vᵢⱼ) - (Σⱼ Vᵢⱼ / ΣᵢΣⱼ Vᵢⱼ) |
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 overflow-x-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Diferencias Sector por Sector: (Vᵢⱼ / Σᵢ Vᵢⱼ) - (Σⱼ Vᵢⱼ / ΣᵢΣⱼ
              Vᵢⱼ) y Ajuste dividido entre 2
            </div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                  <th className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 text-left font-bold text-xs min-w-[150px] border-r border-white/[0.05]">
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
              <tbody className="divide-y divide-white/[0.05]">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="sticky left-0 z-10 bg-[#121214] py-2 px-3 font-semibold text-zinc-200 text-xs border-r border-white/[0.05]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => {
                      const val = st.qrDiffSigned[i][j];
                      return (
                        <td
                          key={j}
                          className={`py-2 px-3 text-right font-mono tabular-nums text-xs ${
                            val > 0
                              ? 'text-emerald-400 font-semibold'
                              : val < 0
                              ? 'text-rose-400'
                              : 'text-zinc-500'
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
              <tfoot className="border-t border-white/10">
                <tr className="bg-zinc-900/90 font-mono tabular-nums text-xs font-bold text-zinc-300">
                  <td className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 font-sans border-r border-white/[0.05]">
                    Ajuste (Σᵢ |Diferencias| / 2)
                  </td>
                  {config.regions.map((_, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(st.qrAdjustmentSum[j], d)} / 2
                    </td>
                  ))}
                </tr>
                <tr className="bg-violet-950/35 font-mono tabular-nums text-sm font-extrabold text-violet-300 border-t border-violet-500/20">
                  <td className="sticky left-0 z-10 bg-[#1a1429] py-2.5 px-3 font-sans border-r border-white/[0.05]">
                    Coeficiente de Especialización (Qᴿⱼ)
                  </td>
                  {config.regions.map((_, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(st.qr[j], d)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-emerald-950/30 font-mono tabular-nums text-sm font-extrabold text-emerald-300 border-t border-emerald-500/20">
                  <td className="sticky left-0 z-10 bg-[#0d211b] py-2.5 px-3 font-sans border-r border-white/[0.05]">
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

            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/25 text-xs text-zinc-300 space-y-1">
              <div className="font-bold text-violet-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-violet-400" />
                Interpretación Ejecutiva de Qᴿ y 1 - Qᴿ:
              </div>
              <p className="leading-relaxed">
                Un <strong className="text-white">Qᴿ → 0</strong> (y{' '}
                <strong className="text-emerald-300">1 - Qᴿ → 1</strong>) indica
                que la estructura económica regional es diversificada y
                semejante al referente ({config.baseTotalName}). Un{' '}
                <strong className="text-violet-300">Qᴿ → 1</strong> indica alta
                especialización.{' '}
                <strong className="text-white">En {st.periodLabel}:</strong>{' '}
                Mayor diversificación en{' '}
                <strong className="text-emerald-300">
                  {config.regions[mostDiversifiedIdx]} (Qᴿ ={' '}
                  {formatNumber(st.qr[mostDiversifiedIdx], d)})
                </strong>
                ; mayor especialización en{' '}
                <strong className="text-violet-300">
                  {config.regions[mostSpecializedIdx]} (Qᴿ ={' '}
                  {formatNumber(st.qr[mostSpecializedIdx], d)})
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {/* 5. COEFICIENTE DE LOCALIZACIÓN ESPACIAL QS Y DISTRIBUCIÓN CDistS */}
        <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
          <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-white">
                  5. Coeficiente de Localización/Concentración Espacial (Q_S) y
                  Distribución (1 - Q_S) —{' '}
                  <span className="text-amber-300">{st.periodLabel}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono tabular-nums">
                  Q_Si = ½ Σⱼ | (Vᵢⱼ / Σⱼ Vᵢⱼ) - (Σᵢ Vᵢⱼ / ΣᵢΣⱼ Vᵢⱼ) |
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                  <th className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 text-left font-bold text-xs min-w-[150px] border-r border-white/[0.05]">
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
                  <th className="py-2.5 px-3 text-right font-bold text-xs bg-zinc-950/60 min-w-[110px]">
                    AJUSTE (Σⱼ|d| / 2)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs bg-amber-500/15 text-amber-300 min-w-[110px]">
                    Q_Si (Concentración)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs bg-emerald-500/15 text-emerald-300 min-w-[110px]">
                    1 - Q_Si (Distribución)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="sticky left-0 z-10 bg-[#121214] py-2 px-3 font-semibold text-zinc-200 text-xs border-r border-white/[0.05]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => {
                      const val = st.qsDiffSigned[i][j];
                      return (
                        <td
                          key={j}
                          className={`py-2 px-3 text-right font-mono tabular-nums text-xs ${
                            val > 0
                              ? 'text-emerald-400 font-semibold'
                              : val < 0
                              ? 'text-rose-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          {val > 0
                            ? `+${formatNumber(val, d)}`
                            : formatNumber(val, d)}
                        </td>
                      );
                    })}
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-xs bg-zinc-950/40 text-zinc-300 font-semibold">
                      {formatNumber(st.qsAdjustmentSum[i], d)} / 2
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-sm font-bold bg-amber-500/10 text-amber-300">
                      {formatNumber(st.qs[i], d)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-sm font-bold bg-emerald-500/10 text-emerald-300">
                      {formatNumber(st.cDistS[i], d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-zinc-300 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                Interpretación Ejecutiva de Q_S y 1 - Q_S:
              </div>
              <p className="leading-relaxed">
                El sector con mayor concentración espacial en {st.periodLabel}{' '}
                es{' '}
                <strong className="text-amber-300">
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
      {/* Control Bar: Pill Chips for Layout & Period Selection */}
      <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 pl-2">
            Formato Visual:
          </span>
          <div className="inline-flex rounded-full bg-zinc-950 p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setLayoutMode('matrix')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                layoutMode === 'matrix'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              Vista de Matriz Completa
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                layoutMode === 'cards'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tarjetas por Región
            </button>
          </div>
        </div>

        {config.periodType === '2_periods' && (
          <div className="inline-flex rounded-full bg-zinc-950 p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setViewMode('t0')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                effectiveMode === 't0'
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {config.year0Label} (t₀)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('t1')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                effectiveMode === 't1'
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {config.year1Label} (t₁)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                effectiveMode === 'compare'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
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
          <div className="bg-[#121214]/90 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-5 shadow-xl">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-violet-300 mb-3">
              Síntesis Comparativa de Estructura ({config.year0Label} →{' '}
              {config.year1Label})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#18181B] rounded-2xl p-4 border border-white/[0.07] overflow-x-auto">
                <div className="text-xs font-bold text-violet-300 mb-2">
                  Evolución de Especialización Regional (Qᴿ y 1 - Qᴿ)
                </div>
                <table className="w-full text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="text-zinc-400 border-b border-white/10">
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
                  <tbody className="divide-y divide-white/[0.06]">
                    {config.regions.map((reg, j) => (
                      <tr key={j}>
                        <td className="py-1.5 font-sans font-semibold text-white">
                          {reg}
                        </td>
                        <td className="py-1.5 text-right text-zinc-300">
                          {formatNumber(structT0.qr[j], d)}
                        </td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">
                          {formatNumber(structT1.qr[j], d)}
                        </td>
                        <td className="py-1.5 text-right text-zinc-300">
                          {formatNumber(structT1.cDivR[j], d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#18181B] rounded-2xl p-4 border border-white/[0.07] overflow-x-auto max-h-60">
                <div className="text-xs font-bold text-amber-300 mb-2">
                  Evolución de Concentración Espacial Sectorial (Q_S y 1 - Q_S)
                </div>
                <table className="w-full text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="text-zinc-400 border-b border-white/10">
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
                  <tbody className="divide-y divide-white/[0.06]">
                    {config.sectors.map((sec, i) => (
                      <tr key={i}>
                        <td className="py-1.5 font-sans font-semibold text-white truncate max-w-[160px]">
                          {sec}
                        </td>
                        <td className="py-1.5 text-right text-zinc-300">
                          {formatNumber(structT0.qs[i], d)}
                        </td>
                        <td className="py-1.5 text-right font-bold text-amber-300">
                          {formatNumber(structT1.qs[i], d)}
                        </td>
                        <td className="py-1.5 text-right text-zinc-300">
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider">
              Resultados — Periodo Final ({config.year1Label})
            </div>
            {renderSinglePeriodStructure(structT1)}
          </div>

          <div className="space-y-4 pt-6 border-t border-dashed border-white/15">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-bold text-xs uppercase tracking-wider">
              Resultados — Periodo Inicial ({config.year0Label})
            </div>
            {renderSinglePeriodStructure(structT0)}
          </div>
        </div>
      )}
    </div>
  );
};
