export type AnalysisPeriodType = '1_period' | '2_periods';

export type BaseTotalMode = 'sum_regions' | 'manual_column';

export type IntermediatePrecision = 'exact' | '2_decimals' | '4_decimals';

export type DisplayDecimals = 2 | 4 | 6 | 9;

export type StilwellFormulaMode = 'slide_37' | 'standard_stilwell';

export type ProjectionGrowthMethod =
  | 'manual_percent'
  | 'annual_series_avg'
  | 'historical_dynamic'
  | 'manual_absolute';

export type ManualPercentCriterion =
  | 'criterion_a_multiplier_rate'
  | 'criterion_b_base_proportion';

export type HistoricalRateType = 'period_total' | 'cagr_annual';

export type HistoricalRateSource = 'national_rate' | 'regional_rate';

export type AnnualSeriesInputMode = 'totals' | 'ratios';

export interface AnnualSeriesPoint {
  year: string;
  totalValue: number;
  rateRatio: number; // e.g., 1.018087
  excluded: boolean; // e.g., true for 2020, 2021, 2022
}

export interface ProjectionConfig {
  basePeriod: 't0' | 't1';
  method: ProjectionGrowthMethod;
  manualPercent: number; // e.g., 4.7 or 2.3 or 29.10
  manualPercentCriterion: ManualPercentCriterion;
  // Method 2: Annual Series Calculator with outlier exclusion
  annualSeriesInputMode?: AnnualSeriesInputMode;
  annualSeries?: AnnualSeriesPoint[];
  // Method 3: Historical dynamic t0 -> t1
  historicalRateType: HistoricalRateType;
  historicalRateSource: HistoricalRateSource;
  yearsBetweenPeriods: number;
  // Method 4: Manual absolute
  manualAbsoluteDeltaEB: number[]; // per region
  useSingleManualAbsolute: boolean;
  singleManualAbsoluteValue: number;
}

export interface StudyConfig {
  title: string;
  variableName: string;
  baseTotalName: string;
  periodType: AnalysisPeriodType;
  year0Label: string;
  year1Label: string;
  baseTotalMode: BaseTotalMode;
  sectors: string[];
  regions: string[];
  matrixT0: number[][]; // [sectorIndex][regionIndex]
  manualBaseT0: number[]; // [sectorIndex] used when baseTotalMode === 'manual_column'
  matrixT1: number[][]; // [sectorIndex][regionIndex]
  manualBaseT1: number[]; // [sectorIndex] used when baseTotalMode === 'manual_column'
  intermediatePrecision: IntermediatePrecision;
  displayDecimals: DisplayDecimals;
  stilwellMode: StilwellFormulaMode;
  projection: ProjectionConfig;
}

export interface SavedProject {
  id: string;
  name: string;
  updatedAt: string;
  config: StudyConfig;
}

export interface StructurePeriodResult {
  periodLabel: string;
  matrix: number[][]; // Vij
  regionTotals: number[]; // sum_i Vij (col totals)
  sectorTotals: number[]; // sum_j Vij (row base totals)
  grandTotal: number; // sum_i sum_j Vij
  pijPercent: number[][]; // 100 * (Vij / sum_i Vij)
  pijDecimal: number[][]; // Vij / sum_i Vij
  baseSectorShareDecimal: number[]; // sum_j Vij / grandTotal
  pjiPercent: number[][]; // 100 * (Vij / sum_j Vij)
  pjiDecimal: number[][]; // Vij / sum_j Vij
  baseRegionShareDecimal: number[]; // sum_i Vij / grandTotal
  qij: number[][]; // Location Quotient
  qrDiffSigned: number[][]; // [i][j] (Vij/sum_i Vij) - (sum_j Vij / grandTotal)
  qrDiffAbs: number[][]; // [i][j] |diff|
  qrAdjustmentSum: number[]; // [j] sum_i |diff|
  qr: number[]; // [j] 0.5 * sum_i |diff|
  cDivR: number[]; // [j] 1 - QR_j
  qsDiffSigned: number[][]; // [i][j] (Vij/sum_j Vij) - (sum_i Vij / grandTotal)
  qsDiffAbs: number[][]; // [i][j] |diff|
  qsAdjustmentSum: number[]; // [i] sum_j |diff|
  qs: number[]; // [i] 0.5 * sum_j |diff|
  cDistS: number[]; // [i] 1 - QS_i
}

