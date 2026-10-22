import * as XLSX from 'xlsx';
import {
  DynamicsResult,
  ProjectionResult,
  StructurePeriodResult,
  StudyConfig,
} from '../types/regional';
import { formatNumber } from './mathEngine';

export function exportProjectToJSON(config: StudyConfig): void {
  const payload = {
    app: 'Diagnostico_Estrategico_Territorial_PWA',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    config,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = config.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
  link.href = url;
  link.download = `Proyecto_Regional_${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFullReportToXLSX(
  config: StudyConfig,
  structT0: StructurePeriodResult,
  structT1: StructurePeriodResult,
  dynamics: DynamicsResult | null,
  projection: ProjectionResult
): void {
  const wb = XLSX.utils.book_new();
  const d = config.displayDecimals;
  const roundD = (v: number) => Number(Number(v || 0).toFixed(d));

  // Sheet 1: Datos Originales t0 (también sirve para re-importar matriz)
  const t0Rows: (string | number)[][] = [
    ['SECTOR', ...config.regions, config.baseTotalName],
    ...config.sectors.map((sec, i) => [
      sec,
      ...structT0.matrix[i],
      structT0.sectorTotals[i],
    ]),
    ['TOTAL REGIONAL (Σi Vij)', ...structT0.regionTotals, structT0.grandTotal],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(t0Rows), 'Matriz_t0');

  if (config.periodType === '2_periods') {
    const t1Rows: (string | number)[][] = [
      ['SECTOR', ...config.regions, config.baseTotalName],
      ...config.sectors.map((sec, i) => [
        sec,
        ...structT1.matrix[i],
        structT1.sectorTotals[i],
      ]),
      ['TOTAL REGIONAL (Σi Vij)', ...structT1.regionTotals, structT1.grandTotal],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(t1Rows), 'Matriz_t1');
  }

  // Helper to build Structure Sheet
  const buildStructureRows = (st: StructurePeriodResult) => {
    const rows: (string | number)[][] = [];
    rows.push([`ESTRUCTURA PRODUCTIVA — ${st.periodLabel}`]);
    rows.push([]);
    rows.push(['1. COCIENTE DE LOCALIZACIÓN (Qij)', ...config.regions, 'Peso Base (ΣjVij/Total)']);
    config.sectors.forEach((sec, i) => {
      rows.push([sec, ...st.qij[i].map(roundD), roundD(st.baseSectorShareDecimal[i])]);
    });
    rows.push([]);
    rows.push(['2. PARTICIPACIÓN SECTORIAL Pij (%)', ...config.regions, `${config.baseTotalName} (%)`]);
    config.sectors.forEach((sec, i) => {
      rows.push([
        sec,
        ...st.pijPercent[i].map(roundD),
        roundD(st.baseSectorShareDecimal[i] * 100),
      ]);
    });
    rows.push([]);
    rows.push(['3. PARTICIPACIÓN REGIONAL Pji (%)', ...config.regions, 'Total Sector (%)']);
    config.sectors.forEach((sec, i) => {
      rows.push([sec, ...st.pjiPercent[i].map(roundD), 100]);
    });
    rows.push([]);
    rows.push(['4. ESPECIALIZACIÓN (QR) Y DIVERSIFICACIÓN (1 - QR)']);
    rows.push(['Región', 'Ajuste Σ|d|', 'QR (Especialización)', 'CDivR = 1 - QR']);
    config.regions.forEach((reg, j) => {
      rows.push([reg, roundD(st.qrAdjustmentSum[j]), roundD(st.qr[j]), roundD(st.cDivR[j])]);
    });
    rows.push([]);
    rows.push(['5. LOCALIZACIÓN ESPACIAL (QS) Y DISTRIBUCIÓN (1 - QS)']);
    rows.push(['Sector', 'Ajuste Σ|d|', 'QS (Concentración)', 'CDistS = 1 - QS']);
    config.sectors.forEach((sec, i) => {
      rows.push([sec, roundD(st.qsAdjustmentSum[i]), roundD(st.qs[i]), roundD(st.cDistS[i])]);
    });
    return rows;
  };

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(buildStructureRows(structT0)),
    '1_Estructura_t0'
  );

  if (config.periodType === '2_periods') {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(buildStructureRows(structT1)),
      '1_Estructura_t1'
    );
  }

  if (config.periodType === '2_periods' && dynamics) {
    const dynRows: (string | number)[][] = [
      [`DINÁMICA PRODUCTIVA (${config.year0Label} a ${config.year1Label})`],
      [],
      ['1. COCIENTES DE VARIACIÓN (rij y rj)', ...config.regions, config.baseTotalName],
      ...config.sectors.map((sec, i) => [
        sec,
        ...dynamics.rij[i].map(roundD),
        roundD(dynamics.riNac[i]),
      ]),
      ['rj (Variación Regional)', ...dynamics.rj.map(roundD), roundD(dynamics.rNac)],
      [],
      ['2. REESTRUCTURACIÓN (CRr) POR REGIÓN'],
      ['Región', 'Ajuste Σ|d|', 'CRr'],
      ...config.regions.map((reg, j) => [
        reg,
        roundD(dynamics.crrAdjustmentSum[j]),
        roundD(dynamics.crr[j]),
      ]),
      [],
      ['3. REDISTRIBUCIÓN (CRs) POR SECTOR'],
      ['Sector', 'Ajuste Σ|d|', 'CRs'],
      ...config.sectors.map((sec, i) => [
        sec,
        roundD(dynamics.crsAdjustmentSum[i]),
        roundD(dynamics.crs[i]),
      ]),
      [],
      ['4. SHIFT-SHARE TRADICIONAL (Tipos 1 al 6)'],
      ['Región', 'Efecto Total (ET)', 'Efecto Diferencial (ED)', 'Efecto Estructural (EE)', 'Clasificación'],
      ...config.regions.map((reg, j) => [
        reg,
        roundD(dynamics.et[j]),
        roundD(dynamics.ed[j]),
        roundD(dynamics.ee[j]),
        dynamics.traditionalDiagnosis[j].shortTitle,
      ]),
      [],
      ['5. SHIFT-SHARE MODIFICADO — STILWELL (Tipos 1 al 14)'],
      [
        'Región',
        'EE (Inicial)',
        'EI (Inverso)',
        'EEM = EI - EE',
        'ERM = ED - EEM',
        'Verificación (ET - EI)',
        'ETM (ERM - EEM)',
        'ETM Suma (ERM + EEM)',
        'Tipología Stilwell',
      ],
      ...config.regions.map((reg, j) => [
        reg,
        roundD(dynamics.ee[j]),
        roundD(dynamics.ei[j]),
        roundD(dynamics.eem[j]),
        roundD(dynamics.erm[j]),
        roundD(dynamics.ermVerification[j]),
        roundD(dynamics.etm[j]),
        roundD(dynamics.etmSum[j]),
        `Tipo ${dynamics.stilwellDiagnosis[j].typeNumber} (${dynamics.stilwellDiagnosis[j].conditionText})`,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dynRows), '2_Dinamica');
  }

  const projRows: (string | number)[][] = [
    [`PROYECCIÓN PRODUCTIVA — BASE ECONÓMICA (${projection.periodLabel})`],
    [],
    ['1. ACTIVIDAD BÁSICA POR SECTOR (Xij)', ...config.regions],
    ...config.sectors.map((sec, i) => [
      sec,
      ...projection.xijMatrix[i].map(roundD),
    ]),
    ['EBj (Total Básico)', ...projection.regions.map((r) => roundD(r.totalBasicEB))],
    ['ENBj (Total No Básico)', ...projection.regions.map((r) => roundD(r.totalNonBasicENB))],
    ['Multiplicador Básico (Mj)', ...projection.regions.map((r) => roundD(r.multiplierM))],
    [],
    ['2. TABLA RESUMEN DE PROYECCIÓN'],
    [
      'Región',
      'Total Actual (ET)',
      'Actividad Básica (EB)',
      'Actividad No Básica (ENB)',
      'Multiplicador (M)',
      'Tasa Básica Aplicada (%)',
      'Impacto % Multiplicado',
      'Incremento Absoluto (ΔET)',
      'Nuevo Total Proyectado',
    ],
    ...projection.regions.map((r) => [
      r.regionName,
      roundD(r.totalEmploymentET),
      roundD(r.totalBasicEB),
      roundD(r.totalNonBasicENB),
      roundD(r.multiplierM),
      r.appliedGrowthRatePercent !== null ? roundD(r.appliedGrowthRatePercent) : 'Manual ΔEB',
      roundD(r.deltaETPercent),
      roundD(r.deltaET),
      roundD(r.newProjectedTotal),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(projRows), '3_Proyeccion');

  // Metadata backup sheet for 1-click full restore from XLSX
  const metaSheet = XLSX.utils.aoa_to_sheet([
    ['PROYECTO_JSON_BACKUP'],
    [JSON.stringify(config)],
  ]);
  XLSX.utils.book_append_sheet(wb, metaSheet, '_ConfigBackup');

  const safeName = config.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
  XLSX.writeFile(wb, `Diagnostico_Regional_${safeName}.xlsx`);
}

export async function parseUploadedMatrixOrProjectFile(
  file: File
): Promise<
  | { type: 'full_project'; config: StudyConfig }
  | {
      type: 'matrix_data';
      sectors: string[];
      regions: string[];
      matrix: number[][];
      lastColAsManualBase: number[];
    }
> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const cfg: StudyConfig = parsed.config ? parsed.config : parsed;
    if (cfg && Array.isArray(cfg.sectors) && Array.isArray(cfg.matrixT0)) {
      return { type: 'full_project', config: cfg };
    }
    throw new Error('Archivo JSON no tiene el formato de proyecto válido.');
  }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Check if it contains our _ConfigBackup sheet
  if (wb.SheetNames.includes('_ConfigBackup')) {
    const sheet = wb.Sheets['_ConfigBackup'];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    const rawJson = rows?.[1]?.[0];
    if (rawJson) {
      try {
        const cfg = JSON.parse(rawJson) as StudyConfig;
        if (cfg && Array.isArray(cfg.sectors) && Array.isArray(cfg.matrixT0)) {
          return { type: 'full_project', config: cfg };
        }
      } catch {
        // Fallback to matrix parsing
      }
    }
  }

  // Otherwise parse first sheet as matrix
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, {
    header: 1,
    defval: '',
  });

  const nonEmptyRows = rawRows.filter(
    (r) => Array.isArray(r) && r.some((cell) => String(cell).trim() !== '')
  );

  if (nonEmptyRows.length === 0) {
    throw new Error('El archivo Excel/CSV está vacío.');
  }

  // Detect if row 0 is a header row (contains text labels for regions)
  let headerRegions: string[] = [];
  let startRowIdx = 0;
  const firstRow = nonEmptyRows[0];
  const firstRowNums = firstRow
    .slice(1)
    .map((c) => Number(String(c).replace(/,/g, '')))
    .filter((n) => !Number.isNaN(n));

  if (firstRowNums.length === 0 && firstRow.length > 1) {
    headerRegions = firstRow
      .slice(1)
      .map((c, idx) => String(c || `R${idx + 1}`).trim());
    startRowIdx = 1;
  }

  const sectors: string[] = [];
  const matrix: number[][] = [];
  const lastColAsManualBase: number[] = [];

  for (let i = startRowIdx; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i];
    const firstCell = String(row[0] ?? '').trim();
    // Skip total summary rows
    if (/^(total|suma|∑|Σ)/i.test(firstCell)) continue;

    const firstAsNum = Number(firstCell.replace(/,/g, ''));
    let nums: number[] = [];
    if (Number.isNaN(firstAsNum) && firstCell !== '') {
      sectors.push(firstCell);
      nums = row
        .slice(1)
        .map((c) => Number(String(c).replace(/,/g, '')))
        .filter((n) => !Number.isNaN(n));
    } else {
      sectors.push(`S${sectors.length + 1}`);
      nums = row
        .map((c) => Number(String(c).replace(/,/g, '')))
        .filter((n) => !Number.isNaN(n));
    }

    if (nums.length > 0) {
      matrix.push(nums);
      lastColAsManualBase.push(nums[nums.length - 1]);
    }
  }

  const maxCols = Math.max(...matrix.map((r) => r.length), 1);
  const regions =
    headerRegions.length >= maxCols
      ? headerRegions.slice(0, maxCols)
      : Array.from({ length: maxCols }, (_, j) => headerRegions[j] || `R${j + 1}`);

  return {
    type: 'matrix_data',
    sectors,
    regions,
    matrix,
    lastColAsManualBase,
  };
}

export function exportFullReportToCSV(
  config: StudyConfig,
  structT0: StructurePeriodResult,
  structT1: StructurePeriodResult,
  dynamics: DynamicsResult | null,
  projection: ProjectionResult
): void {
  const d = config.displayDecimals;
  const lines: string[] = [];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const addRow = (cols: (string | number)[]) => {
    lines.push(cols.map(escapeCsv).join(','));
  };

  addRow(['DIAGNÓSTICO ESTRATÉGICO TERRITORIAL: ESTRUCTURA, DINÁMICA Y PROYECCIÓN PRODUCTIVA']);
  addRow(['Título del Estudio', config.title]);
  addRow(['Variable de Análisis', config.variableName]);
  addRow(['Total Base Comparativo', config.baseTotalName]);
  addRow(['Precisión Intermedia', config.intermediatePrecision]);
  addRow([]);

  const addStructureBlock = (st: StructurePeriodResult) => {
    addRow([`=== ESTRUCTURA PRODUCTIVA: ${st.periodLabel} ===`]);
    addRow(['1. MATRIZ DE DATOS ORIGINALES (Vij)', ...config.regions, config.baseTotalName]);
    config.sectors.forEach((sec, i) => {
      addRow([sec, ...st.matrix[i].map((v) => formatNumber(v, 2)), formatNumber(st.sectorTotals[i], 2)]);
    });
    addRow(['Σi REG (Total Regional)', ...st.regionTotals.map((v) => formatNumber(v, 2)), formatNumber(st.grandTotal, 2)]);
    addRow([]);

    addRow(['2. PARTICIPACIÓN SECTORIAL INTRARREGIONAL Pij (%)', ...config.regions, `${config.baseTotalName} (%)`]);
    config.sectors.forEach((sec, i) => {
      addRow([
        sec,
        ...st.pijPercent[i].map((v) => `${formatNumber(v, d)}%`),
        `${formatNumber(st.baseSectorShareDecimal[i] * 100, d)}%`,
      ]);
    });
    addRow([]);

    addRow(['3. PARTICIPACIÓN REGIONAL INTERREGIONAL Pji (%)', ...config.regions, 'TOTAL (%)']);
    config.sectors.forEach((sec, i) => {
      addRow([sec, ...st.pjiPercent[i].map((v) => `${formatNumber(v, d)}%`), '100.00%']);
    });
    addRow([]);

    addRow(['4. COCIENTE DE LOCALIZACIÓN (Qij)', ...config.regions]);
    config.sectors.forEach((sec, i) => {
      addRow([sec, ...st.qij[i].map((v) => formatNumber(v, d))]);
    });
    addRow([]);

    addRow(['5. COEFICIENTE DE ESPECIALIZACIÓN (QR) Y DIVERSIFICACIÓN (CDivR)']);
    addRow(['Región', 'Ajuste Σ|d|', 'QR (Especialización)', 'CDivR = 1 - QR (Diversificación)']);
    config.regions.forEach((reg, j) => {
      addRow([
        reg,
        formatNumber(st.qrAdjustmentSum[j], d),
        formatNumber(st.qr[j], d),
        formatNumber(st.cDivR[j], d),
      ]);
    });
    addRow([]);

    addRow(['6. COEFICIENTE DE LOCALIZACIÓN ESPACIAL (QS) Y DISTRIBUCIÓN (CDistS)']);
    addRow(['Sector', 'Ajuste Σ|d|', 'QS (Concentración)', 'CDistS = 1 - QS (Distribución)']);
    config.sectors.forEach((sec, i) => {
      addRow([
        sec,
        formatNumber(st.qsAdjustmentSum[i], d),
        formatNumber(st.qs[i], d),
        formatNumber(st.cDistS[i], d),
      ]);
    });
    addRow([]);
  };

  addStructureBlock(structT0);
  if (config.periodType === '2_periods') {
    addStructureBlock(structT1);
  }

  if (config.periodType === '2_periods' && dynamics) {
    addRow(['=== DINÁMICA PRODUCTIVA (t0 a t1) ===']);
    addRow(['1. COCIENTES Y COEFICIENTES DE VARIACIÓN (rij y rj)', ...config.regions, config.baseTotalName]);
    config.sectors.forEach((sec, i) => {
      addRow([sec, ...dynamics.rij[i].map((v) => formatNumber(v, d)), formatNumber(dynamics.riNac[i], d)]);
    });
    addRow(['rj (Variación Regional)', ...dynamics.rj.map((v) => formatNumber(v, d)), formatNumber(dynamics.rNac, d)]);
    addRow([]);

    addRow(['2. COEFICIENTE DE REESTRUCTURACIÓN (CRr)']);
    addRow(['Región', 'Ajuste Σ|d|', 'CRr']);
    config.regions.forEach((reg, j) => {
      addRow([reg, formatNumber(dynamics.crrAdjustmentSum[j], d), formatNumber(dynamics.crr[j], d)]);
    });
    addRow([]);

    addRow(['3. COEFICIENTE DE REDISTRIBUCIÓN (CRs)']);
    addRow(['Sector', 'Ajuste Σ|d|', 'CRs']);
    config.sectors.forEach((sec, i) => {
      addRow([sec, formatNumber(dynamics.crsAdjustmentSum[i], d), formatNumber(dynamics.crs[i], d)]);
    });
    addRow([]);

    addRow(['4. MÉTODO DIFERENCIAL-ESTRUCTURAL TRADICIONAL (SHIFT-SHARE)']);
    addRow(['Región', 'Efecto Total (ET)', 'Efecto Diferencial (ED)', 'Efecto Estructural (EE)', 'Tipología Tradicional (1-6)']);
    config.regions.forEach((reg, j) => {
      addRow([
        reg,
        formatNumber(dynamics.et[j], d),
        formatNumber(dynamics.ed[j], d),
        formatNumber(dynamics.ee[j], d),
        dynamics.traditionalDiagnosis[j].shortTitle,
      ]);
    });
    addRow([]);

    addRow(['5. MÉTODO DIFERENCIAL-ESTRUCTURAL MODIFICADO (STILWELL)']);
    addRow([
      'Región',
      'EI (Estructural Inverso)',
      'EEM (Reasignación)',
      'ERM (Diferencial Residual)',
      'Verificación (ET - EI)',
      'ETM (ERM - EEM)',
      'ETM Suma (ERM + EEM)',
      'Tipología Stilwell (1-14)',
    ]);
    config.regions.forEach((reg, j) => {
      addRow([
        reg,
        formatNumber(dynamics.ei[j], d),
        formatNumber(dynamics.eem[j], d),
        formatNumber(dynamics.erm[j], d),
        formatNumber(dynamics.ermVerification[j], d),
        formatNumber(dynamics.etm[j], d),
        formatNumber(dynamics.etmSum[j], d),
        `Tipo ${dynamics.stilwellDiagnosis[j].typeNumber} (${dynamics.stilwellDiagnosis[j].conditionText})`,
      ]);
    });
    addRow([]);
  }

  addRow([`=== PROYECCIÓN PRODUCTIVA (Base: ${projection.periodLabel}) ===`]);
  addRow(['1. ACTIVIDAD BÁSICA EXPORTABLE (Xij)', ...config.regions]);
  config.sectors.forEach((sec, i) => {
    addRow([sec, ...projection.xijMatrix[i].map((v) => formatNumber(v, d))]);
  });
  addRow([
    'EBj (Total Básico)',
    ...projection.regions.map((r) => formatNumber(r.totalBasicEB, d)),
  ]);
  addRow([
    'ENBj (Total No Básico)',
    ...projection.regions.map((r) => formatNumber(r.totalNonBasicENB, d)),
  ]);
  addRow([
    'Multiplicador Básico Regional (Mj)',
    ...projection.regions.map((r) => formatNumber(r.multiplierM, d)),
  ]);
  addRow([]);

  addRow(['2. RESULTADOS DE LA PROYECCIÓN REGIONAL']);
  addRow([
    'Región',
    'Total Actual (ET)',
    'Total Básico (EB)',
    'Multiplicador (M)',
    'Incremento Absoluto (ΔET)',
    'Incremento Relativo (%)',
    'Nuevo Total Proyectado',
  ]);
  projection.regions.forEach((r) => {
    addRow([
      r.regionName,
      formatNumber(r.totalEmploymentET, d),
      formatNumber(r.totalBasicEB, d),
      formatNumber(r.multiplierM, d),
      formatNumber(r.deltaET, d),
      `${formatNumber(r.deltaETPercent, d)}%`,
      formatNumber(r.newProjectedTotal, d),
    ]);
  });

  // Add BOM for UTF-8 in Excel
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeName = config.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
  link.setAttribute('download', `Diagnostico_Regional_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
