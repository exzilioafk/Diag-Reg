import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Share2,
  GitBranch,
  Sliders,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Table2,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import {
  DynamicsResult,
  StructurePeriodResult,
  StudyConfig,
} from '../types/regional';
import { formatNumber } from '../utils/mathEngine';
import { usePersistentState } from '../hooks/usePersistentState';

interface DynamicsTabProps {
  config: StudyConfig;
  structT0: StructurePeriodResult;
  structT1: StructurePeriodResult;
  dynamics: DynamicsResult;
  onChangeConfig: (newConfig: StudyConfig) => void;
}

const STILWELL_REFERENCE_TABLE = [
  {
    t: 1,
    ee: '+',
    eem: '+',
    erm: '+',
    cond: 'Todos positivos (Ganadora óptima)',
  },
  {
    t: 2,
    ee: '-',
    eem: '-',
    erm: '-',
    cond: 'Todos negativos (Perdedora aguda)',
  },
  { t: 3, ee: '+', eem: '+', erm: '-', cond: 'si |EEj + EEMj| > |ERMj|' },
  { t: 4, ee: '+', eem: '+', erm: '-', cond: 'si |EEj + EEMj| < |ERMj|' },
  { t: 5, ee: '+', eem: '-', erm: '+', cond: 'si |EEj + ERMj| > |EEMj|' },
  { t: 6, ee: '+', eem: '-', erm: '+', cond: 'si |EEj + ERMj| < |EEMj|' },
  { t: 7, ee: '-', eem: '+', erm: '+', cond: 'si |EEMj + ERMj| > |EEj|' },
  { t: 8, ee: '-', eem: '+', erm: '+', cond: 'si |EEMj + ERMj| < |EEj|' },
  { t: 9, ee: '+', eem: '-', erm: '-', cond: 'si |EEj| > |EEMj + ERMj|' },
  { t: 10, ee: '+', eem: '-', erm: '-', cond: 'si |EEj| < |EEMj + ERMj|' },
  { t: 11, ee: '-', eem: '+', erm: '-', cond: 'si |EEMj| > |EEj + ERMj|' },
  { t: 12, ee: '-', eem: '+', erm: '-', cond: 'si |EEMj| < |EEj + ERMj|' },
  { t: 13, ee: '-', eem: '-', erm: '+', cond: 'si |ERMj| > |EEj + EEMj|' },
  { t: 14, ee: '-', eem: '-', erm: '+', cond: 'si |ERMj| < |EEj + EEMj|' },
];

