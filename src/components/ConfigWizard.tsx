import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  ClipboardPaste,
  Settings2,
  Layers,
  Table2,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
  CalendarOff,
  ArrowRight,
} from 'lucide-react';
import { AnnualSeriesPoint, StudyConfig } from '../types/regional';
import { computeAnnualSeriesAverage, formatNumber } from '../utils/mathEngine';
import { parseUploadedMatrixOrProjectFile } from '../utils/exportReport';
import { DEFAULT_MORELIA_ANNUAL_SERIES } from '../data/presets';

interface ConfigWizardProps {
  config: StudyConfig;
  viewFilter?: 'all' | 'config' | 'capture';
  onChange: (newConfig: StudyConfig) => void;
  onNavigateToCapture?: () => void;
  onNavigateToResults: () => void;
}

export const ConfigWizard: React.FC<ConfigWizardProps> = ({
  config,
  viewFilter = 'all',
  onChange,
  onNavigateToCapture,
  onNavigateToResults,
}) => {
  const [pasteModal, setPasteModal] = useState<{
    open: boolean;
    target: 't0' | 't1';
    text: string;
    includeBaseColumn: boolean;
  }>({
    open: false,
    target: 't0',
    text: '',
    includeBaseColumn: false,
  });

  // Draft strings while actively typing a cell (prevents cursor jump on decimals like "15.")
  // while still persisting numeric value to localStorage on every single keystroke
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);
  const fileInputT0Ref = useRef<HTMLInputElement | null>(null);
  const fileInputT1Ref = useRef<HTMLInputElement | null>(null);

  const numSectors = config.sectors.length;
  const numRegions = config.regions.length;

  // Reset cell drafts when title/dimensions change (e.g. preset loaded)
  useEffect(() => {
    setCellDrafts({});
  }, [config.title, numSectors, numRegions]);

  const showConfigSections = viewFilter === 'all' || viewFilter === 'config';
  const showCaptureSections = viewFilter === 'all' || viewFilter === 'capture';

  // Add / Remove Sectors
  const handleAddSector = () => {
    const nextIdx = numSectors + 1;
    const newSectors = [...config.sectors, `S${nextIdx}`];
    const newT0 = [...config.matrixT0, Array(numRegions).fill(10)];
    const newT1 = [...config.matrixT1, Array(numRegions).fill(12)];
    const newBaseT0 = [...config.manualBaseT0, numRegions * 10];
    const newBaseT1 = [...config.manualBaseT1, numRegions * 12];
    onChange({
      ...config,
      sectors: newSectors,
      matrixT0: newT0,
      matrixT1: newT1,
      manualBaseT0: newBaseT0,
      manualBaseT1: newBaseT1,
    });
  };

  const handleRemoveSector = (idx: number) => {
    if (numSectors <= 2) return;
    onChange({
      ...config,
      sectors: config.sectors.filter((_, i) => i !== idx),
      matrixT0: config.matrixT0.filter((_, i) => i !== idx),
      matrixT1: config.matrixT1.filter((_, i) => i !== idx),
      manualBaseT0: config.manualBaseT0.filter((_, i) => i !== idx),
      manualBaseT1: config.manualBaseT1.filter((_, i) => i !== idx),
    });
  };

  // Add / Remove Regions
  const handleAddRegion = () => {
    const nextIdx = numRegions + 1;
    const newRegions = [...config.regions, `R${nextIdx}`];
    const newT0 = config.matrixT0.map((row) => [...row, 10]);
    const newT1 = config.matrixT1.map((row) => [...row, 15]);
    const newDeltaEB = [...config.projection.manualAbsoluteDeltaEB, 10];
    onChange({
      ...config,
      regions: newRegions,
      matrixT0: newT0,
      matrixT1: newT1,
      projection: {
        ...config.projection,
        manualAbsoluteDeltaEB: newDeltaEB,
      },
    });
  };

  const handleRemoveRegion = (jIdx: number) => {
    if (numRegions <= 1) return;
    onChange({
      ...config,
      regions: config.regions.filter((_, j) => j !== jIdx),
      matrixT0: config.matrixT0.map((row) => row.filter((_, j) => j !== jIdx)),
      matrixT1: config.matrixT1.map((row) => row.filter((_, j) => j !== jIdx)),
      projection: {
        ...config.projection,
        manualAbsoluteDeltaEB: config.projection.manualAbsoluteDeltaEB.filter(
          (_, j) => j !== jIdx
        ),
      },
    });
  };

  const handleCellChange = (
    period: 't0' | 't1',
    i: number,
    j: number,
    rawVal: string
  ) => {
    const draftKey = `${period}_${i}_${j}`;
    setCellDrafts((prev) => ({ ...prev, [draftKey]: rawVal }));
    const val = rawVal.trim() === '' ? 0 : parseFloat(rawVal);
    const numVal = Number.isNaN(val) ? 0 : val;
    if (period === 't0') {
      const next = config.matrixT0.map((r, rIdx) =>
        rIdx === i ? r.map((c, cIdx) => (cIdx === j ? numVal : c)) : r
      );
      onChange({ ...config, matrixT0: next });
    } else {
      const next = config.matrixT1.map((r, rIdx) =>
        rIdx === i ? r.map((c, cIdx) => (cIdx === j ? numVal : c)) : r
      );
      onChange({ ...config, matrixT1: next });
    }
  };

  const handleCellBlur = (period: 't0' | 't1', i: number, j: number) => {
    const draftKey = `${period}_${i}_${j}`;
    setCellDrafts((prev) => {
      const copy = { ...prev };
      delete copy[draftKey];
      return copy;
    });
  };

  const handleManualBaseChange = (
    period: 't0' | 't1',
    i: number,
    rawVal: string
  ) => {
    const draftKey = `base_${period}_${i}`;
    setCellDrafts((prev) => ({ ...prev, [draftKey]: rawVal }));
    const val = rawVal.trim() === '' ? 0 : parseFloat(rawVal);
    const numVal = Number.isNaN(val) ? 0 : val;
    if (period === 't0') {
      const next = config.manualBaseT0.map((v, idx) =>
        idx === i ? numVal : v
      );
      onChange({ ...config, manualBaseT0: next });
    } else {
      const next = config.manualBaseT1.map((v, idx) =>
        idx === i ? numVal : v
      );
      onChange({ ...config, manualBaseT1: next });
    }
  };

  const handleManualBaseBlur = (period: 't0' | 't1', i: number) => {
    const draftKey = `base_${period}_${i}`;
    setCellDrafts((prev) => {
      const copy = { ...prev };
      delete copy[draftKey];
      return copy;
    });
  };

  // Handle Excel / CSV file upload for a specific period
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 't0' | 't1'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedMatrixOrProjectFile(file);
      if (parsed.type === 'full_project') {
        onChange(parsed.config);
        setPasteFeedback(
          `Proyecto completo "${parsed.config.title}" importado desde ${file.name}.`
        );
      } else {
        const useManualCol =
          config.baseTotalMode === 'manual_column' &&
          parsed.matrix[0]?.length > 1;
        const regCount = useManualCol
          ? parsed.regions.length - 1
          : parsed.regions.length;
        const secCount = parsed.sectors.length;

        const cleanMatrix = parsed.matrix.map((row) =>
          useManualCol ? row.slice(0, regCount) : row
        );
        const manualCol = parsed.lastColAsManualBase;

        const resizeOtherMatrix = (oldMat: number[][]) =>
          Array.from({ length: secCount }, (_, i) =>
            Array.from({ length: regCount }, (_, j) => oldMat[i]?.[j] ?? 0)
          );

        const nextConfig: StudyConfig = {
          ...config,
          sectors: parsed.sectors,
          regions: useManualCol
            ? parsed.regions.slice(0, regCount)
            : parsed.regions,
          matrixT0:
            target === 't0' ? cleanMatrix : resizeOtherMatrix(config.matrixT0),
          matrixT1:
            target === 't1' ? cleanMatrix : resizeOtherMatrix(config.matrixT1),
          manualBaseT0:
            target === 't0' && useManualCol
              ? manualCol
              : Array.from(
                  { length: secCount },
                  (_, i) => config.manualBaseT0[i] ?? 0
                ),
          manualBaseT1:
            target === 't1' && useManualCol
              ? manualCol
              : Array.from(
                  { length: secCount },
                  (_, i) => config.manualBaseT1[i] ?? 0
                ),
        };
        onChange(nextConfig);
        setPasteFeedback(
          `Archivo "${file.name}" cargado en ${
            target === 't0' ? config.year0Label : config.year1Label
          } (${secCount} sectores × ${regCount} regiones).`
        );
      }
    } catch (err) {
      setPasteFeedback(
        `Error al leer archivo: ${
          err instanceof Error ? err.message : 'Formato no reconocido'
        }`
      );
    } finally {
      e.target.value = '';
      setTimeout(() => setPasteFeedback(null), 4000);
    }
  };

  // Parse pasted Excel/CSV text directly into grid
  const applyPastedText = (
    rawText: string,
    target: 't0' | 't1',
    startRow = 0,
    startCol = 0,
    resizeIfNeeded = false,
    includeBaseCol = false
  ) => {
    const rows = rawText
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(/\t|,|;/).map((cell) => cell.trim()))
      .filter((r) => r.length > 0 && r.some((c) => c !== ''));

    if (rows.length === 0) return;

    const numericRows: number[][] = [];
    const detectedSectorNames: string[] = [];

    rows.forEach((cols) => {
      const firstNum = parseFloat(cols[0].replace(/,/g, ''));
      if (Number.isNaN(firstNum) && cols.length > 1) {
        const parsedNums = cols
          .slice(1)
          .map((c) => parseFloat(c.replace(/,/g, '')))
          .filter((n) => !Number.isNaN(n));
        if (parsedNums.length > 0) {
          detectedSectorNames.push(cols[0]);
          numericRows.push(parsedNums);
        }
      } else {
        const parsedNums = cols
          .map((c) => parseFloat(c.replace(/,/g, '')))
          .filter((n) => !Number.isNaN(n));
        if (parsedNums.length > 0) {
          numericRows.push(parsedNums);
        }
      }
    });

    if (numericRows.length === 0) return;

    const updatedConfig = { ...config };

    if (resizeIfNeeded) {
      const newSecCount = numericRows.length;
      const totalCols = Math.max(...numericRows.map((r) => r.length));
      const newRegCount =
        includeBaseCol && totalCols > 1 ? totalCols - 1 : totalCols;

      const newSectors = Array.from(
        { length: newSecCount },
        (_, i) => detectedSectorNames[i] || config.sectors[i] || `S${i + 1}`
      );
      const newRegions = Array.from(
        { length: newRegCount },
        (_, j) => config.regions[j] || `R${j + 1}`
      );

      const buildMat = (oldMat: number[][]) =>
        Array.from({ length: newSecCount }, (_, i) =>
          Array.from({ length: newRegCount }, (_, j) => oldMat[i]?.[j] ?? 0)
        );

      updatedConfig.sectors = newSectors;
      updatedConfig.regions = newRegions;
      updatedConfig.matrixT0 = buildMat(config.matrixT0);
      updatedConfig.matrixT1 = buildMat(config.matrixT1);
      updatedConfig.manualBaseT0 = Array.from(
        { length: newSecCount },
        (_, i) => config.manualBaseT0[i] ?? 0
      );
      updatedConfig.manualBaseT1 = Array.from(
        { length: newSecCount },
        (_, i) => config.manualBaseT1[i] ?? 0
      );
    }

    const mat =
      target === 't0'
        ? updatedConfig.matrixT0.map((r) => [...r])
        : updatedConfig.matrixT1.map((r) => [...r]);
    const baseCol =
      target === 't0'
        ? [...updatedConfig.manualBaseT0]
        : [...updatedConfig.manualBaseT1];

    numericRows.forEach((rNums, rOffset) => {
      const targetRow = startRow + rOffset;
      if (targetRow >= mat.length) return;
      const maxRegCols = includeBaseCol ? rNums.length - 1 : rNums.length;
      for (let cOffset = 0; cOffset < maxRegCols; cOffset++) {
        const targetCol = startCol + cOffset;
        if (targetCol < mat[targetRow].length) {
          mat[targetRow][targetCol] = rNums[cOffset];
        }
      }
      if (includeBaseCol && rNums.length > 0) {
        baseCol[targetRow] = rNums[rNums.length - 1];
      }
    });

    if (target === 't0') {
      updatedConfig.matrixT0 = mat;
      if (includeBaseCol) {
        updatedConfig.manualBaseT0 = baseCol;
        updatedConfig.baseTotalMode = 'manual_column';
      }
    } else {
      updatedConfig.matrixT1 = mat;
      if (includeBaseCol) {
        updatedConfig.manualBaseT1 = baseCol;
        updatedConfig.baseTotalMode = 'manual_column';
      }
    }

    setCellDrafts({});
    onChange(updatedConfig);
    setPasteFeedback(
      `Se pegaron ${numericRows.length} filas correctamente en ${
        target === 't0' ? config.year0Label : config.year1Label
      }.`
    );
    setTimeout(() => setPasteFeedback(null), 3500);
  };

  // Marginal totals helper for live preview
  const computeMarginals = (mat: number[][], manualBase: number[]) => {
    const colTotals = Array(numRegions).fill(0);
    const rowTotals = Array(numSectors).fill(0);
    for (let i = 0; i < numSectors; i++) {
      let rSum = 0;
      for (let j = 0; j < numRegions; j++) {
        const v = Number(mat[i]?.[j] || 0);
        rSum += v;
        colTotals[j] += v;
      }
      rowTotals[i] =
        config.baseTotalMode === 'manual_column'
          ? Number(manualBase[i] || 0)
          : rSum;
    }
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);
    return { colTotals, rowTotals, grandTotal };
  };

  const margT0 = computeMarginals(config.matrixT0, config.manualBaseT0);
  const margT1 = computeMarginals(config.matrixT1, config.manualBaseT1);

  const annualSeries =
    config.projection.annualSeries || DEFAULT_MORELIA_ANNUAL_SERIES;
  const annualAvgSummary = computeAnnualSeriesAverage(config);

  const updateAnnualSeries = (newSeries: AnnualSeriesPoint[]) => {
    onChange({
      ...config,
      projection: {
        ...config.projection,
        annualSeries: newSeries,
      },
    });
  };

  const renderCaptureGrid = (
    period: 't0' | 't1',
    label: string,
    mat: number[][],
    manualBase: number[],
    marginals: { colTotals: number[]; rowTotals: number[]; grandTotal: number }
  ) => {
    const fileRef = period === 't0' ? fileInputT0Ref : fileInputT1Ref;
    return (
      <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl overflow-hidden">
        <div className="bg-[#18181B]/90 border-b border-white/[0.07] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Table2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm md:text-base text-white">
                Matriz de Captura {period === 't0' ? 'Vᵢⱼ(0)' : 'Vᵢⱼ(t)'} —{' '}
                <span className="text-emerald-400">{label}</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Autoguardado instantáneo en cada tecla • Puedes pegar bloques
                directamente desde Excel
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={(e) => handleFileUpload(e, period)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Subir Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setPasteModal({
                  open: true,
                  target: period,
                  text: '',
                  includeBaseColumn: config.baseTotalMode === 'manual_column',
                })
              }
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/35 text-xs font-bold transition cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Pegar Portapapeles</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900/90 text-zinc-300 border-b border-white/[0.07]">
                <th className="sticky left-0 z-20 bg-zinc-900 py-3 px-4 text-left font-bold uppercase text-xs tracking-wider min-w-[170px] max-w-[230px] border-r border-white/[0.05]">
                  SECTOR \ REGIÓN
                </th>
                {config.regions.map((reg, j) => (
                  <th
                    key={j}
                    className="py-3 px-2.5 text-right font-bold text-xs tracking-wider min-w-[130px] text-zinc-200"
                  >
                    {reg}
                  </th>
                ))}
                <th className="py-3 px-4 text-right font-bold text-xs tracking-wider bg-violet-950/30 text-violet-200 min-w-[155px] border-l border-violet-500/20">
                  {config.baseTotalName}
                  <span className="block text-[10px] font-normal text-violet-400">
                    {config.baseTotalMode === 'manual_column'
                      ? '(Columna Independiente)'
                      : '(Suma Σⱼ Vᵢⱼ Automática)'}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {config.sectors.map((sec, i) => {
                const baseDraftKey = `base_${period}_${i}`;
                const baseDisplayValue =
                  cellDrafts[baseDraftKey] !== undefined
                    ? cellDrafts[baseDraftKey]
                    : String(manualBase[i] ?? 0);

                return (
                  <tr
                    key={i}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-[#121214] py-2 px-4 font-semibold text-zinc-200 text-xs sm:text-sm border-r border-white/[0.05]">
                      <div className="line-clamp-2" title={sec}>
                        {sec}
                      </div>
                    </td>
                    {config.regions.map((_, j) => {
                      const draftKey = `${period}_${i}_${j}`;
                      const displayVal =
                        cellDrafts[draftKey] !== undefined
                          ? cellDrafts[draftKey]
                          : String(mat[i]?.[j] ?? 0);

                      return (
                        <td key={j} className="py-1.5 px-2">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            value={displayVal}
                            onChange={(e) =>
                              handleCellChange(period, i, j, e.target.value)
                            }
                            onBlur={() => handleCellBlur(period, i, j)}
                            onPaste={(e) => {
                              const text = e.clipboardData.getData('text');
                              if (text.includes('\t') || text.includes('\n')) {
                                e.preventDefault();
                                applyPastedText(
                                  text,
                                  period,
                                  i,
                                  j,
                                  false,
                                  false
                                );
                              }
                            }}
                            className="w-full min-h-[42px] text-right font-mono tabular-nums text-sm px-3 py-1.5 rounded-xl border border-white/[0.08] bg-zinc-950/90 text-zinc-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                          />
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-3 bg-violet-950/15 border-l border-violet-500/20 text-right font-mono tabular-nums font-semibold text-violet-200">
                      {config.baseTotalMode === 'manual_column' ? (
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          value={baseDisplayValue}
                          onChange={(e) =>
                            handleManualBaseChange(period, i, e.target.value)
                          }
                          onBlur={() => handleManualBaseBlur(period, i)}
                          className="w-full min-h-[42px] text-right font-mono tabular-nums text-sm px-3 py-1.5 rounded-xl border border-violet-500/35 bg-zinc-950 text-violet-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 outline-none font-bold"
                        />
                      ) : (
                        <div className="min-h-[42px] flex items-center justify-end px-2 text-emerald-300 font-bold">
                          {formatNumber(marginals.rowTotals[i], 2)}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-900/95 font-bold text-white border-t border-white/10">
                <td className="sticky left-0 z-10 bg-zinc-900 py-3 px-4 text-xs uppercase tracking-wider text-emerald-400 border-r border-white/[0.05]">
                  Σᵢ Vᵢⱼ (Total Reg.)
                </td>
                {marginals.colTotals.map((tot, j) => (
                  <td
                    key={j}
                    className="py-3 px-3 text-right font-mono tabular-nums text-sm text-zinc-100"
                  >
                    {formatNumber(tot, 2)}
                  </td>
                ))}
                <td className="py-3 px-4 text-right font-mono tabular-nums text-sm bg-violet-950/40 text-emerald-300 border-l border-violet-500/30">
                  <span className="block text-[10px] font-sans font-normal text-violet-300">
                    Gran Total ΣᵢΣⱼ Vᵢⱼ
                  </span>
                  {formatNumber(marginals.grandTotal, 2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {pasteFeedback && (
        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl text-sm font-medium shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          {pasteFeedback}
        </div>
      )}

      {/* 1. METADATOS DEL ESTUDIO */}
      {showConfigSections && (
        <section className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-white/[0.07]">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                1. Metadatos y Parámetros Base del Diagnóstico
              </h3>
              <p className="text-xs text-zinc-400">
                Personaliza el nombre de la variable de estudio, el Total Base
                Comparativo y el alcance temporal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Título del Estudio / Escenario
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => onChange({ ...config, title: e.target.value })}
                placeholder="Ej. Diagnóstico Estratégico de Morelia"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-white/10 bg-[#18181B] text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nombre de la Variable Analizada (Vᵢⱼ)
              </label>
              <input
                type="text"
                value={config.variableName}
                onChange={(e) =>
                  onChange({ ...config, variableName: e.target.value })
                }
                placeholder="Ej. Población Económicamente Ocupada (PEO), PIB, VAB..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-white/10 bg-[#18181B] text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nombre del Total Base Comparativo
              </label>
              <input
                type="text"
                value={config.baseTotalName}
                onChange={(e) =>
                  onChange({ ...config, baseTotalName: e.target.value })
                }
                placeholder="Ej. Nacional (Σj SEC), Michoacán, Total Estatal"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-white/10 bg-[#18181B] text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
          </div>

          {/* Selector de origen del Total Base Comparativo */}
          <div className="mb-5 p-4 rounded-2xl bg-[#18181B]/90 border border-violet-500/25">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-2.5">
                  Modo de Obtención del Total Base Comparativo (
                  {config.baseTotalName})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      config.baseTotalMode === 'sum_regions'
                        ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-950/60 border-white/[0.07] hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="baseTotalMode"
                      checked={config.baseTotalMode === 'sum_regions'}
                      onChange={() =>
                        onChange({ ...config, baseTotalMode: 'sum_regions' })
                      }
                      className="mt-1 w-4 h-4 accent-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Opción A: Calcular sumando las regiones ingresadas (Σⱼ
                        Vᵢⱼ)
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Suma automáticamente todas las regiones capturadas en la
                        matriz para obtener el referente del sistema.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      config.baseTotalMode === 'manual_column'
                        ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-zinc-950/60 border-white/[0.07] hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="baseTotalMode"
                      checked={config.baseTotalMode === 'manual_column'}
                      onChange={() =>
                        onChange({ ...config, baseTotalMode: 'manual_column' })
                      }
                      className="mt-1 w-4 h-4 accent-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Opción B: Capturar como una columna independiente
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Permite ingresar manualmente el Total Estatal o Nacional
                        como columna de referencia independiente.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Alcance Temporal y Etiquetas de Años */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end bg-[#18181B] p-4 rounded-2xl border border-white/[0.07]">
            <div className="lg:col-span-6">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Alcance Temporal del Estudio
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...config, periodType: '1_period' })
                  }
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    config.periodType === '1_period'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20'
                      : 'bg-zinc-950 text-zinc-300 border-white/[0.08] hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-bold text-xs">
                    1 Periodo (Estructura y Proyección)
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      config.periodType === '1_period'
                        ? 'text-zinc-900 font-medium'
                        : 'text-zinc-500'
                    }`}
                  >
                    Pᵢⱼ, Pⱼᵢ, Qᵢⱼ, Qᴿ, Q_S y Base Exportadora
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...config, periodType: '2_periods' })
                  }
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                    config.periodType === '2_periods'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 border-emerald-400 font-extrabold shadow-lg shadow-emerald-500/20'
                      : 'bg-zinc-950 text-zinc-300 border-white/[0.08] hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-bold text-xs">
                    2 Periodos (Estructura, Dinámica y Proyección)
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      config.periodType === '2_periods'
                        ? 'text-zinc-900 font-medium'
                        : 'text-zinc-500'
                    }`}
                  >
                    Incluye Variación, CRr, CRs, Shift-Share y Stilwell
                  </div>
                </button>
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Etiqueta Año Inicial (t₀)
              </label>
              <input
                type="text"
                value={config.year0Label}
                onChange={(e) =>
                  onChange({ ...config, year0Label: e.target.value })
                }
                placeholder="Ej. 2015 o t0"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-white text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            {config.periodType === '2_periods' && (
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Etiqueta Año Final (t₁)
                </label>
                <input
                  type="text"
                  value={config.year1Label}
                  onChange={(e) =>
                    onChange({ ...config, year1Label: e.target.value })
                  }
                  placeholder="Ej. 2025 o t1"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. DIMENSIONES Y NOMBRES PERSONALIZABLES */}
      {(showConfigSections || showCaptureSections) && (
        <section className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  2. Regiones y Sectores Personalizables
                </h3>
                <p className="text-xs text-zinc-400">
                  Agrega, elimina o renombra Sectores (I = {numSectors}) y
                  Regiones (J = {numRegions}) en tiempo real
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddSector}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-500/30 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-violet-400" />
                Agregar Sector (Fila)
              </button>
              <button
                type="button"
                onClick={handleAddRegion}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Agregar Región (Columna)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Nombres de Sectores Económicos (I = {numSectors})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {config.sectors.map((sec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-mono tabular-nums font-bold text-zinc-500 text-right">
                      #{i + 1}
                    </span>
                    <input
                      type="text"
                      value={sec}
                      onChange={(e) => {
                        const next = [...config.sectors];
                        next[i] = e.target.value;
                        onChange({ ...config, sectors: next });
                      }}
                      className="flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl border border-white/10 bg-[#18181B] text-white text-sm focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={numSectors <= 2}
                      onClick={() => handleRemoveSector(i)}
                      className="min-h-[42px] min-w-[42px] flex items-center justify-center text-zinc-500 hover:text-rose-400 disabled:opacity-25 transition cursor-pointer"
                      title="Eliminar sector"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Nombres de Regiones / Territorios (J = {numRegions})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {config.regions.map((reg, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-mono tabular-nums font-bold text-zinc-500 text-right">
                      #{j + 1}
                    </span>
                    <input
                      type="text"
                      value={reg}
                      onChange={(e) => {
                        const next = [...config.regions];
                        next[j] = e.target.value;
                        onChange({ ...config, regions: next });
                      }}
                      className="flex-1 min-h-[42px] px-3.5 py-1.5 rounded-xl border border-white/10 bg-[#18181B] text-white text-sm focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      disabled={numRegions <= 1}
                      onClick={() => handleRemoveRegion(j)}
                      className="min-h-[42px] min-w-[42px] flex items-center justify-center text-zinc-500 hover:text-rose-400 disabled:opacity-25 transition cursor-pointer"
                      title="Eliminar región"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. TABLAS DE CAPTURA DE DATOS Vij */}
      {showCaptureSections && (
        <section className="space-y-6">
          {renderCaptureGrid(
            't0',
            config.year0Label,
            config.matrixT0,
            config.manualBaseT0,
            margT0
          )}

          {config.periodType === '2_periods' &&
            renderCaptureGrid(
              't1',
              config.year1Label,
              config.matrixT1,
              config.manualBaseT1,
              margT1
            )}
        </section>
      )}

      {/* 4. CONFIGURACIÓN DEL CRECIMIENTO PROYECTADO */}
      {showConfigSections && (
        <section className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-xl p-5 sm:p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-white/[0.07]">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                3. Configuración del Crecimiento Proyectado (Modelo de Base
                Económica)
              </h3>
              <p className="text-xs text-zinc-400">
                Selecciona el procedimiento para obtener la tasa o incremento
                aplicado al Multiplicador Básico Regional (Mⱼ)
              </p>
            </div>
          </div>

          {/* Pill / Card Selector for Projection Growth Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...config,
                  projection: {
                    ...config.projection,
                    method: 'manual_percent',
                  },
                })
              }
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                config.projection.method === 'manual_percent'
                  ? 'bg-emerald-500/15 text-white border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#18181B] text-zinc-300 border-white/[0.07] hover:bg-zinc-800/70'
              }`}
            >
              <div className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                1. Tasa Porcentual Directa
              </div>
              <div className="text-xs mt-1 text-zinc-400">
                Ingresa una tasa objetivo manual (ej. 4.7% o 2.3%) y elige su
                criterio de aplicación.
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...config,
                  projection: {
                    ...config.projection,
                    method: 'annual_series_avg',
                    annualSeries:
                      config.projection.annualSeries ||
                      DEFAULT_MORELIA_ANNUAL_SERIES,
                  },
                })
              }
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                config.projection.method === 'annual_series_avg'
                  ? 'bg-emerald-500/15 text-white border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#18181B] text-zinc-300 border-white/[0.07] hover:bg-zinc-800/70'
              }`}
            >
              <div className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                2. Promedio de Tasas Anuales
              </div>
              <div className="text-xs mt-1 text-zinc-400">
                Serie interanual con opción de excluir años atípicos (ej.
                2020-2022 ⇒ 1.8087%).
              </div>
            </button>

            <button
              type="button"
              disabled={config.periodType !== '2_periods'}
              onClick={() =>
                onChange({
                  ...config,
                  projection: {
                    ...config.projection,
                    method: 'historical_dynamic',
                  },
                })
              }
              className={`p-4 rounded-2xl border text-left transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                config.projection.method === 'historical_dynamic'
                  ? 'bg-emerald-500/15 text-white border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#18181B] text-zinc-300 border-white/[0.07] hover:bg-zinc-800/70'
              }`}
            >
              <div className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                3. Tasa Derivada de t₀ → t₁
              </div>
              <div className="text-xs mt-1 text-zinc-400">
                Emplea automáticamente la dinámica observada entre el periodo
                inicial y final.
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...config,
                  projection: {
                    ...config.projection,
                    method: 'manual_absolute',
                  },
                })
              }
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                config.projection.method === 'manual_absolute'
                  ? 'bg-emerald-500/15 text-white border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#18181B] text-zinc-300 border-white/[0.07] hover:bg-zinc-800/70'
              }`}
            >
              <div className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">
                4. Monto Absoluto (ΔE_B)
              </div>
              <div className="text-xs mt-1 text-zinc-400">
                Incremento fijo directo en unidades de actividad básica
                exportadora.
              </div>
            </button>
          </div>

          {/* Sub-options depending on selected method */}
          <div className="bg-[#18181B] p-4 sm:p-5 rounded-2xl border border-white/[0.07] space-y-4">
            {config.periodType === '2_periods' && (
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Periodo Base para identificar Sectores Básicos (Qᵢⱼ &gt; 1) y
                  Mⱼ:
                </span>
                <div className="inline-flex rounded-full border border-white/10 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...config,
                        projection: { ...config.projection, basePeriod: 't1' },
                      })
                    }
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      config.projection.basePeriod === 't1'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Año Final ({config.year1Label})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...config,
                        projection: { ...config.projection, basePeriod: 't0' },
                      })
                    }
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      config.projection.basePeriod === 't0'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Año Inicial ({config.year0Label})
                  </button>
                </div>
              </div>
            )}

            {config.projection.method === 'manual_percent' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-4">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tasa de Crecimiento Proyectada (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={config.projection.manualPercent}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          projection: {
                            ...config.projection,
                            manualPercent: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full min-h-[44px] pr-10 pl-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 font-mono tabular-nums text-sm font-bold text-emerald-300 focus:border-emerald-500 outline-none"
                    />
                    <span className="absolute right-3.5 top-3 text-zinc-500 font-bold text-sm">
                      %
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Criterio Metodológico del Porcentaje
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        config.projection.manualPercentCriterion ===
                        'criterion_a_multiplier_rate'
                          ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : 'bg-zinc-950/60 border-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={
                            config.projection.manualPercentCriterion ===
                            'criterion_a_multiplier_rate'
                          }
                          onChange={() =>
                            onChange({
                              ...config,
                              projection: {
                                ...config.projection,
                                manualPercentCriterion:
                                  'criterion_a_multiplier_rate',
                              },
                            })
                          }
                          className="accent-emerald-500"
                        />
                        <span className="text-xs font-bold text-white">
                          Crecimiento de Sectores Básicos (Δ%E_T = Mⱼ × Δ%E_B)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono tabular-nums">
                        Multiplica Mⱼ × Δ%E_B y aplica ese porcentaje al volumen
                        total regional (Criterio estándar del multiplicador).
                      </p>
                    </label>

                    <label
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        config.projection.manualPercentCriterion ===
                        'criterion_b_base_proportion'
                          ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
                          : 'bg-zinc-950/60 border-white/[0.07]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={
                            config.projection.manualPercentCriterion ===
                            'criterion_b_base_proportion'
                          }
                          onChange={() =>
                            onChange({
                              ...config,
                              projection: {
                                ...config.projection,
                                manualPercentCriterion:
                                  'criterion_b_base_proportion',
                              },
                            })
                          }
                          className="accent-emerald-500"
                        />
                        <span className="text-xs font-bold text-white">
                          Proporción Directa sobre Base (ΔE_B = E_B × g%)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono tabular-nums">
                        ΔE_Bj = E_Bj × (g/100) ⇒ ΔE_Tj = Mⱼ × ΔE_Bj
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: ANNUAL SERIES CALCULATOR WITH OUTLIER EXCLUSION */}
            {config.projection.method === 'annual_series_avg' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-2xl border border-emerald-500/25">
                  <div className="flex items-center gap-2.5">
                    <Calculator className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Calculadora de Promedio de Tasas Anuales con Exclusión
                        de Años Atípicos
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Marca las casillas de los años atípicos (ej. 2020, 2021,
                        2022) para depurarlos del promedio interanual.
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex rounded-full bg-[#18181B] p-1 border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          projection: {
                            ...config.projection,
                            annualSeriesInputMode: 'ratios',
                          },
                        })
                      }
                      className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${
                        (config.projection.annualSeriesInputMode ||
                          'ratios') === 'ratios'
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Capturar Cocientes (r_t)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          projection: {
                            ...config.projection,
                            annualSeriesInputMode: 'totals',
                          },
                        })
                      }
                      className={`px-3.5 py-1 rounded-full font-bold transition cursor-pointer ${
                        config.projection.annualSeriesInputMode === 'totals'
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Capturar Totales Anuales
                    </button>
                  </div>
                </div>

                {/* Live KPI Banner of Calculated Average */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-950 border border-emerald-500/30 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Cociente Promedio Calculado (r̄)
                    </div>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-white mt-0.5">
                      {formatNumber(annualAvgSummary.averageRatio, 6)}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Basado en {annualAvgSummary.validCount} variaciones
                      anuales válidas
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-violet-500/30 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                      Tasa Básica Resultante (Δ% E_B)
                    </div>
                    <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-400 mt-0.5">
                      +{formatNumber(annualAvgSummary.impliedPercent, 4)}%
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Se multiplica por Mⱼ en la proyección
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-amber-500/30 p-3.5 rounded-2xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <CalendarOff className="w-3.5 h-3.5" />
                      Años Atípicos Excluidos
                    </div>
                    <div className="text-xs font-bold text-amber-200 mt-1">
                      {annualAvgSummary.excludedYears.length > 0
                        ? annualAvgSummary.excludedYears.join(', ')
                        : 'Ninguno excluido'}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto bg-zinc-950 rounded-2xl border border-white/[0.08]">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900 text-zinc-300 border-b border-white/[0.07]">
                        <th className="py-2.5 px-3 text-left font-bold">
                          Año / Periodo
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold">
                          Total Anual (V_t)
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold">
                          Cociente Interanual (r_t = V_t / V_t-1)
                        </th>
                        <th className="py-2.5 px-3 text-right font-bold">
                          Variación % Anual
                        </th>
                        <th className="py-2.5 px-3 text-center font-bold">
                          ¿Excluir por Atípico?
                        </th>
                        <th className="py-2.5 px-2 text-center font-bold">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {annualSeries.map((pt, idx) => {
                        const isBaseRow = idx === 0;
                        const prev = idx > 0 ? annualSeries[idx - 1] : null;
                        const effectiveRatio = isBaseRow
                          ? 1
                          : config.projection.annualSeriesInputMode ===
                              'totals' &&
                            prev &&
                            prev.totalValue > 0
                          ? pt.totalValue / prev.totalValue
                          : pt.rateRatio;
                        const pct = (effectiveRatio - 1) * 100;

                        return (
                          <tr
                            key={idx}
                            className={
                              pt.excluded
                                ? 'bg-rose-950/20 text-zinc-500'
                                : 'hover:bg-white/[0.02]'
                            }
                          >
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={pt.year}
                                onChange={(e) => {
                                  const next = [...annualSeries];
                                  next[idx] = {
                                    ...pt,
                                    year: e.target.value,
                                  };
                                  updateAnnualSeries(next);
                                }}
                                className="w-full min-h-[38px] px-2.5 py-1 rounded-xl border border-white/10 text-xs font-semibold text-zinc-200 bg-[#121214]"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                value={pt.totalValue}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const next = [...annualSeries];
                                  next[idx] = { ...pt, totalValue: val };
                                  updateAnnualSeries(next);
                                }}
                                className="w-32 min-h-[38px] px-2.5 py-1 rounded-xl border border-white/10 text-right font-mono tabular-nums text-xs bg-[#121214] text-zinc-200"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                              {isBaseRow ? (
                                <span className="text-zinc-500">
                                  Año Base (1.0000)
                                </span>
                              ) : (config.projection.annualSeriesInputMode ||
                                  'ratios') === 'ratios' ? (
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.0001"
                                  value={pt.rateRatio}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const next = [...annualSeries];
                                    next[idx] = { ...pt, rateRatio: val };
                                    updateAnnualSeries(next);
                                  }}
                                  className={`w-28 min-h-[38px] px-2.5 py-1 rounded-xl border text-right font-mono tabular-nums text-xs font-bold bg-[#121214] ${
                                    pt.excluded
                                      ? 'line-through text-rose-400 border-rose-500/30'
                                      : 'text-emerald-300 border-emerald-500/30'
                                  }`}
                                />
                              ) : (
                                <span
                                  className={
                                    pt.excluded
                                      ? 'line-through text-rose-400'
                                      : 'font-bold text-zinc-200'
                                  }
                                >
                                  {formatNumber(effectiveRatio, 6)}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                              {isBaseRow ? (
                                '—'
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold ${
                                    pt.excluded
                                      ? 'line-through bg-rose-500/15 text-rose-400'
                                      : pct >= 0
                                      ? 'bg-emerald-500/15 text-emerald-300'
                                      : 'bg-rose-500/15 text-rose-300'
                                  }`}
                                >
                                  {pct >= 0 ? '+' : ''}
                                  {formatNumber(pct, 2)}%
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              {!isBaseRow && (
                                <input
                                  type="checkbox"
                                  checked={pt.excluded}
                                  onChange={(e) => {
                                    const next = [...annualSeries];
                                    next[idx] = {
                                      ...pt,
                                      excluded: e.target.checked,
                                    };
                                    updateAnnualSeries(next);
                                  }}
                                  className="w-5 h-5 accent-rose-500 cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              {annualSeries.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateAnnualSeries(
                                      annualSeries.filter((_, i) => i !== idx)
                                    )
                                  }
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const last = annualSeries[annualSeries.length - 1];
                      const nextYear = String(
                        (parseInt(last?.year || '2025', 10) || 2025) + 1
                      );
                      updateAnnualSeries([
                        ...annualSeries,
                        {
                          year: nextYear,
                          totalValue: Math.round(
                            (last?.totalValue || 1000) * 1.018
                          ),
                          rateRatio: 1.018,
                          excluded: false,
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950 border border-white/10 hover:bg-zinc-900 text-xs font-bold text-zinc-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    Agregar Año a la Serie
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateAnnualSeries(DEFAULT_MORELIA_ANNUAL_SERIES)
                    }
                    className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Restaurar Serie SCIAN 2015-2025 (Excl. 2020-2022 ⇒ 1.8087%)
                  </button>
                </div>
              </div>
            )}

            {config.projection.method === 'historical_dynamic' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Fuente de la Tasa Histórica
                  </label>
                  <select
                    value={config.projection.historicalRateSource}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        projection: {
                          ...config.projection,
                          historicalRateSource: e.target.value as
                            | 'national_rate'
                            | 'regional_rate',
                        },
                      })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-white text-sm"
                  >
                    <option value="regional_rate">
                      Tasa Propia de cada Región (r_j - 1)
                    </option>
                    <option value="national_rate">
                      Tasa Global Base (r_global - 1)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tipo de Tasa Observada
                  </label>
                  <select
                    value={config.projection.historicalRateType}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        projection: {
                          ...config.projection,
                          historicalRateType: e.target.value as
                            | 'period_total'
                            | 'cagr_annual',
                        },
                      })
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-white text-sm"
                  >
                    <option value="period_total">
                      Tasa Total del Periodo ((Vt / V0) - 1)
                    </option>
                    <option value="cagr_annual">
                      Tasa Media de Crecimiento Anual (TMCA)
                    </option>
                  </select>
                </div>

                {config.projection.historicalRateType === 'cagr_annual' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Número de Años entre t₀ y t₁
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      value={config.projection.yearsBetweenPeriods}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          projection: {
                            ...config.projection,
                            yearsBetweenPeriods: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          },
                        })
                      }
                      className="w-full min-h-[44px] px-3 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-white font-mono tabular-nums text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {config.projection.method === 'manual_absolute' && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.projection.useSingleManualAbsolute}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          projection: {
                            ...config.projection,
                            useSingleManualAbsolute: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-emerald-500"
                    />
                    Usar el mismo monto ΔE_B para todas las regiones
                  </label>
                </div>

                {config.projection.useSingleManualAbsolute ? (
                  <div className="max-w-xs">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Incremento Absoluto en Actividad Básica (ΔE_B)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={config.projection.singleManualAbsoluteValue}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          projection: {
                            ...config.projection,
                            singleManualAbsoluteValue:
                              parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-white/10 bg-zinc-950 text-emerald-300 font-mono tabular-nums text-sm font-bold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {config.regions.map((reg, j) => (
                      <div key={j}>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          ΔE_B para {reg}
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          value={
                            config.projection.manualAbsoluteDeltaEB[j] ?? 10
                          }
                          onChange={(e) => {
                            const next = [
                              ...config.projection.manualAbsoluteDeltaEB,
                            ];
                            next[j] = parseFloat(e.target.value) || 0;
                            onChange({
                              ...config,
                              projection: {
                                ...config.projection,
                                manualAbsoluteDeltaEB: next,
                              },
                            });
                          }}
                          className="w-full min-h-[44px] px-3 py-1.5 rounded-2xl border border-white/10 bg-zinc-950 text-white font-mono tabular-nums text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FOOTER ACTION PILL BUTTONS */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {viewFilter === 'config' && onNavigateToCapture && (
          <button
            type="button"
            onClick={onNavigateToCapture}
            className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-zinc-800 text-white border border-white/10 font-bold text-sm shadow-lg transition cursor-pointer"
          >
            <span>Ir a Paso 2: Captura de Matriz de Datos</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        )}
        <button
          type="button"
          onClick={onNavigateToResults}
          className="inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <span>Ver Diagnóstico de Estructura Productiva →</span>
        </button>
      </div>

      {/* MODAL PARA PEGAR DESDE EXCEL / CSV */}
      {pasteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#121214] rounded-3xl border border-white/[0.09] shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2.5">
                <ClipboardPaste className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  Pegar Matriz desde Portapapeles / Excel (
                  {pasteModal.target === 't0'
                    ? config.year0Label
                    : config.year1Label}
                  )
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasteModal({ ...pasteModal, open: false })}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Copia el rango de celdas en Excel o Google Sheets y pégalo aquí
              abajo. Puedes incluir o no la primera columna con los nombres de
              los sectores. La aplicación ajustará automáticamente las filas y
              columnas.
            </p>

            <textarea
              rows={7}
              value={pasteModal.text}
              onChange={(e) =>
                setPasteModal({ ...pasteModal, text: e.target.value })
              }
              placeholder={
                'Ejemplo:\nS1\t20\t100\t80\nS2\t25\t75\t150\nS3\t10\t20\t50\nS4\t45\t95\t330'
              }
              className="w-full p-3.5 rounded-2xl border border-white/10 bg-zinc-950 text-zinc-100 font-mono tabular-nums text-xs focus:border-emerald-500 outline-none"
            />

            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pasteModal.includeBaseColumn}
                onChange={(e) =>
                  setPasteModal({
                    ...pasteModal,
                    includeBaseColumn: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-emerald-500"
              />
              La última columna pegada corresponde al Total Base Comparativo (
              {config.baseTotalName}) independiente
            </label>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPasteModal({ ...pasteModal, open: false })}
                className="min-h-[40px] px-4 py-2 rounded-full border border-white/10 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPastedText(
                    pasteModal.text,
                    pasteModal.target,
                    0,
                    0,
                    true,
                    pasteModal.includeBaseColumn
                  );
                  setPasteModal({ ...pasteModal, open: false, text: '' });
                }}
                className="min-h-[40px] px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Importar Datos a la Matriz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