export interface ShiftShareRegionDiagnosis {
  typeNumber: 1 | 2 | 3 | 4 | 5 | 6;
  category: 'Ganadora' | 'Perdedora';
  shortTitle: string;
  description: string;
  policyRecommendation: string;
}

export interface StilwellRegionDiagnosis {
  typeNumber: number; // 1 to 14
  conditionText: string;
  category: 'Ganadora (ERM > 0)' | 'Perdedora (ERM < 0)' | 'Neutra';
  interpretation: string;
}

export interface DynamicsResult {
  rij: number[][]; // [i][j] Vij(t) / Vij(0)
  rj: number[]; // [j] sum_i Vij(t) / sum_i Vij(0)
  riNac: number[]; // [i] sum_j Vij(t) / sum_j Vij(0)
  rNac: number; // grandTotal(t) / grandTotal(0)
  // Restructuring CRr (by region)
  crrDiffSigned: number[][]; // [i][j]
  crrDiffAbs: number[][]; // [i][j]
  crrDiffSignedBase: number[]; // [i] for national/base column
  crrAdjustmentSum: number[]; // [j]
  crr: number[]; // [j]
  // Redistribution CRs (by sector)
  crsDiffSigned: number[][]; // [i][j]
  crsDiffAbs: number[][]; // [i][j]
  crsAdjustmentSum: number[]; // [i]
  crs: number[]; // [i]
  // Shift-Share Traditional
  et: number[]; // [j]
  edMatrix: number[][]; // [i][j] Vij(t) - Vij(0)*riNac
  ed: number[]; // [j]
  ee: number[]; // [j] ET_j - ED_j
  traditionalDiagnosis: ShiftShareRegionDiagnosis[]; // [j]
  // Shift-Share Modified (Stilwell)
  eiMatrix: number[][]; // [i][j]
  ei: number[]; // [j]
  eem: number[]; // [j] EI_j - EE_j
  erm: number[]; // [j] ED_j - EEM_j
  ermVerification: number[]; // [j] ET_j - EI_j
  etm: number[]; // [j] ERM_j - EEM_j
  etmSum: number[]; // [j] ERM_j + EEM_j
  stilwellDiagnosis: StilwellRegionDiagnosis[]; // [j]
}

export interface ProjectionRegionResult {
  regionIndex: number;
  regionName: string;
  totalEmploymentET: number; // sum_i Vij
  basicBySector: number[]; // X_ij
  totalBasicEB: number; // sum_i X_ij
  totalNonBasicENB: number; // ET - EB
  nonBasicRatio: number; // ENB / ET
  basicRatio: number; // EB / ET
  multiplierM: number; // ET / EB
  multiplierFormulaAlt: number; // 1 / (1 - (ENB/ET))
  appliedGrowthRatePercent: number | null; // g%
  deltaEB: number; // change in basic activity
  deltaET: number; // projected absolute increase
  deltaETPercent: number; // projected % increase
  newProjectedTotal: number; // ET + deltaET
  stepByStepFormula: string;
}

export interface ProjectionResult {
  periodUsed: 't0' | 't1';
  periodLabel: string;
  xijMatrix: number[][]; // [i][j]
  qijUsed: number[][]; // [i][j]
  vijUsed: number[][]; // [i][j]
  regions: ProjectionRegionResult[];
  annualSeriesSummary?: {
    validCount: number;
    excludedYears: string[];
    averageRatio: number;
    impliedPercent: number;
  };
}

export interface PresetExample {
  id: string;
  name: string;
  subtitle: string;
  slideReference: string;
  badge: string;
  description: string;
  config: StudyConfig;
}