export const DynamicsTab: React.FC<DynamicsTabProps> = ({
  config,
  structT0,
  structT1,
  dynamics,
  onChangeConfig,
}) => {
  const [showStilwellCatalog, setShowStilwellCatalog] = useState(false);
  const [layoutMode, setLayoutMode] = usePersistentState<'matrix' | 'cards'>(
    'diagnostico_regional_dynamics_layout_v2',
    'matrix'
  );
  const d = config.displayDecimals;

  const formatRateBadge = (r: number) => {
    const pct = (r - 1) * 100;
    const isGrowth = r > 1.0001;
    const isDrop = r < 0.9999;
    return (
      <div className="inline-flex flex-col items-end">
        <span
          className={`font-mono tabular-nums font-bold text-xs px-2.5 py-0.5 rounded-full border ${
            isGrowth
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : isDrop
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-zinc-800 text-zinc-200 border-white/10'
          }`}
        >
          {formatNumber(r, d)}
        </span>
        <span className="text-[10px] font-mono tabular-nums text-zinc-500 mt-0.5">
          ({pct >= 0 ? `+${formatNumber(pct, 2)}%` : `${formatNumber(pct, 2)}%`})
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-7">
      {/* Control Bar: Pill Chips for Layout & Stilwell Formula Selector */}
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

        <div className="inline-flex rounded-full bg-zinc-950 p-1 border border-white/[0.08] text-xs">
          <button
            type="button"
            onClick={() =>
              onChangeConfig({ ...config, stilwellMode: 'slide_37' })
            }
            className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
              config.stilwellMode === 'slide_37'
                ? 'bg-violet-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            EIⱼ Inverso A: V(t)[r_global - rᵢ(base)]
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                stilwellMode: 'standard_stilwell',
              })
            }
            className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
              config.stilwellMode === 'standard_stilwell'
                ? 'bg-violet-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            EIⱼ Estándar: V(t)[rᵢ(base) - r_global]
          </button>
        </div>
      </div>

      {/* BENTO STORIES FEED: SHIFT-SHARE & STILWELL HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {config.regions.map((reg, j) => {
          const trad = dynamics.traditionalDiagnosis[j];
          const stil = dynamics.stilwellDiagnosis[j];
          const isWin = trad.category === 'Ganadora';
          const crrPct = Math.min(
            100,
            Math.max(8, Math.round((dynamics.crr[j] || 0) * 100))
          );

          return (
            <div
              key={j}
              className={`bg-[#121214]/90 backdrop-blur-xl rounded-3xl border p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl ${
                isWin ? 'border-emerald-500/25' : 'border-rose-500/25'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isWin
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                    }`}
                  >
                    {isWin ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    Shift-Share Tipo {trad.typeNumber} ({trad.category})
                  </span>
                  <h4 className="font-extrabold text-base sm:text-lg text-white mt-1.5">
                    {reg}
                  </h4>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] text-zinc-400">Variación rⱼ</div>
                  <div
                    className={`text-sm font-extrabold ${
                      dynamics.rj[j] >= 1 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatNumber(dynamics.rj[j], d)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums text-xs">
                <div className="p-2 rounded-2xl bg-[#18181B] border border-white/[0.06]">
                  <div className="text-[10px] font-sans text-zinc-400">
                    ETⱼ Total
                  </div>
                  <div
                    className={`font-extrabold mt-0.5 ${
                      dynamics.et[j] >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {dynamics.et[j] > 0
                      ? `+${formatNumber(dynamics.et[j], 2)}`
                      : formatNumber(dynamics.et[j], 2)}
                  </div>
                </div>
                <div className="p-2 rounded-2xl bg-[#18181B] border border-white/[0.06]">
                  <div className="text-[10px] font-sans text-zinc-400">
                    EDⱼ Dif.
                  </div>
                  <div
                    className={`font-bold mt-0.5 ${
                      dynamics.ed[j] >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {dynamics.ed[j] > 0
                      ? `+${formatNumber(dynamics.ed[j], 2)}`
                      : formatNumber(dynamics.ed[j], 2)}
                  </div>
                </div>
                <div className="p-2 rounded-2xl bg-[#18181B] border border-white/[0.06]">
                  <div className="text-[10px] font-sans text-zinc-400">
                    EEⱼ Estr.
                  </div>
                  <div
                    className={`font-bold mt-0.5 ${
                      dynamics.ee[j] >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {dynamics.ee[j] > 0
                      ? `+${formatNumber(dynamics.ee[j], 2)}`
                      : formatNumber(dynamics.ee[j], 2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Reestructuración Regional (CRr)
                  </span>
                  <span className="font-mono tabular-nums font-bold text-violet-300">
                    {formatNumber(dynamics.crr[j], d)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
                    style={{ width: `${crrPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    Stilwell Tipo {stil.typeNumber}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-zinc-300">
                    ERM = {formatNumber(dynamics.erm[j], 2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE / VERTICAL CARDS BY REGION VIEW */}
      {layoutMode === 'cards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {config.regions.map((reg, j) => {
              const trad = dynamics.traditionalDiagnosis[j];
              const stil = dynamics.stilwellDiagnosis[j];
              const isWin = trad.category === 'Ganadora';
              return (
                <div
                  key={j}
                  className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden"
                >
                  <div className="bg-[#18181B] border-b border-white/[0.07] px-5 py-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Ficha de Dinámica Regional ({config.year0Label} →{' '}
                        {config.year1Label})
                      </span>
                      <h4 className="font-extrabold text-base text-white">
                        {reg}
                      </h4>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-[10px] text-zinc-400">
                        Variación Regional rⱼ
                      </div>
                      <div className="text-sm font-bold text-emerald-400">
                        {formatNumber(dynamics.rj[j], d)} (
                        {((dynamics.rj[j] - 1) * 100 >= 0 ? '+' : '') +
                          formatNumber((dynamics.rj[j] - 1) * 100, 2)}
                        %)
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Shift-Share Traditional Summary */}
                    <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/[0.07] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-zinc-300">
                          Shift-Share Tradicional
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isWin
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          Tipo {trad.typeNumber} ({trad.category})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center font-mono tabular-nums text-xs">
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            ETⱼ (Total)
                          </div>
                          <div className="font-bold text-white">
                            {formatNumber(dynamics.et[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            EDⱼ (Diferencial)
                          </div>
                          <div className="font-bold text-white">
                            {formatNumber(dynamics.ed[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            EEⱼ (Estructural)
                          </div>
                          <div className="font-bold text-white">
                            {formatNumber(dynamics.ee[j], d)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {trad.description}
                      </p>
                    </div>

                    {/* Stilwell Modified Summary */}
                    <div className="p-3.5 rounded-2xl bg-violet-950/20 border border-violet-500/25 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-violet-300">
                          Modificado de Stilwell
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-200 border border-violet-500/35">
                          Tipo {stil.typeNumber} ({stil.conditionText})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono tabular-nums text-xs">
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            EIⱼ (Inverso)
                          </div>
                          <div className="font-bold text-zinc-100">
                            {formatNumber(dynamics.ei[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            EEMⱼ = EIⱼ - EEⱼ
                          </div>
                          <div className="font-bold text-zinc-100">
                            {formatNumber(dynamics.eem[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            ERMⱼ = EDⱼ - EEMⱼ
                          </div>
                          <div className="font-bold text-emerald-300">
                            {formatNumber(dynamics.erm[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            ETMⱼ (ERM - EEM)
                          </div>
                          <div className="font-bold text-zinc-100">
                            {formatNumber(dynamics.etm[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            ETMⱼ (ERM + EEM)
                          </div>
                          <div className="font-bold text-zinc-100">
                            {formatNumber(dynamics.etmSum[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-950 border border-white/[0.06]">
                          <div className="text-[10px] font-sans text-zinc-400">
                            Reestructuración CRr
                          </div>
                          <div className="font-bold text-violet-300">
                            {formatNumber(dynamics.crr[j], d)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {stil.interpretation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. COCIENTES Y COEFICIENTES DE VARIACIÓN rij y rj */}
      {layoutMode === 'matrix' && (
        <>
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
            <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-white">
                    1. Cocientes de Variación Sectorial (rᵢⱼ) y Coeficientes de
                    Variación Regional (rⱼ)
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono tabular-nums">
                    rᵢⱼ = Vᵢⱼ(t) / Vᵢⱼ(0) &nbsp;|&nbsp; rⱼ = Σᵢ Vᵢⱼ(t) / Σᵢ
                    Vᵢⱼ(0) — Dinámica de {config.year0Label} a{' '}
                    {config.year1Label}
                  </p>
                </div>
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
                        className="py-2.5 px-3 text-right font-bold text-xs uppercase min-w-[115px]"
                      >
                        {reg}
                        <span className="block text-[10px] font-normal text-zinc-400">
                          V(t)/V(0) (rᵢⱼ)
                        </span>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-violet-950/30 text-violet-200 border-l border-violet-500/20 min-w-[130px]">
                      {config.baseTotalName}
                      <span className="block text-[10px] font-normal text-violet-400">
                        rᵢ(base) = ΣⱼV(t)/ΣⱼV(0)
                      </span>
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
                          <div className="text-[11px] font-mono tabular-nums text-zinc-500 mb-0.5">
                            {formatNumber(structT1.matrix[i][j], 0)} /{' '}
                            {formatNumber(structT0.matrix[i][j], 0)}
                          </div>
                          {formatRateBadge(dynamics.rij[i][j])}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right bg-violet-950/15 border-l border-violet-500/20">
                        <div className="text-[11px] font-mono tabular-nums text-violet-400 mb-0.5">
                          {formatNumber(structT1.sectorTotals[i], 0)} /{' '}
                          {formatNumber(structT0.sectorTotals[i], 0)}
                        </div>
                        {formatRateBadge(dynamics.riNac[i])}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-900 font-bold border-t border-white/10 text-white">
                    <td className="sticky left-0 z-10 bg-zinc-900 py-3 px-3 text-xs uppercase border-r border-white/[0.05]">
                      Coeficiente de Variación Regional (rⱼ)
                    </td>
                    {config.regions.map((_, j) => (
                      <td key={j} className="py-3 px-3 text-right">
                        <div className="text-[11px] font-mono tabular-nums text-zinc-400 mb-0.5">
                          {formatNumber(structT1.regionTotals[j], 0)} /{' '}
                          {formatNumber(structT0.regionTotals[j], 0)}
                        </div>
                        {formatRateBadge(dynamics.rj[j])}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right bg-violet-950/40 border-l border-violet-500/30">
                      <div className="text-[11px] font-mono tabular-nums text-violet-300 mb-0.5">
                        {formatNumber(structT1.grandTotal, 0)} /{' '}
                        {formatNumber(structT0.grandTotal, 0)}
                      </div>
                      {formatRateBadge(dynamics.rNac)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 2 y 3. REESTRUCTURACIÓN (CRr) Y REDISTRIBUCIÓN (CRs) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* CRr */}
            <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
              <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-3.5 flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-violet-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    2. Coeficiente de Reestructuración Regional (CRr)
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono tabular-nums">
                    CRrⱼ = ½ Σᵢ | (Vᵢⱼ(t)/ΣᵢVᵢⱼ(t)) - (Vᵢⱼ(0)/ΣᵢVᵢⱼ(0)) |
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                      <th className="sticky left-0 z-10 bg-zinc-900 py-2 px-2 text-left font-bold min-w-[140px] border-r border-white/[0.05]">
                        SEC \ REG
                      </th>
                      {config.regions.map((reg, j) => (
                        <th
                          key={j}
                          className="py-2 px-2 text-right font-bold min-w-[100px]"
                        >
                          {reg} (Δ y |Δ|)
                        </th>
                      ))}
                      <th className="py-2 px-2 text-right font-bold bg-zinc-950/60 border-l border-white/[0.06]">
                        Σⱼ SEC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums">
                    {config.sectors.map((sec, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="sticky left-0 z-10 bg-[#121214] py-2 px-2 font-sans font-semibold text-zinc-200 border-r border-white/[0.05]">
                          {sec}
                        </td>
                        {config.regions.map((_, j) => {
                          const signed = dynamics.crrDiffSigned[i][j];
                          const absV = dynamics.crrDiffAbs[i][j];
                          return (
                            <td key={j} className="py-2 px-2 text-right">
                              <div
                                className={
                                  signed >= 0
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }
                              >
                                {signed > 0
                                  ? `+${formatNumber(signed, d)}`
                                  : formatNumber(signed, d)}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                |{formatNumber(absV, d)}|
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-right bg-zinc-950/40 border-l border-white/[0.05] text-zinc-400">
                          {formatNumber(dynamics.crrDiffSignedBase[i], d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-white/10 font-mono tabular-nums">
                    <tr className="bg-zinc-900 font-bold text-zinc-300">
                      <td className="sticky left-0 z-10 bg-zinc-900 py-2 px-2 font-sans border-r border-white/[0.05]">
                        Ajuste (Σᵢ |Δ|)
                      </td>
                      {config.regions.map((_, j) => (
                        <td key={j} className="py-2 px-2 text-right">
                          {formatNumber(dynamics.crrAdjustmentSum[j], d)}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right bg-zinc-900 border-l border-white/[0.06]">
                        0.0000
                      </td>
                    </tr>
                    <tr className="bg-violet-950/35 font-extrabold text-violet-300 text-sm border-t border-violet-500/20">
                      <td className="sticky left-0 z-10 bg-[#1a1429] py-2.5 px-2 font-sans border-r border-white/[0.05]">
                        CRrⱼ = Ajuste / 2
                      </td>
                      {config.regions.map((_, j) => (
                        <td key={j} className="py-2.5 px-2 text-right">
                          {formatNumber(dynamics.crr[j], d)}
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-right bg-violet-950/20 border-l border-violet-500/20">
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* CRs */}
            <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
              <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-3.5 flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    3. Coeficiente de Redistribución Sectorial (CRs)
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono tabular-nums">
                    CRsᵢ = ½ Σⱼ | (Vᵢⱼ(t)/ΣⱼVᵢⱼ(t)) - (Vᵢⱼ(0)/ΣⱼVᵢⱼ(0)) |
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                      <th className="sticky left-0 z-10 bg-zinc-900 py-2 px-2 text-left font-bold min-w-[140px] border-r border-white/[0.05]">
                        SEC \ REG
                      </th>
                      {config.regions.map((reg, j) => (
                        <th
                          key={j}
                          className="py-2 px-2 text-right font-bold min-w-[95px]"
                        >
                          {reg}
                        </th>
                      ))}
                      <th className="py-2 px-2 text-right font-bold bg-zinc-950/60">
                        Ajuste Σⱼ|Δ|
                      </th>
                      <th className="py-2 px-2 text-right font-bold bg-teal-500/15 text-teal-300">
                        CRsᵢ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums">
                    {config.sectors.map((sec, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="sticky left-0 z-10 bg-[#121214] py-2 px-2 font-sans font-semibold text-zinc-200 border-r border-white/[0.05]">
                          {sec}
                        </td>
                        {config.regions.map((_, j) => {
                          const signed = dynamics.crsDiffSigned[i][j];
                          const absV = dynamics.crsDiffAbs[i][j];
                          return (
                            <td key={j} className="py-2 px-2 text-right">
                              <div
                                className={
                                  signed >= 0
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }
                              >
                                {signed > 0
                                  ? `+${formatNumber(signed, d)}`
                                  : formatNumber(signed, d)}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                |{formatNumber(absV, d)}|
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-right bg-zinc-950/40 text-zinc-300 font-semibold">
                          {formatNumber(dynamics.crsAdjustmentSum[i], d)}
                        </td>
                        <td className="py-2 px-2 text-right bg-teal-500/10 font-extrabold text-teal-300 text-sm">
                          {formatNumber(dynamics.crs[i], d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. MÉTODO DIFERENCIAL-ESTRUCTURAL TRADICIONAL (SHIFT-SHARE) */}
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
            <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-white">
                    4. Método Diferencial-Estructural Tradicional (Shift-Share)
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono tabular-nums">
                    ETⱼ = ΣᵢVᵢⱼ(t) - [ΣᵢVᵢⱼ(0) × r_global] &nbsp;|&nbsp; EDⱼ =
                    Σᵢ[Vᵢⱼ(t) - (Vᵢⱼ(0) × rᵢ(base))] &nbsp;|&nbsp; EEⱼ = ETⱼ -
                    EDⱼ
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-6">
              {/* Desglose sectorial del Efecto Diferencial EDij */}
              <div className="overflow-x-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Desglose Sectorial del Efecto Diferencial: EDᵢⱼ = Vᵢⱼ(t) -
                  [Vᵢⱼ(0) × rᵢ(base)]
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                      <th className="sticky left-0 z-10 bg-zinc-900 py-2 px-3 text-left font-bold text-xs min-w-[150px] border-r border-white/[0.05]">
                        SEC \ REG
                      </th>
                      {config.regions.map((reg, j) => (
                        <th
                          key={j}
                          className="py-2 px-3 text-right font-bold text-xs min-w-[110px]"
                        >
                          {reg}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums text-xs">
                    {config.sectors.map((sec, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="sticky left-0 z-10 bg-[#121214] py-2 px-3 font-sans font-semibold text-zinc-200 border-r border-white/[0.05]">
                          {sec}{' '}
                          <span className="text-[11px] font-mono tabular-nums font-normal text-zinc-500">
                            (rᵢ = {formatNumber(dynamics.riNac[i], d)})
                          </span>
                        </td>
                        {config.regions.map((_, j) => {
                          const val = dynamics.edMatrix[i][j];
                          return (
                            <td
                              key={j}
                              className={`py-2 px-3 text-right font-semibold ${
                                val >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
                </table>
              </div>

              {/* Tabla Resumen ET, ED, EE */}
              <div className="overflow-x-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Resumen de Efectos Shift-Share Tradicional y Clasificación en
                  los 6 Tipos de Regiones
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-200 border-b border-white/10">
                      <th className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[130px] border-r border-white/[0.05]">
                        Región
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                        Efecto Diferencial (EDⱼ)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                        Efecto Estructural (EEⱼ)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-violet-950/40 text-violet-200">
                        Efecto Total (ETⱼ = EDⱼ + EEⱼ)
                      </th>
                      <th className="py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[220px]">
                        Diagnóstico Automático (Tipos 1 al 6)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {config.regions.map((reg, j) => {
                      const diag = dynamics.traditionalDiagnosis[j];
                      return (
                        <tr key={j} className="hover:bg-white/[0.02]">
                          <td className="sticky left-0 z-10 bg-[#121214] py-3 px-3 font-bold text-white border-r border-white/[0.05]">
                            {reg}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                              dynamics.ed[j] >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {dynamics.ed[j] > 0
                              ? `+${formatNumber(dynamics.ed[j], d)}`
                              : formatNumber(dynamics.ed[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                              dynamics.ee[j] >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {dynamics.ee[j] > 0
                              ? `+${formatNumber(dynamics.ee[j], d)}`
                              : formatNumber(dynamics.ee[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono tabular-nums font-extrabold text-base bg-violet-950/20 ${
                              dynamics.et[j] >= 0
                                ? 'text-emerald-300'
                                : 'text-rose-300'
                            }`}
                          >
                            {dynamics.et[j] > 0
                              ? `+${formatNumber(dynamics.et[j], d)}`
                              : formatNumber(dynamics.et[j], d)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                diag.category === 'Ganadora'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                              }`}
                            >
                              {diag.category === 'Ganadora' ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                              )}
                              {diag.shortTitle}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas de Diagnóstico Tradicional y Política Económica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {config.regions.map((reg, j) => {
                  const diag = dynamics.traditionalDiagnosis[j];
                  const isWin = diag.category === 'Ganadora';
                  return (
                    <div
                      key={j}
                      className={`p-4 rounded-2xl border ${
                        isWin
                          ? 'bg-emerald-500/[0.06] border-emerald-500/25'
                          : 'bg-rose-500/[0.06] border-rose-500/25'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {reg}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isWin
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          Tipo {diag.typeNumber} ({diag.category})
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {diag.description}
                      </p>
                      <div className="pt-2 border-t border-white/10 text-xs">
                        <strong className="text-emerald-300 block mb-0.5">
                          Política Recomendada:
                        </strong>
                        <span className="text-zinc-300">
                          {diag.policyRecommendation}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. MÉTODO DIFERENCIAL-ESTRUCTURAL MODIFICADO (STILWELL) */}
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
            <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-white">
                    5. Método Diferencial-Estructural Modificado (Stilwell)
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono tabular-nums">
                    EEMⱼ = EIⱼ - EEⱼ &nbsp;|&nbsp; ERMⱼ = EDⱼ - EEMⱼ = ETⱼ -
                    EIⱼ &nbsp;|&nbsp; ETMⱼ (ERMⱼ - EEMⱼ y ERMⱼ + EEMⱼ)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStilwellCatalog(!showStilwellCatalog)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-500/15 hover:bg-violet-500/25 text-xs font-bold text-violet-200 border border-violet-500/30 transition cursor-pointer no-print"
              >
                <BookOpen className="w-3.5 h-3.5" />
                {showStilwellCatalog
                  ? 'Ocultar Catálogo 14 Tipos'
                  : 'Ver Catálogo 14 Tipos de Stilwell'}
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-6">
              {/* Desglose sectorial EIij */}
              <div className="overflow-x-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Desglose Sectorial del Efecto Estructural Inverso (EIᵢⱼ):{' '}
                  {config.stilwellMode === 'slide_37'
                    ? 'Vᵢⱼ(t) × [r_global - rᵢ(base)] (Diferencial Global-Sectorial)'
                    : 'Vᵢⱼ(t) × [rᵢ(base) - r_global] (Variante Estándar)'}
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                      <th className="sticky left-0 z-10 bg-zinc-900 py-2 px-3 text-left font-bold text-xs min-w-[150px] border-r border-white/[0.05]">
                        SEC \ REG
                      </th>
                      {config.regions.map((reg, j) => (
                        <th
                          key={j}
                          className="py-2 px-3 text-right font-bold text-xs min-w-[110px]"
                        >
                          {reg}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right font-bold text-xs bg-zinc-950/60 border-l border-white/[0.06]">
                        Σⱼ EIᵢⱼ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums text-xs">
                    {config.sectors.map((sec, i) => {
                      const rowSum = dynamics.eiMatrix[i].reduce(
                        (a, b) => a + b,
                        0
                      );
                      return (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="sticky left-0 z-10 bg-[#121214] py-2 px-3 font-sans font-semibold text-zinc-200 border-r border-white/[0.05]">
                            {sec}
                          </td>
                          {config.regions.map((_, j) => {
                            const val = dynamics.eiMatrix[i][j];
                            return (
                              <td
                                key={j}
                                className={`py-2 px-3 text-right font-semibold ${
                                  val >= 0
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {val > 0
                                  ? `+${formatNumber(val, d)}`
                                  : formatNumber(val, d)}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right bg-zinc-950/40 border-l border-white/[0.05] text-zinc-400">
                            {formatNumber(rowSum, d)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-900 font-bold font-mono tabular-nums text-xs border-t border-white/10 text-white">
                      <td className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 font-sans border-r border-white/[0.05]">
                        Efecto Estructural Inverso Total (EIⱼ = Σᵢ EIᵢⱼ)
                      </td>
                      {config.regions.map((_, j) => (
                        <td
                          key={j}
                          className="py-2.5 px-3 text-right text-sm text-violet-300"
                        >
                          {formatNumber(dynamics.ei[j], d)}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right bg-zinc-950 border-l border-white/[0.06]">
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tabla maestra de efectos modificados */}
              <div className="overflow-x-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Síntesis de Efectos Modificados y Tipología de Stilwell (Tipos
                  1 al 14)
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-200 border-b border-white/10">
                      <th className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 text-left font-bold text-xs min-w-[120px] border-r border-white/[0.05]">
                        Región
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs">
                        EEⱼ (Inicial)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs">
                        EIⱼ (Inverso)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs">
                        EEMⱼ = EIⱼ - EEⱼ
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs bg-violet-950/40 text-violet-200">
                        ERMⱼ = EDⱼ - EEMⱼ
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs bg-zinc-950/60">
                        ETⱼ - EIⱼ
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs">
                        ETMⱼ (ERM - EEM)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs bg-zinc-950/60">
                        ETMⱼ (ERM + EEM)
                      </th>
                      <th className="py-2.5 px-3 text-left font-bold text-xs min-w-[180px]">
                        Tipología Stilwell (1-14)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums text-xs">
                    {config.regions.map((reg, j) => {
                      const stDiag = dynamics.stilwellDiagnosis[j];
                      const isWin = dynamics.erm[j] >= 0;
                      return (
                        <tr key={j} className="hover:bg-white/[0.02]">
                          <td className="sticky left-0 z-10 bg-[#121214] py-3 px-3 font-sans font-bold text-white text-sm border-r border-white/[0.05]">
                            {reg}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-300">
                            {formatNumber(dynamics.ee[j], d)}
                          </td>
                          <td className="py-3 px-3 text-right text-zinc-300">
                            {formatNumber(dynamics.ei[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold ${
                              dynamics.eem[j] >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatNumber(dynamics.eem[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-extrabold text-sm bg-violet-950/20 ${
                              isWin ? 'text-emerald-300' : 'text-rose-300'
                            }`}
                          >
                            {formatNumber(dynamics.erm[j], d)}
                          </td>
                          <td className="py-3 px-3 text-right bg-zinc-950/40 text-zinc-300 font-semibold">
                            {formatNumber(dynamics.ermVerification[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold ${
                              dynamics.etm[j] >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatNumber(dynamics.etm[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold bg-zinc-950/40 ${
                              dynamics.etmSum[j] >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatNumber(dynamics.etmSum[j], d)}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center w-fit px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                                  isWin
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                                }`}
                              >
                                Tipo {stDiag.typeNumber} — {stDiag.category}
                              </span>
                              <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                                {stDiag.conditionText}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Catálogo de referencia de los 14 tipos de Stilwell */}
              {showStilwellCatalog && (
                <div className="mt-4 p-4 rounded-2xl bg-[#18181B] border border-white/[0.07]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-3">
                    Catálogo Metodológico de la Tipología de Stilwell (Tipos 1
                    al 14)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {STILWELL_REFERENCE_TABLE.map((row) => (
                      <div
                        key={row.t}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] font-mono tabular-nums"
                      >
                        <span className="font-bold text-violet-300 w-16">
                          Tipo {row.t}
                        </span>
                        <span className="text-zinc-400">
                          EE({row.ee}) EEM({row.eem}) ERM({row.erm})
                        </span>
                        <span className="text-zinc-200 font-semibold">
                          {row.cond}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
