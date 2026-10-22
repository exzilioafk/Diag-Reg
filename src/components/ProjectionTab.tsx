import React, { useState } from 'react';
import {
  Rocket,
  Calculator,
  CheckCircle2,
  Sliders,
  Info,
  TrendingUp,
  Table2,
  LayoutGrid,
  CalendarOff,
} from 'lucide-react';
import {
  ProjectionGrowthMethod,
  ProjectionResult,
  StudyConfig,
} from '../types/regional';
import { formatNumber } from '../utils/mathEngine';
import { DEFAULT_MORELIA_ANNUAL_SERIES } from '../data/presets';

interface ProjectionTabProps {
  config: StudyConfig;
  projection: ProjectionResult;
  onChangeConfig: (newConfig: StudyConfig) => void;
}

export const ProjectionTab: React.FC<ProjectionTabProps> = ({
  config,
  projection,
  onChangeConfig,
}) => {
  const [layoutMode, setLayoutMode] = useState<'matrix' | 'cards'>('matrix');
  const d = config.displayDecimals;
  const annualSeries =
    config.projection.annualSeries || DEFAULT_MORELIA_ANNUAL_SERIES;

  return (
    <div className="space-y-6">
      {/* QUICK PROJECTION CONTROLS & MOBILE VIEW TOGGLE BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
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
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Vista de Tarjetas por Región
              </button>
            </div>
          </div>

          {config.periodType === '2_periods' && (
            <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="px-2 font-semibold text-slate-600">
                Año Base (Qᵢⱼ &gt; 1):
              </span>
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    projection: { ...config.projection, basePeriod: 't1' },
                  })
                }
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  config.projection.basePeriod === 't1'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {config.year1Label} (t₁)
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    projection: { ...config.projection, basePeriod: 't0' },
                  })
                }
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  config.projection.basePeriod === 't0'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {config.year0Label} (t₀)
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              Método de Crecimiento Proyectado
            </label>
            <select
              value={config.projection.method}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  projection: {
                    ...config.projection,
                    method: e.target.value as ProjectionGrowthMethod,
                  },
                })
              }
              className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800"
            >
              <option value="manual_percent">
                Método 1: Tasa Porcentual Directa (%)
              </option>
              <option value="annual_series_avg">
                Método 2: Promedio Tasas Anuales (Exclusión Atípicos)
              </option>
              {config.periodType === '2_periods' && (
                <option value="historical_dynamic">
                  Método 3: Tasa Derivada de t₀ → t₁
                </option>
              )}
              <option value="manual_absolute">
                Método 4: Monto Absoluto Manual (ΔE_B)
              </option>
            </select>
          </div>

          {config.projection.method === 'manual_percent' && (
            <>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Tasa Proyectada (Δ% E_B)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={config.projection.manualPercent}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        projection: {
                          ...config.projection,
                          manualPercent: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full min-h-[44px] pr-8 pl-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Criterio de Aplicación
                </label>
                <select
                  value={config.projection.manualPercentCriterion}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      projection: {
                        ...config.projection,
                        manualPercentCriterion: e.target.value as
                          | 'criterion_a_multiplier_rate'
                          | 'criterion_b_base_proportion',
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                >
                  <option value="criterion_a_multiplier_rate">
                    Δ% E_T = Multiplicador × Δ% E_B (Aplicado a PEO Total)
                  </option>
                  <option value="criterion_b_base_proportion">
                    ΔE_B = E_B × (g/100) ⇒ ΔE_T = Mⱼ × ΔE_B
                  </option>
                </select>
              </div>
            </>
          )}

          {config.projection.method === 'annual_series_avg' &&
            projection.annualSeriesSummary && (
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">
                    Cociente Promedio (r̄)
                  </div>
                  <div className="font-mono font-extrabold text-sm text-emerald-950">
                    {formatNumber(
                      projection.annualSeriesSummary.averageRatio,
                      6
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="text-[10px] font-bold uppercase text-indigo-700">
                    Tasa Básica (Δ% E_B)
                  </div>
                  <div className="font-mono font-extrabold text-sm text-indigo-950">
                    +
                    {formatNumber(
                      projection.annualSeriesSummary.impliedPercent,
                      4
                    )}
                    %
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                    <CalendarOff className="w-3 h-3" /> Excluidos (
                    {projection.annualSeriesSummary.excludedYears.length})
                  </div>
                  <div className="text-[11px] font-semibold text-amber-950 truncate">
                    {projection.annualSeriesSummary.excludedYears.join(', ') ||
                      'Ninguno'}
                  </div>
                </div>
              </div>
            )}

          {config.projection.method === 'historical_dynamic' && (
            <>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Tasa Histórica Observada
                </label>
                <select
                  value={config.projection.historicalRateType}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      projection: {
                        ...config.projection,
                        historicalRateType: e.target.value as
                          | 'period_total'
                          | 'cagr_annual',
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="period_total">
                    Tasa Total del Periodo ((Vt/V0) - 1)
                  </option>
                  <option value="cagr_annual">
                    Tasa Media de Crecimiento Anual (TMCA)
                  </option>
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Referencia de Tasa
                </label>
                <select
                  value={config.projection.historicalRateSource}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      projection: {
                        ...config.projection,
                        historicalRateSource: e.target.value as
                          | 'national_rate'
                          | 'regional_rate',
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="regional_rate">
                    Tasa Observada de cada Región (rⱼ)
                  </option>
                  <option value="national_rate">
                    Tasa del Total Base ({config.baseTotalName})
                  </option>
                </select>
              </div>
            </>
          )}

          {config.projection.method === 'manual_absolute' && (
            <div className="md:col-span-8 flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Incremento Absoluto en Actividad Básica (ΔE_B)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={config.projection.singleManualAbsoluteValue}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      projection: {
                        ...config.projection,
                        useSingleManualAbsolute: true,
                        singleManualAbsoluteValue:
                          parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Interactive Outlier Exclusion Chips when Method 2 is active */}
        {config.projection.method === 'annual_series_avg' && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-600 mb-2">
              Serie Anual Activa (Toca cualquier año para incluirlo o excluirlo
              como atípico):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {annualSeries.slice(1).map((pt, idx) => {
                const realIdx = idx + 1;
                return (
                  <button
                    key={realIdx}
                    type="button"
                    onClick={() => {
                      const next = [...annualSeries];
                      next[realIdx] = { ...pt, excluded: !pt.excluded };
                      onChangeConfig({
                        ...config,
                        projection: {
                          ...config.projection,
                          annualSeries: next,
                        },
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                      pt.excluded
                        ? 'bg-rose-50 text-rose-600 border-rose-200 line-through'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    {pt.year}: r={formatNumber(pt.rateRatio, 4)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE / VERTICAL CARDS BY REGION VIEW */}
      {layoutMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projection.regions.map((r, j) => {
            const basicSectors = config.sectors
              .map((s, i) => ({
                name: s,
                x: r.basicBySector[i],
                q: projection.qijUsed[i][j],
                v: projection.vijUsed[i][j],
              }))
              .filter((item) => item.x > 0);

            return (
              <div
                key={j}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Proyección de Base Exportadora ({projection.periodLabel})
                    </span>
                    <h4 className="font-extrabold text-base">{r.regionName}</h4>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-[10px] text-emerald-200">
                      Multiplicador Mⱼ
                    </div>
                    <div className="text-base font-extrabold text-emerald-300">
                      M = {formatNumber(r.multiplierM, d)}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-sans text-slate-500">
                        Total Actual (E_T)
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {formatNumber(r.totalEmploymentET, 2)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-sans text-emerald-700">
                        Básica (E_B)
                      </div>
                      <div className="font-bold text-emerald-950 mt-0.5">
                        {formatNumber(r.totalBasicEB, d)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-sans text-slate-500">
                        No Básica (E_NB)
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {formatNumber(r.totalNonBasicENB, d)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                      <div className="text-[10px] font-sans text-indigo-700">
                        Impacto % (Mⱼ×Δ%E_B)
                      </div>
                      <div className="font-extrabold text-indigo-950 mt-0.5">
                        +{formatNumber(r.deltaETPercent, 2)}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300">
                      <div className="text-[10px] font-sans text-emerald-800">
                        Incremento (ΔE_T)
                      </div>
                      <div className="font-extrabold text-emerald-950 mt-0.5">
                        +{formatNumber(r.deltaET, d)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                      <div className="text-[10px] font-sans text-slate-300">
                        Nuevo Total Proyectado
                      </div>
                      <div className="font-extrabold text-emerald-300 mt-0.5">
                        {formatNumber(r.newProjectedTotal, d)}
                      </div>
                    </div>
                  </div>

                  {/* Sectores básicos identificados */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-700">
                      Sectores Básicos Exportadores (Qᵢⱼ &gt; 1):
                    </div>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                      {basicSectors.map((bs, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-emerald-50/40 flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-slate-800">
                            {bs.name}
                          </span>
                          <span className="font-mono font-bold text-emerald-900 shrink-0">
                            Xᵢⱼ = {formatNumber(bs.x, d)} (Q=
                            {formatNumber(bs.q, 2)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. CANTIDAD EXPORTABLE BÁSICA (Xij) */}
      {layoutMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
          <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm md:text-base">
                  1. Actividad Básica Exportable por Sector (Xᵢⱼ) y
                  Multiplicador Básico (Mⱼ) — {projection.periodLabel}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Si Qᵢⱼ &gt; 1 ⇒ Xᵢⱼ = (1 - (1 / Qᵢⱼ)) × Vᵢⱼ &nbsp;|&nbsp; E_Bj
                  = Σᵢ Xᵢⱼ &nbsp;|&nbsp; Mⱼ = Σᵢ Vᵢⱼ / E_Bj
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
                      className="py-2.5 px-3 text-right font-bold text-xs uppercase min-w-[125px]"
                    >
                      {reg}
                      <span className="block text-[10px] font-normal text-slate-500">
                        Actividad Básica Xᵢⱼ (y Qᵢⱼ)
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white py-2.5 px-3 font-sans font-semibold text-slate-800 text-xs sm:text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      {sec}
                    </td>
                    {config.regions.map((_, j) => {
                      const xVal = projection.xijMatrix[i][j];
                      const qVal = projection.qijUsed[i][j];
                      const vVal = projection.vijUsed[i][j];
                      const isBasic = xVal > 0;
                      return (
                        <td key={j} className="py-2.5 px-3 text-right">
                          {isBasic ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {formatNumber(xVal, d)}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Q={formatNumber(qVal, 2)} | V=
                                {formatNumber(vVal, 0)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-400 text-xs">0</span>
                              <div className="text-[10px] text-slate-400">
                                (Q={formatNumber(qVal, 2)} ≤ 1)
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 font-mono text-xs">
                <tr className="bg-emerald-50 font-extrabold text-emerald-950 text-sm">
                  <td className="sticky left-0 z-10 bg-emerald-50 py-2.5 px-3 font-sans">
                    Suma Básica Regional (E_Bj = Σᵢ Xᵢⱼ)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(r.totalBasicEB, d)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50 font-semibold text-slate-700">
                  <td className="sticky left-0 z-10 bg-slate-50 py-2 px-3 font-sans">
                    Actividad No Básica (E_NBj = Σᵢ Vᵢⱼ - E_Bj)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td key={j} className="py-2 px-3 text-right">
                      {formatNumber(r.totalNonBasicENB, d)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="sticky left-0 z-10 bg-slate-100 py-2 px-3 font-sans">
                    Actividad Regional Total (E_Tj = Σᵢ Vᵢⱼ)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td key={j} className="py-2 px-3 text-right">
                      {formatNumber(r.totalEmploymentET, 2)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-indigo-950 text-white font-extrabold text-sm">
                  <td className="sticky left-0 z-10 bg-indigo-950 py-3 px-3 font-sans">
                    Multiplicador Básico Regional (Mⱼ = Σᵢ Vᵢⱼ / E_Bj)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td
                      key={j}
                      className="py-3 px-3 text-right text-emerald-300"
                    >
                      {formatNumber(r.multiplierM, d)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. RESULTADOS DE LA PROYECCIÓN PRODUCTIVA E INTERPRETACIÓN TÉCNICA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-break-inside-avoid">
        <div className="bg-emerald-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm md:text-base">
                2. Proyección del Empleo / Producción Regional e Interpretación
                Técnica
              </h3>
              <p className="text-xs text-emerald-100 font-mono">
                Δ% E_Tj = Mⱼ × Δ% E_Bj &nbsp;|&nbsp; Nuevo Total Regional = E_Tj
                + ΔE_Tj
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-100 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[120px]">
                    Región
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                    Total Actual (E_Tj)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                    Básica (E_Bj)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                    No Básica (E_NBj)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-indigo-50 text-indigo-950">
                    Multiplicador (Mⱼ)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                    Tasa Básica (Δ% E_B)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-emerald-50 text-emerald-950">
                    Impacto % (Mⱼ×Δ%E_B)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-emerald-100 text-emerald-950">
                    Incremento (ΔE_Tj)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-slate-900 text-white">
                    Nuevo Total Proyectado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs">
                {projection.regions.map((r, j) => (
                  <tr key={j} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white py-3 px-3 font-sans font-bold text-slate-900 text-sm">
                      {r.regionName}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatNumber(r.totalEmploymentET, 2)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      {formatNumber(r.totalBasicEB, d)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {formatNumber(r.totalNonBasicENB, d)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-indigo-950 bg-indigo-50/50 text-sm">
                      {formatNumber(r.multiplierM, d)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700">
                      {r.appliedGrowthRatePercent !== null
                        ? `${formatNumber(r.appliedGrowthRatePercent, 4)}%`
                        : `ΔEB=${formatNumber(r.deltaEB, 2)}`}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-800 bg-emerald-50/40">
                      +{formatNumber(r.deltaETPercent, 2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-950 bg-emerald-100/60 text-sm">
                      +{formatNumber(r.deltaET, d)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-950 bg-slate-100 text-sm">
                      {formatNumber(r.newProjectedTotal, d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUSTITUCIÓN PASO A PASO Y PÁRRAFO DE INTERPRETACIÓN TÉCNICA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sustitución Paso a Paso y Párrafo Automático de Interpretación
              Técnica
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {projection.regions.map((r, j) => {
                const basicSectorsList = config.sectors
                  .map((s, idx) => ({
                    name: s,
                    x: r.basicBySector[idx],
                  }))
                  .filter((item) => item.x > 0);

                return (
                  <div
                    key={j}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-900">
                          {r.regionName} — Multiplicador Básico M ={' '}
                          {formatNumber(r.multiplierM, 2)}
                        </span>
                      </div>
                      <span className="text-xs font-mono bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                        E_NB / E_T = {formatNumber(r.totalNonBasicENB, 2)} /{' '}
                        {formatNumber(r.totalEmploymentET, 2)} ={' '}
                        {formatNumber(r.nonBasicRatio, 4)} &nbsp;⇒&nbsp; M = 1 /
                        (1 - {formatNumber(r.nonBasicRatio, 4)}) ={' '}
                        {formatNumber(r.multiplierM, d)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
                      {r.stepByStepFormula} &nbsp;⇒&nbsp; Nuevo Total ={' '}
                      {formatNumber(r.totalEmploymentET, 2)} +{' '}
                      {formatNumber(r.deltaET, d)} ={' '}
                      <strong>{formatNumber(r.newProjectedTotal, d)}</strong>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-indigo-600 inline mr-1 -mt-0.5" />
                      <strong>Interpretación Técnica:</strong> En{' '}
                      <strong>{r.regionName}</strong>, la actividad básica
                      exportadora suma{' '}
                      <strong>
                        E_B = {formatNumber(r.totalBasicEB, 2)}
                      </strong>{' '}
                      ({formatNumber(r.basicRatio * 100, 2)}% del total
                      regional), impulsada por{' '}
                      {basicSectorsList.length > 0
                        ? basicSectorsList
                            .map((b) => `${b.name} (${formatNumber(b.x, 1)})`)
                            .join(', ')
                        : 'ningún sector básico'}
                      . Esto arroja un{' '}
                      <strong>
                        Multiplicador Básico Regional de M ={' '}
                        {formatNumber(r.multiplierM, 4)}
                      </strong>
                      : por cada unidad generada en los sectores básicos se
                      sostienen {formatNumber(r.multiplierM, 2)} unidades totales
                      en la economía. Al aplicar una tasa de incremento básico
                      de{' '}
                      <strong>
                        {r.appliedGrowthRatePercent !== null
                          ? `${formatNumber(r.appliedGrowthRatePercent, 4)}%`
                          : `ΔE_B = ${formatNumber(r.deltaEB, 2)}`}
                      </strong>
                      , el impacto porcentual multiplicado es de{' '}
                      <strong>+{formatNumber(r.deltaETPercent, 2)}%</strong>, lo
                      que representa un incremento absoluto de{' '}
                      <strong>
                        +{formatNumber(r.deltaET, 2)} unidades
                      </strong>{' '}
                      de {config.variableName}, proyectando un nuevo total
                      regional de{' '}
                      <strong>{formatNumber(r.newProjectedTotal, 2)}</strong>.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
