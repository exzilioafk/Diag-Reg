import React from 'react';
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
  Sparkles,
} from 'lucide-react';
import {
  ProjectionGrowthMethod,
  ProjectionResult,
  StudyConfig,
} from '../types/regional';
import { formatNumber } from '../utils/mathEngine';
import { DEFAULT_MORELIA_ANNUAL_SERIES } from '../data/presets';
import { usePersistentState } from '../hooks/usePersistentState';

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
  const [layoutMode, setLayoutMode] = usePersistentState<'matrix' | 'cards'>(
    'diagnostico_regional_projection_layout_v2',
    'matrix'
  );
  const d = config.displayDecimals;
  const annualSeries =
    config.projection.annualSeries || DEFAULT_MORELIA_ANNUAL_SERIES;

  return (
    <div className="space-y-6">
      {/* QUICK PROJECTION CONTROLS & PILL CHIPS BAR */}
      <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-4 sm:p-5 shadow-xl space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 pl-1">
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
            <div className="inline-flex items-center gap-1.5 bg-zinc-950 p-1 rounded-full border border-white/[0.08] text-xs">
              <span className="px-2.5 font-semibold text-zinc-400">
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
                className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  config.projection.basePeriod === 't1'
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
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
                className={`px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  config.projection.basePeriod === 't0'
                    ? 'bg-violet-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {config.year0Label} (t₀)
              </button>
            </div>
          )}
        </div>

        {/* Pill Chip Selector for Projection Method */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Método de Crecimiento Proyectado (Píldoras de Simulación)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                {
                  id: 'manual_percent',
                  label: '1. Tasa Porcentual Directa (%)',
                  disabled: false,
                },
                {
                  id: 'annual_series_avg',
                  label: '2. Promedio Tasas Anuales (Exclusión Atípicos)',
                  disabled: false,
                },
                {
                  id: 'historical_dynamic',
                  label: '3. Tasa Derivada de t₀ → t₁',
                  disabled: config.periodType !== '2_periods',
                },
                {
                  id: 'manual_absolute',
                  label: '4. Monto Absoluto Manual (ΔE_B)',
                  disabled: false,
                },
              ] as {
                id: ProjectionGrowthMethod;
                label: string;
                disabled: boolean;
              }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={m.disabled}
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    projection: {
                      ...config.projection,
                      method: m.id,
                    },
                  })
                }
                className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  config.projection.method === m.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20'
                    : 'bg-[#18181B] text-zinc-300 border border-white/[0.08] hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Method Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-1">
          {config.projection.method === 'manual_percent' && (
            <>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
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
                    className="w-full min-h-[42px] pr-8 pl-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-emerald-300 font-mono tabular-nums text-xs font-bold focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-zinc-500">
                    %
                  </span>
                </div>
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
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
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-xs font-semibold text-zinc-200 focus:border-emerald-500 outline-none"
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
              <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">
                    Cociente Promedio (r̄)
                  </div>
                  <div className="font-mono tabular-nums font-extrabold text-sm text-white mt-0.5">
                    {formatNumber(
                      projection.annualSeriesSummary.averageRatio,
                      6
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/25">
                  <div className="text-[10px] font-bold uppercase text-violet-300">
                    Tasa Básica (Δ% E_B)
                  </div>
                  <div className="font-mono tabular-nums font-extrabold text-sm text-emerald-300 mt-0.5">
                    +
                    {formatNumber(
                      projection.annualSeriesSummary.impliedPercent,
                      4
                    )}
                    %
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <div className="text-[10px] font-bold uppercase text-amber-300 flex items-center gap-1">
                    <CalendarOff className="w-3 h-3" /> Excluidos (
                    {projection.annualSeriesSummary.excludedYears.length})
                  </div>
                  <div className="text-[11px] font-semibold text-amber-200 truncate mt-0.5">
                    {projection.annualSeriesSummary.excludedYears.join(', ') ||
                      'Ninguno'}
                  </div>
                </div>
              </div>
            )}

          {config.projection.method === 'historical_dynamic' && (
            <>
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
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
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-xs font-semibold text-zinc-200"
                >
                  <option value="period_total">
                    Tasa Total del Periodo ((Vt/V0) - 1)
                  </option>
                  <option value="cagr_annual">
                    Tasa Media de Crecimiento Anual (TMCA)
                  </option>
                </select>
              </div>
              <div className="md:col-span-6">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
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
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-xs font-semibold text-zinc-200"
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
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
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
                className="w-full min-h-[42px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-emerald-300 font-mono tabular-nums text-xs font-bold"
              />
            </div>
          )}
        </div>

        {/* Interactive Outlier Exclusion Pill Chips when Method 2 is active */}
        {config.projection.method === 'annual_series_avg' && (
          <div className="pt-2 border-t border-white/[0.07]">
            <div className="text-[11px] font-bold text-zinc-400 mb-2">
              Serie Anual Activa (Pulsa cualquier píldora para incluir o excluir
              el año como atípico):
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
                    className={`px-3 py-1.5 rounded-full text-xs font-mono tabular-nums font-semibold border transition cursor-pointer ${
                      pt.excluded
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 line-through'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
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

      {/* STORIES / STREAMING STATS BENTO FEED FOR REGIONAL MULTIPLIERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projection.regions.map((r, j) => {
          const basicPct = Math.min(
            100,
            Math.max(4, Math.round((r.basicRatio || 0) * 100))
          );
          const nonBasicPct = Math.max(0, 100 - basicPct);
          return (
            <div
              key={j}
              className="bg-gradient-to-br from-[#121214] via-[#18181B] to-emerald-950/30 backdrop-blur-xl rounded-3xl border border-emerald-500/25 p-5 flex flex-col justify-between gap-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    Impacto Exportador • {projection.periodLabel}
                  </span>
                  <h4 className="font-extrabold text-base sm:text-lg text-white mt-1.5">
                    {r.regionName}
                  </h4>
                  <div className="text-xs font-mono tabular-nums text-zinc-400">
                    Actual E_T:{' '}
                    <strong className="text-zinc-200">
                      {formatNumber(r.totalEmploymentET, 0)}
                    </strong>
                  </div>
                </div>

                {/* Circular SVG Gauge for Multiplier & Basic Share */}
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
                      strokeDasharray={`${Math.round((basicPct / 100) * 163.36)} 163.36`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums">
                    <span className="text-[11px] font-extrabold text-emerald-400">
                      {formatNumber(r.multiplierM, 2)}
                    </span>
                    <span className="text-[8px] text-zinc-400">Mⱼ</span>
                  </div>
                </div>
              </div>

              {/* Dual Bar: Basic vs Non-Basic */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-emerald-400 font-bold">
                    Básica E_B: {formatNumber(r.totalBasicEB, 1)} ({basicPct}%)
                  </span>
                  <span className="text-zinc-400">
                    No Básica: {nonBasicPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${basicPct}%` }}
                  />
                </div>
              </div>

              {/* Projected Output Pill */}
              <div className="p-3 rounded-2xl bg-zinc-950/90 border border-white/[0.07] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-400">
                    Incremento Proyectado (ΔE_T)
                  </div>
                  <div className="font-mono tabular-nums font-extrabold text-sm text-emerald-400">
                    +{formatNumber(r.deltaET, d)} (+
                    {formatNumber(r.deltaETPercent, 2)}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">
                    Nuevo Total
                  </div>
                  <div className="font-mono tabular-nums font-extrabold text-sm text-white">
                    {formatNumber(r.newProjectedTotal, d)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
                className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden"
              >
                <div className="bg-[#18181B] border-b border-white/[0.07] px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Proyección de Base Exportadora ({projection.periodLabel})
                    </span>
                    <h4 className="font-extrabold text-base text-white">
                      {r.regionName}
                    </h4>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-[10px] text-zinc-400">
                      Multiplicador Mⱼ
                    </div>
                    <div className="text-base font-extrabold text-emerald-400">
                      M = {formatNumber(r.multiplierM, d)}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center font-mono tabular-nums text-xs">
                    <div className="p-2.5 rounded-2xl bg-[#18181B] border border-white/[0.07]">
                      <div className="text-[10px] font-sans text-zinc-400">
                        Total Actual (E_T)
                      </div>
                      <div className="font-bold text-white mt-0.5">
                        {formatNumber(r.totalEmploymentET, 2)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="text-[10px] font-sans text-emerald-300">
                        Básica (E_B)
                      </div>
                      <div className="font-bold text-emerald-300 mt-0.5">
                        {formatNumber(r.totalBasicEB, d)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[#18181B] border border-white/[0.07]">
                      <div className="text-[10px] font-sans text-zinc-400">
                        No Básica (E_NB)
                      </div>
                      <div className="font-bold text-zinc-200 mt-0.5">
                        {formatNumber(r.totalNonBasicENB, d)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/25">
                      <div className="text-[10px] font-sans text-violet-300">
                        Impacto % (Mⱼ×Δ%E_B)
                      </div>
                      <div className="font-extrabold text-violet-200 mt-0.5">
                        +{formatNumber(r.deltaETPercent, 2)}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35">
                      <div className="text-[10px] font-sans text-emerald-300">
                        Incremento (ΔE_T)
                      </div>
                      <div className="font-extrabold text-emerald-300 mt-0.5">
                        +{formatNumber(r.deltaET, d)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-zinc-950 border border-emerald-500/40">
                      <div className="text-[10px] font-sans text-zinc-400">
                        Nuevo Total Proyectado
                      </div>
                      <div className="font-extrabold text-emerald-400 mt-0.5">
                        {formatNumber(r.newProjectedTotal, d)}
                      </div>
                    </div>
                  </div>

                  {/* Sectores básicos identificados */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-zinc-300">
                      Sectores Básicos Exportadores (Qᵢⱼ &gt; 1):
                    </div>
                    <div className="divide-y divide-white/[0.06] border border-white/[0.07] rounded-2xl overflow-hidden text-xs">
                      {basicSectors.map((bs, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-emerald-500/[0.05] flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-zinc-200">
                            {bs.name}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-emerald-300 shrink-0">
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
        <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
          <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-white">
                  1. Actividad Básica Exportable por Sector (Xᵢⱼ) y
                  Multiplicador Básico (Mⱼ) —{' '}
                  <span className="text-emerald-400">
                    {projection.periodLabel}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono tabular-nums">
                  Si Qᵢⱼ &gt; 1 ⇒ Xᵢⱼ = (1 - (1 / Qᵢⱼ)) × Vᵢⱼ &nbsp;|&nbsp; E_Bj
                  = Σᵢ Xᵢⱼ &nbsp;|&nbsp; Mⱼ = Σᵢ Vᵢⱼ / E_Bj
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
                      className="py-2.5 px-3 text-right font-bold text-xs uppercase min-w-[125px]"
                    >
                      {reg}
                      <span className="block text-[10px] font-normal text-zinc-400">
                        Actividad Básica Xᵢⱼ (y Qᵢⱼ)
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums">
                {config.sectors.map((sec, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="sticky left-0 z-10 bg-[#121214] py-2.5 px-3 font-sans font-semibold text-zinc-200 text-xs sm:text-sm border-r border-white/[0.05]">
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 font-bold text-xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                {formatNumber(xVal, d)}
                              </span>
                              <div className="text-[10px] text-zinc-500 mt-0.5">
                                Q={formatNumber(qVal, 2)} | V=
                                {formatNumber(vVal, 0)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-zinc-500 text-xs">0</span>
                              <div className="text-[10px] text-zinc-600">
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
              <tfoot className="border-t border-white/10 font-mono tabular-nums text-xs">
                <tr className="bg-emerald-950/30 font-extrabold text-emerald-300 text-sm">
                  <td className="sticky left-0 z-10 bg-[#0d211b] py-2.5 px-3 font-sans border-r border-white/[0.05]">
                    Suma Básica Regional (E_Bj = Σᵢ Xᵢⱼ)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td key={j} className="py-2.5 px-3 text-right">
                      {formatNumber(r.totalBasicEB, d)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-zinc-900/80 font-semibold text-zinc-300">
                  <td className="sticky left-0 z-10 bg-zinc-900 py-2 px-3 font-sans border-r border-white/[0.05]">
                    Actividad No Básica (E_NBj = Σᵢ Vᵢⱼ - E_Bj)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td key={j} className="py-2 px-3 text-right">
                      {formatNumber(r.totalNonBasicENB, d)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-zinc-900 font-bold text-white">
                  <td className="sticky left-0 z-10 bg-zinc-900 py-2 px-3 font-sans border-r border-white/[0.05]">
                    Actividad Regional Total (E_Tj = Σᵢ Vᵢⱼ)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td key={j} className="py-2 px-3 text-right">
                      {formatNumber(r.totalEmploymentET, 2)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-violet-950/40 text-white font-extrabold text-sm border-t border-violet-500/30">
                  <td className="sticky left-0 z-10 bg-[#1a1429] py-3 px-3 font-sans border-r border-white/[0.05]">
                    Multiplicador Básico Regional (Mⱼ = Σᵢ Vᵢⱼ / E_Bj)
                  </td>
                  {projection.regions.map((r, j) => (
                    <td
                      key={j}
                      className="py-3 px-3 text-right text-emerald-400"
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
      <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden print-break-inside-avoid">
        <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base text-white">
                2. Proyección del Empleo / Producción Regional e Interpretación
                Técnica
              </h3>
              <p className="text-xs text-zinc-400 font-mono tabular-nums">
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
                <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                  <th className="sticky left-0 z-10 bg-zinc-900 py-2.5 px-3 text-left font-bold text-xs uppercase min-w-[120px] border-r border-white/[0.05]">
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
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-violet-950/30 text-violet-300">
                    Multiplicador (Mⱼ)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase">
                    Tasa Básica (Δ% E_B)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-emerald-950/20 text-emerald-300">
                    Impacto % (Mⱼ×Δ%E_B)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-emerald-950/35 text-emerald-300">
                    Incremento (ΔE_Tj)
                  </th>
                  <th className="py-2.5 px-3 text-right font-bold text-xs uppercase bg-zinc-950 text-white">
                    Nuevo Total Proyectado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] font-mono tabular-nums text-xs">
                {projection.regions.map((r, j) => (
                  <tr key={j} className="hover:bg-white/[0.02]">
                    <td className="sticky left-0 z-10 bg-[#121214] py-3 px-3 font-sans font-bold text-white text-sm border-r border-white/[0.05]">
                      {r.regionName}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-200">
                      {formatNumber(r.totalEmploymentET, 2)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">
                      {formatNumber(r.totalBasicEB, d)}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-400">
                      {formatNumber(r.totalNonBasicENB, d)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-violet-300 bg-violet-950/15 text-sm">
                      {formatNumber(r.multiplierM, d)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-zinc-300">
                      {r.appliedGrowthRatePercent !== null
                        ? `${formatNumber(r.appliedGrowthRatePercent, 4)}%`
                        : `ΔEB=${formatNumber(r.deltaEB, 2)}`}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-300 bg-emerald-950/15">
                      +{formatNumber(r.deltaETPercent, 2)}%
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-400 bg-emerald-950/25 text-sm">
                      +{formatNumber(r.deltaET, d)}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-white bg-zinc-950/80 text-sm">
                      {formatNumber(r.newProjectedTotal, d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUSTITUCIÓN PASO A PASO Y PÁRRAFO DE INTERPRETACIÓN TÉCNICA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
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
                    className="p-4 sm:p-5 rounded-2xl bg-[#18181B] border border-white/[0.07] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="font-extrabold text-sm text-white">
                          {r.regionName} — Multiplicador Básico M ={' '}
                          {formatNumber(r.multiplierM, 2)}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums bg-zinc-950 px-3 py-1 rounded-full border border-white/[0.08] text-zinc-300">
                        E_NB / E_T = {formatNumber(r.totalNonBasicENB, 2)} /{' '}
                        {formatNumber(r.totalEmploymentET, 2)} ={' '}
                        {formatNumber(r.nonBasicRatio, 4)} &nbsp;⇒&nbsp; M = 1 /
                        (1 - {formatNumber(r.nonBasicRatio, 4)}) ={' '}
                        {formatNumber(r.multiplierM, d)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-emerald-500/25 text-emerald-300 font-mono tabular-nums text-xs overflow-x-auto">
                      {r.stepByStepFormula} &nbsp;⇒&nbsp; Nuevo Total ={' '}
                      {formatNumber(r.totalEmploymentET, 2)} +{' '}
                      {formatNumber(r.deltaET, d)} ={' '}
                      <strong className="text-white">
                        {formatNumber(r.newProjectedTotal, d)}
                      </strong>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-emerald-400 inline mr-1 -mt-0.5" />
                      <strong className="text-white">
                        Interpretación Técnica:
                      </strong>{' '}
                      En <strong className="text-white">{r.regionName}</strong>,
                      la actividad básica exportadora suma{' '}
                      <strong className="text-emerald-300">
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
                      <strong className="text-violet-300">
                        Multiplicador Básico Regional de M ={' '}
                        {formatNumber(r.multiplierM, 4)}
                      </strong>
                      : por cada unidad generada en los sectores básicos se
                      sostienen {formatNumber(r.multiplierM, 2)} unidades
                      totales en la economía. Al aplicar una tasa de incremento
                      básico de{' '}
                      <strong className="text-emerald-300">
                        {r.appliedGrowthRatePercent !== null
                          ? `${formatNumber(r.appliedGrowthRatePercent, 4)}%`
                          : `ΔE_B = ${formatNumber(r.deltaEB, 2)}`}
                      </strong>
                      , el impacto porcentual multiplicado es de{' '}
                      <strong className="text-emerald-300">
                        +{formatNumber(r.deltaETPercent, 2)}%
                      </strong>
                      , lo que representa un incremento absoluto de{' '}
                      <strong className="text-emerald-400">
                        +{formatNumber(r.deltaET, 2)} unidades
                      </strong>{' '}
                      de {config.variableName}, proyectando un nuevo total
                      regional de{' '}
                      <strong className="text-white">
                        {formatNumber(r.newProjectedTotal, 2)}
                      </strong>
                      .
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
