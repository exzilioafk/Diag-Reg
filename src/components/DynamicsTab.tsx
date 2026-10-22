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
} from 'lucide-react';
import {
  DynamicsResult,
  StructurePeriodResult,
  StudyConfig,
} from '../types/regional';
import { formatNumber } from '../utils/mathEngine';

interface DynamicsTabProps {
  config: StudyConfig;
  structT0: StructurePeriodResult;
  structT1: StructurePeriodResult;
  dynamics: DynamicsResult;
  onChangeConfig: (newConfig: StudyConfig) => void;
}

const STILWELL_REFERENCE_TABLE = [
  { t: 1, ee: '+', eem: '+', erm: '+', cond: 'Todos positivos (Ganadora óptima)' },
  { t: 2, ee: '-', eem: '-', erm: '-', cond: 'Todos negativos (Perdedora aguda)' },
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
  const [layoutMode, setLayoutMode] = useState<'matrix' | 'cards'>('matrix');
  const d = config.displayDecimals;

  const formatRateBadge = (r: number) => {
    const pct = (r - 1) * 100;
    const isGrowth = r > 1.0001;
    const isDrop = r < 0.9999;
    return (
      <div className="inline-flex flex-col items-end">
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
            isGrowth
              ? 'bg-emerald-100 text-emerald-900'
              : isDrop
              ? 'bg-rose-100 text-rose-900'
              : 'bg-slate-200 text-slate-800'
          }`}
        >
          {formatNumber(r, d)}
        </span>
        <span className="text-[10px] font-mono text-slate-500 mt-0.5">
          ({pct >= 0 ? `+${formatNumber(pct, 2)}%` : `${formatNumber(pct, 2)}%`})
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Control Bar: Mobile View Mode Toggle & Stilwell Formula Selector */}
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

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() =>
              onChangeConfig({ ...config, stilwellMode: 'slide_37' })
            }
            className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              config.stilwellMode === 'slide_37'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EIⱼ Clase: V(t)[r_global - rᵢ(base)]
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                stilwellMode: 'standard_stilwell',
              })
            }
            className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              config.stilwellMode === 'standard_stilwell'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EIⱼ Estándar: V(t)[rᵢ(base) - r_global]
          </button>
        </div>
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
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Ficha de Dinámica Regional ({config.year0Label} →{' '}
                        {config.year1Label})
                      </span>
                      <h4 className="font-extrabold text-base">{reg}</h4>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-400">
                        Variación Regional rⱼ
                      </div>
                      <div className="text-sm font-bold text-emerald-300">
                        {formatNumber(dynamics.rj[j], d)} (
                        {((dynamics.rj[j] - 1) * 100 >= 0 ? '+' : '') +
                          formatNumber((dynamics.rj[j] - 1) * 100, 2)}
                        %)
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Shift-Share Traditional Summary */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-600">
                          Shift-Share Tradicional
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isWin
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          Tipo {trad.typeNumber} ({trad.category})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                        <div className="p-2 rounded bg-white border border-slate-200">
                          <div className="text-[10px] font-sans text-slate-500">
                            ETⱼ (Total)
                          </div>
                          <div className="font-bold text-slate-900">
                            {formatNumber(dynamics.et[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-slate-200">
                          <div className="text-[10px] font-sans text-slate-500">
                            EDⱼ (Diferencial)
                          </div>
                          <div className="font-bold text-slate-900">
                            {formatNumber(dynamics.ed[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-slate-200">
                          <div className="text-[10px] font-sans text-slate-500">
                            EEⱼ (Estructural)
                          </div>
                          <div className="font-bold text-slate-900">
                            {formatNumber(dynamics.ee[j], d)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {trad.description}
                      </p>
                    </div>

                    {/* Stilwell Modified Summary */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-indigo-900">
                          Modificado de Stilwell
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-900 text-white">
                          Tipo {stil.typeNumber} ({stil.conditionText})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono text-xs">
                        <div className="p-2 rounded bg-white border border-indigo-100">
                          <div className="text-[10px] font-sans text-slate-500">
                            EIⱼ (Inverso)
                          </div>
                          <div className="font-bold">
                            {formatNumber(dynamics.ei[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-indigo-100">
                          <div className="text-[10px] font-sans text-slate-500">
                            EEMⱼ = EIⱼ - EEⱼ
                          </div>
                          <div className="font-bold">
                            {formatNumber(dynamics.eem[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-indigo-100">
                          <div className="text-[10px] font-sans text-slate-500">
                            ERMⱼ = EDⱼ - EEMⱼ
                          </div>
                          <div className="font-bold text-indigo-950">
                            {formatNumber(dynamics.erm[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-indigo-100">
                          <div className="text-[10px] font-sans text-slate-500">
                            ETMⱼ (ERM - EEM)
                          </div>
                          <div className="font-bold">
                            {formatNumber(dynamics.etm[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-indigo-100">
                          <div className="text-[10px] font-sans text-slate-500">
                            ETMⱼ (ERM + EEM)
                          </div>
                          <div className="font-bold">
                            {formatNumber(dynamics.etmSum[j], d)}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-white border border-indigo-100">
                          <div className="text-[10px] font-sans text-slate-500">
                            Reestructuración CRr
                          </div>
                          <div className="font-bold text-violet-900">
                            {formatNumber(dynamics.crr[j], d)}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
            <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    1. Cocientes de Variación Sectorial (rᵢⱼ) y Coeficientes de
                    Variación Regional (rⱼ)
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
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
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      SEC \ REG
                    </th>
                    {config.regions.map((reg, j) => (
                      <th
                        key={j}
                        className="py-2.5 px-3 text-right font-bold text-xs uppercase min-w-[115px]"
                      >
                        {reg}
                        <span className="block text-[10px] font-normal text-slate-500">
                          V(t)/V(0) (rᵢⱼ)
                        </span>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-indigo-50 text-indigo-950 border-l border-indigo-200 min-w-[130px]">
                      {config.baseTotalName}
                      <span className="block text-[10px] font-normal text-indigo-700">
                        rᵢ(base) = ΣⱼV(t)/ΣⱼV(0)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {config.sectors.map((sec, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 bg-white py-2.5 px-3 font-semibold text-slate-800 text-xs sm:text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        {sec}
                      </td>
                      {config.regions.map((_, j) => (
                        <td key={j} className="py-2 px-3 text-right">
                          <div className="text-[11px] font-mono text-slate-400 mb-0.5">
                            {formatNumber(structT1.matrix[i][j], 0)} /{' '}
                            {formatNumber(structT0.matrix[i][j], 0)}
                          </div>
                          {formatRateBadge(dynamics.rij[i][j])}
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right bg-indigo-50/40 border-l border-indigo-100">
                        <div className="text-[11px] font-mono text-indigo-400 mb-0.5">
                          {formatNumber(structT1.sectorTotals[i], 0)} /{' '}
                          {formatNumber(structT0.sectorTotals[i], 0)}
                        </div>
                        {formatRateBadge(dynamics.riNac[i])}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td className="sticky left-0 z-10 bg-slate-100 py-3 px-3 text-xs uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      Coeficiente de Variación Regional (rⱼ)
                    </td>
                    {config.regions.map((_, j) => (
                      <td key={j} className="py-3 px-3 text-right">
                        <div className="text-[11px] font-mono text-slate-500 mb-0.5">
                          {formatNumber(structT1.regionTotals[j], 0)} /{' '}
                          {formatNumber(structT0.regionTotals[j], 0)}
                        </div>
                        {formatRateBadge(dynamics.rj[j])}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right bg-indigo-100 border-l border-indigo-200">
                      <div className="text-[11px] font-mono text-indigo-700 mb-0.5">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    2. Coeficiente de Reestructuración Regional (CRr)
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    CRrⱼ = ½ Σᵢ | (Vᵢⱼ(t)/ΣᵢVᵢⱼ(t)) - (Vᵢⱼ(0)/ΣᵢVᵢⱼ(0)) |
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-100 py-2 px-2 text-left font-bold min-w-[140px]">
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
                      <th className="py-2 px-2 text-right font-bold bg-slate-50 border-l border-slate-200">
                        Σⱼ SEC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {config.sectors.map((sec, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="sticky left-0 z-10 bg-white py-2 px-2 font-sans font-semibold text-slate-800">
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
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }
                              >
                                {signed > 0
                                  ? `+${formatNumber(signed, d)}`
                                  : formatNumber(signed, d)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                |{formatNumber(absV, d)}|
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-right bg-slate-50/60 border-l border-slate-200 text-slate-600">
                          {formatNumber(dynamics.crrDiffSignedBase[i], d)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-300 font-mono">
                    <tr className="bg-slate-100 font-bold text-slate-800">
                      <td className="sticky left-0 z-10 bg-slate-100 py-2 px-2 font-sans">
                        Ajuste (Σᵢ |Δ|)
                      </td>
                      {config.regions.map((_, j) => (
                        <td key={j} className="py-2 px-2 text-right">
                          {formatNumber(dynamics.crrAdjustmentSum[j], d)}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right bg-slate-100 border-l border-slate-200">
                        0.0000
                      </td>
                    </tr>
                    <tr className="bg-indigo-50 font-extrabold text-indigo-950 text-sm border-t border-indigo-200">
                      <td className="sticky left-0 z-10 bg-indigo-50 py-2.5 px-2 font-sans">
                        CRrⱼ = Ajuste / 2
                      </td>
                      {config.regions.map((_, j) => (
                        <td key={j} className="py-2.5 px-2 text-right">
                          {formatNumber(dynamics.crr[j], d)}
                        </td>
                      ))}
                      <td className="py-2.5 px-2 text-right bg-indigo-100/50 border-l border-indigo-200">
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* CRs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    3. Coeficiente de Redistribución Sectorial (CRs)
                  </h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    CRsᵢ = ½ Σⱼ | (Vᵢⱼ(t)/ΣⱼVᵢⱼ(t)) - (Vᵢⱼ(0)/ΣⱼVᵢⱼ(0)) |
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-100 py-2 px-2 text-left font-bold min-w-[140px]">
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
                      <th className="py-2 px-2 text-right font-bold bg-slate-200/70">
                        Ajuste Σⱼ|Δ|
                      </th>
                      <th className="py-2 px-2 text-right font-bold bg-sky-100 text-sky-950">
                        CRsᵢ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {config.sectors.map((sec, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="sticky left-0 z-10 bg-white py-2 px-2 font-sans font-semibold text-slate-800">
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
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }
                              >
                                {signed > 0
                                  ? `+${formatNumber(signed, d)}`
                                  : formatNumber(signed, d)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                |{formatNumber(absV, d)}|
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-right bg-slate-50 font-semibold">
                          {formatNumber(dynamics.crsAdjustmentSum[i], d)}
                        </td>
                        <td className="py-2 px-2 text-right bg-sky-50 font-extrabold text-sky-950 text-sm">
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
            <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    4. Método Diferencial-Estructural Tradicional (Shift-Share)
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
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
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Desglose Sectorial del Efecto Diferencial: EDᵢⱼ = Vᵢⱼ(t) -
                  [Vᵢⱼ(0) × rᵢ(base)]
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-100 py-2 px-3 text-left font-bold text-xs min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
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
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {config.sectors.map((sec, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="sticky left-0 z-10 bg-white py-2 px-3 font-sans font-semibold text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                          {sec}{' '}
                          <span className="text-[11px] font-mono font-normal text-slate-400">
                            (rᵢ = {formatNumber(dynamics.riNac[i], d)})
                          </span>
                        </td>
                        {config.regions.map((_, j) => {
                          const val = dynamics.edMatrix[i][j];
                          return (
                            <td
                              key={j}
                              className={`py-2 px-3 text-right font-semibold ${
                                val >= 0 ? 'text-emerald-700' : 'text-rose-700'
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
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Resumen de Efectos Shift-Share Tradicional y Clasificación en
                  los 6 Tipos de Regiones
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="sticky left-0 z-10 bg-slate-800 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[130px]">
                        Región
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                        Efecto Diferencial (EDⱼ)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                        Efecto Estructural (EEⱼ)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-indigo-900">
                        Efecto Total (ETⱼ = EDⱼ + EEⱼ)
                      </th>
                      <th className="py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[220px]">
                        Diagnóstico Automático (Tipos 1 al 6)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {config.regions.map((reg, j) => {
                      const diag = dynamics.traditionalDiagnosis[j];
                      return (
                        <tr key={j} className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 bg-white py-3 px-3 font-bold text-slate-900">
                            {reg}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-bold ${
                              dynamics.ed[j] >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {dynamics.ed[j] > 0
                              ? `+${formatNumber(dynamics.ed[j], d)}`
                              : formatNumber(dynamics.ed[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-bold ${
                              dynamics.ee[j] >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {dynamics.ee[j] > 0
                              ? `+${formatNumber(dynamics.ee[j], d)}`
                              : formatNumber(dynamics.ee[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-mono font-extrabold text-base bg-indigo-50/60 ${
                              dynamics.et[j] >= 0
                                ? 'text-emerald-800'
                                : 'text-rose-800'
                            }`}
                          >
                            {dynamics.et[j] > 0
                              ? `+${formatNumber(dynamics.et[j], d)}`
                              : formatNumber(dynamics.et[j], d)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                diag.category === 'Ganadora'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
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
                      className={`p-4 rounded-xl border ${
                        isWin
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          {reg}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            isWin
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          Tipo {diag.typeNumber} ({diag.category})
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {diag.description}
                      </p>
                      <div className="pt-2 border-t border-slate-200/80 text-xs">
                        <strong className="text-slate-900 block mb-0.5">
                          Política Recomendada:
                        </strong>
                        <span className="text-slate-700">
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
            <div className="bg-indigo-950 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    5. Método Diferencial-Estructural Modificado (Stilwell)
                  </h3>
                  <p className="text-xs text-indigo-200 font-mono">
                    EEMⱼ = EIⱼ - EEⱼ &nbsp;|&nbsp; ERMⱼ = EDⱼ - EEMⱼ = ETⱼ -
                    EIⱼ &nbsp;|&nbsp; ETMⱼ (ERMⱼ - EEMⱼ y ERMⱼ + EEMⱼ)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStilwellCatalog(!showStilwellCatalog)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-xs font-semibold text-white border border-indigo-600 transition cursor-pointer no-print"
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
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Desglose Sectorial del Efecto Estructural Inverso (EIᵢⱼ):{' '}
                  {config.stilwellMode === 'slide_37'
                    ? 'Vᵢⱼ(t) × [r_global - rᵢ(base)] (Variante de Clase)'
                    : 'Vᵢⱼ(t) × [rᵢ(base) - r_global] (Variante Estándar)'}
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="sticky left-0 z-10 bg-slate-100 py-2 px-3 text-left font-bold text-xs min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
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
                      <th className="py-2 px-3 text-right font-bold text-xs bg-slate-50 border-l border-slate-200">
                        Σⱼ EIᵢⱼ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {config.sectors.map((sec, i) => {
                      const rowSum = dynamics.eiMatrix[i].reduce(
                        (a, b) => a + b,
                        0
                      );
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 bg-white py-2 px-3 font-sans font-semibold text-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                            {sec}
                          </td>
                          {config.regions.map((_, j) => {
                            const val = dynamics.eiMatrix[i][j];
                            return (
                              <td
                                key={j}
                                className={`py-2 px-3 text-right font-semibold ${
                                  val >= 0
                                    ? 'text-emerald-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {val > 0
                                  ? `+${formatNumber(val, d)}`
                                  : formatNumber(val, d)}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right bg-slate-50 border-l border-slate-200 text-slate-600">
                            {formatNumber(rowSum, d)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold font-mono text-xs border-t-2 border-slate-300">
                      <td className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 font-sans">
                        Efecto Estructural Inverso Total (EIⱼ = Σᵢ EIᵢⱼ)
                      </td>
                      {config.regions.map((_, j) => (
                        <td key={j} className="py-2.5 px-3 text-right text-sm">
                          {formatNumber(dynamics.ei[j], d)}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right bg-slate-200/60 border-l border-slate-300">
                        —
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Tabla maestra de efectos modificados */}
              <div className="overflow-x-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Síntesis de Efectos Modificados y Tipología de Stilwell
                  (Tipos 1 al 14)
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="sticky left-0 z-10 bg-slate-800 py-2.5 px-3 text-left font-bold text-xs min-w-[120px]">
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
                      <th className="py-2.5 px-3 text-right font-bold text-xs bg-indigo-900">
                        ERMⱼ = EDⱼ - EEMⱼ
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs bg-slate-700">
                        ETⱼ - EIⱼ
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs">
                        ETMⱼ (ERM - EEM)
                      </th>
                      <th className="py-2.5 px-3 text-right font-bold text-xs bg-slate-700">
                        ETMⱼ (ERM + EEM)
                      </th>
                      <th className="py-2.5 px-3 text-left font-bold text-xs min-w-[180px]">
                        Tipología Stilwell (1-14)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {config.regions.map((reg, j) => {
                      const stDiag = dynamics.stilwellDiagnosis[j];
                      const isWin = dynamics.erm[j] >= 0;
                      return (
                        <tr key={j} className="hover:bg-slate-50">
                          <td className="sticky left-0 z-10 bg-white py-3 px-3 font-sans font-bold text-slate-900 text-sm">
                            {reg}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {formatNumber(dynamics.ee[j], d)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {formatNumber(dynamics.ei[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold ${
                              dynamics.eem[j] >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {formatNumber(dynamics.eem[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-extrabold text-sm bg-indigo-50/70 ${
                              isWin ? 'text-emerald-800' : 'text-rose-800'
                            }`}
                          >
                            {formatNumber(dynamics.erm[j], d)}
                          </td>
                          <td className="py-3 px-3 text-right bg-slate-100 text-slate-700 font-semibold">
                            {formatNumber(dynamics.ermVerification[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold ${
                              dynamics.etm[j] >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {formatNumber(dynamics.etm[j], d)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold bg-slate-50 ${
                              dynamics.etmSum[j] >= 0
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {formatNumber(dynamics.etmSum[j], d)}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center w-fit px-2 py-0.5 rounded font-bold text-xs ${
                                  isWin
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}
                              >
                                Tipo {stDiag.typeNumber} — {stDiag.category}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
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
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                    Catálogo Oficial de la Tipología de Stilwell (Tipos 1 al 14)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {STILWELL_REFERENCE_TABLE.map((row) => (
                      <div
                        key={row.t}
                        className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 font-mono"
                      >
                        <span className="font-bold text-indigo-900 w-16">
                          Tipo {row.t}
                        </span>
                        <span className="text-slate-600">
                          EE({row.ee}) EEM({row.eem}) ERM({row.erm})
                        </span>
                        <span className="text-slate-800 font-semibold">
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
