import {
  DynamicsResult,
  IntermediatePrecision,
  ProjectionRegionResult,
  ProjectionResult,
  ShiftShareRegionDiagnosis,
  StilwellRegionDiagnosis,
  StructurePeriodResult,
  StudyConfig,
} from '../types/regional';

export function roundIntermediate(value: number, precision: IntermediatePrecision): number {
  if (!Number.isFinite(value)) return 0;
  if (precision === 'exact') return value;
  if (precision === '2_decimals') return Math.round((value + Number.EPSILON) * 100) / 100;
  if (precision === '4_decimals') return Math.round((value + Number.EPSILON) * 10000) / 10000;
  return value;
}

export function formatNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function computeStructureForPeriod(
  matrix: number[][],
  manualBase: number[],
  baseTotalMode: 'sum_regions' | 'manual_column',
  periodLabel: string,
  precision: IntermediatePrecision
): StructurePeriodResult {
  const numSectors = matrix.length;
  const numRegions = matrix[0]?.length || 0;

  // Regional totals: sum_i Vij (column sums)
  const regionTotals: number[] = Array(numRegions).fill(0);
  for (let j = 0; j < numRegions; j++) {
    let sum = 0;
    for (let i = 0; i < numSectors; i++) {
      sum += Number(matrix[i]?.[j] || 0);
    }
    regionTotals[j] = sum;
  }

  // Sectoral base totals: sum_j Vij (either sum of regions or manual external column)
  const sectorTotals: number[] = Array(numSectors).fill(0);
  for (let i = 0; i < numSectors; i++) {
    if (baseTotalMode === 'manual_column') {
      sectorTotals[i] = Number(manualBase[i] || 0);
    } else {
      let sum = 0;
      for (let j = 0; j < numRegions; j++) {
        sum += Number(matrix[i]?.[j] || 0);
      }
      sectorTotals[i] = sum;
    }
  }

  // Grand total: sum_i sum_j Vij
  const grandTotal = sectorTotals.reduce((acc, v) => acc + v, 0);

  // 1. Pij (Intraregional sectoral share) & Base sector share
  const pijPercent: number[][] = [];
  const pijDecimal: number[][] = [];
  const baseSectorShareDecimal: number[] = [];

  for (let i = 0; i < numSectors; i++) {
    const rawBaseShare = grandTotal > 0 ? sectorTotals[i] / grandTotal : 0;
    baseSectorShareDecimal[i] = roundIntermediate(rawBaseShare, precision);

    const rowPercent: number[] = [];
    const rowDec: number[] = [];
    for (let j = 0; j < numRegions; j++) {
      const vij = Number(matrix[i]?.[j] || 0);
      const colTotal = regionTotals[j];
      const rawShare = colTotal > 0 ? vij / colTotal : 0;
      rowDec[j] = roundIntermediate(rawShare, precision);
      rowPercent[j] = roundIntermediate(rawShare * 100, precision);
    }
    pijDecimal.push(rowDec);
    pijPercent.push(rowPercent);
  }

  // 2. Pji (Interregional regional share) & Base region share
  const pjiPercent: number[][] = [];
  const pjiDecimal: number[][] = [];
  const baseRegionShareDecimal: number[] = [];

  for (let j = 0; j < numRegions; j++) {
    const rawRegShare = grandTotal > 0 ? regionTotals[j] / grandTotal : 0;
    baseRegionShareDecimal[j] = roundIntermediate(rawRegShare, precision);
  }

  for (let i = 0; i < numSectors; i++) {
    const rowPercent: number[] = [];
    const rowDec: number[] = [];
    const rowTotal = sectorTotals[i];
    for (let j = 0; j < numRegions; j++) {
      const vij = Number(matrix[i]?.[j] || 0);
      const rawShare = rowTotal > 0 ? vij / rowTotal : 0;
      rowDec[j] = roundIntermediate(rawShare, precision);
      rowPercent[j] = roundIntermediate(rawShare * 100, precision);
    }
    pjiDecimal.push(rowDec);
    pjiPercent.push(rowPercent);
  }

  // 3. Location Quotient Qij = (Vij / sum_i Vij) / (sum_j Vij / grandTotal)
  const qij: number[][] = [];
  for (let i = 0; i < numSectors; i++) {
    const rowQ: number[] = [];
    for (let j = 0; j < numRegions; j++) {
      const num = pijDecimal[i][j];
      const den = baseSectorShareDecimal[i];
      const rawQ = den > 0 ? num / den : 0;
      rowQ[j] = roundIntermediate(rawQ, precision);
    }
    qij.push(rowQ);
  }

  // 4. Specialization Coefficient QR_j = 0.5 * sum_i | pijDecimal[i][j] - baseSectorShareDecimal[i] |
  const qrDiffSigned: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const qrDiffAbs: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const qrAdjustmentSum: number[] = Array(numRegions).fill(0);
  const qr: number[] = Array(numRegions).fill(0);
  const cDivR: number[] = Array(numRegions).fill(0);

  for (let j = 0; j < numRegions; j++) {
    let sumAbs = 0;
    for (let i = 0; i < numSectors; i++) {
      const diff = roundIntermediate(pijDecimal[i][j] - baseSectorShareDecimal[i], precision);
      const absDiff = Math.abs(diff);
      qrDiffSigned[i][j] = diff;
      qrDiffAbs[i][j] = absDiff;
      sumAbs += absDiff;
    }
    qrAdjustmentSum[j] = roundIntermediate(sumAbs, precision);
    qr[j] = roundIntermediate(sumAbs / 2, precision);
    cDivR[j] = roundIntermediate(1 - qr[j], precision);
  }

  // 5. Localization / Spatial Concentration Coefficient QS_i = 0.5 * sum_j | pjiDecimal[i][j] - baseRegionShareDecimal[j] |
  const qsDiffSigned: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const qsDiffAbs: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const qsAdjustmentSum: number[] = Array(numSectors).fill(0);
  const qs: number[] = Array(numSectors).fill(0);
  const cDistS: number[] = Array(numSectors).fill(0);

  for (let i = 0; i < numSectors; i++) {
    let sumAbs = 0;
    for (let j = 0; j < numRegions; j++) {
      const diff = roundIntermediate(pjiDecimal[i][j] - baseRegionShareDecimal[j], precision);
      const absDiff = Math.abs(diff);
      qsDiffSigned[i][j] = diff;
      qsDiffAbs[i][j] = absDiff;
      sumAbs += absDiff;
    }
    qsAdjustmentSum[i] = roundIntermediate(sumAbs, precision);
    qs[i] = roundIntermediate(sumAbs / 2, precision);
    cDistS[i] = roundIntermediate(1 - qs[i], precision);
  }

  return {
    periodLabel,
    matrix,
    regionTotals,
    sectorTotals,
    grandTotal,
    pijPercent,
    pijDecimal,
    baseSectorShareDecimal,
    pjiPercent,
    pjiDecimal,
    baseRegionShareDecimal,
    qij,
    qrDiffSigned,
    qrDiffAbs,
    qrAdjustmentSum,
    qr,
    cDivR,
    qsDiffSigned,
    qsDiffAbs,
    qsAdjustmentSum,
    qs,
    cDistS,
  };
}

export function classifyTraditionalShiftShare(
  et: number,
  ed: number,
  ee: number
): ShiftShareRegionDiagnosis {
  // Láminas 34 y 35
  if (et >= 0) {
    if (ed >= 0 && ee >= 0) {
      return {
        typeNumber: 1,
        category: 'Ganadora',
        shortTitle: 'Tipo 1 (+ED, +EE ⇒ +ET): Región Ganadora Absoluta',
        description:
          'Mayor dinámica de la región en los sectores en comparación con el nivel base (intrasectorial) y mayor dinámica de la estructura intersectorial de la región en los sectores de rápido crecimiento.',
        policyRecommendation:
          'Consolidar liderazgo productivo y fortalecer encadenamientos intersectoriales y de exportación.',
      };
    } else if (ed >= 0 && ee < 0) {
      return {
        typeNumber: 2,
        category: 'Ganadora',
        shortTitle: 'Tipo 2 (+ED, -EE ⇒ +ET): Ganadora con Problemas Moderados de Especialización',
        description:
          'Mayor dinámica competitiva en los sectores regionales (+ED), pero menor dinámica de la estructura intersectorial (-EE) por peso en sectores lentos a nivel nacional.',
        policyRecommendation:
          'Política intrarregional e intersectorial: reorientar la estructura regional hacia sectores de rápido crecimiento.',
      };
    } else {
      return {
        typeNumber: 3,
        category: 'Ganadora',
        shortTitle: 'Tipo 3 (-ED, +EE ⇒ +ET): Ganadora con Problemas Moderados de Productividad Sectorial',
        description:
          'Menor dinámica regional en los sectores (-ED), compensada por una estructura intersectorial favorable en sectores nacionales dinámicos (+EE).',
        policyRecommendation:
          'Política interregional e intrasectorial: elevar la competitividad, tecnología y productividad de los sectores locales.',
      };
    }
  } else {
    if (ed < 0 && ee < 0) {
      return {
        typeNumber: 4,
        category: 'Perdedora',
        shortTitle: 'Tipo 4 (-ED, -EE ⇒ -ET): Región Perdedora Absoluta',
        description:
          'Menor dinámica regional en los sectores en comparación con el patrón referencial (-ED) y estructura concentrada en sectores de lento crecimiento o retroceso (-EE).',
        policyRecommendation:
          'Intervención integral: Política interregional e intrasectorial (productividad sectorial) + Política intrarregional e intersectorial (reconversión de especialización).',
      };
    } else if (ed < 0 && ee >= 0) {
      return {
        typeNumber: 5,
        category: 'Perdedora',
        shortTitle: 'Tipo 5 (-ED, +EE ⇒ -ET): Perdedora con Problemas Severos de Productividad Sectorial',
        description:
          'Aunque cuenta con presencia en sectores dinámicos a nivel nacional (+EE), su muy baja dinámica intrasectorial (-ED) provoca una pérdida neta frente al país.',
        policyRecommendation:
          'Política interregional e intrasectorial urgente: modernización productiva, infraestructura e innovación dentro de los sectores existentes.',
      };
    } else {
      return {
        typeNumber: 6,
        category: 'Perdedora',
        shortTitle: 'Tipo 6 (+ED, -EE ⇒ -ET): Perdedora con Problemas Severos de Especialización',
        description:
          'Sus sectores locales son competitivos (+ED), pero la región está fuertemente atada a sectores en estancamiento o declive nacional (-EE).',
        policyRecommendation:
          'Política intrarregional e intersectorial urgente: diversificación y reconversión hacia industrias dinámicas.',
      };
    }
  }
}

export function classifyStilwell(
  ee: number,
  eem: number,
  erm: number
): StilwellRegionDiagnosis {
  // Lámina 39: F.J.B. Stilwell (1969), "Regional Growth and Structural Adaption"
  const eePos = ee >= 0;
  const eemPos = eem >= 0;
  const ermPos = erm >= 0;
  const category: 'Ganadora (ERM > 0)' | 'Perdedora (ERM < 0)' | 'Neutra' =
    erm > 0 ? 'Ganadora (ERM > 0)' : erm < 0 ? 'Perdedora (ERM < 0)' : 'Neutra';

  if (eePos && eemPos && ermPos) {
    return {
      typeNumber: 1,
      conditionText: 'EE > 0, EEM > 0, ERM > 0',
      category,
      interpretation:
        'Tipo 1 (Óptimo): Estructura inicial favorable (+EE), reasignación positiva hacia sectores dinámicos (+EEM) y alto dinamismo competitivo regional (+ERM). Región Ganadora consolidada.',
    };
  }
  if (!eePos && !eemPos && !ermPos) {
    return {
      typeNumber: 2,
      conditionText: 'EE < 0, EEM < 0, ERM < 0',
      category,
      interpretation:
        'Tipo 2 (Crítico): Estructura inicial desfavorable (-EE), reasignación hacia sectores en retroceso (-EEM) y pérdida competitiva regional (-ERM). Región Perdedora aguda.',
    };
  }
  if (eePos && eemPos && !ermPos) {
    const lhs = Math.abs(ee + eem);
    const rhs = Math.abs(erm);
    if (lhs >= rhs) {
      return {
        typeNumber: 3,
        conditionText: 'EE > 0, EEM > 0, ERM < 0 con |EE + EEM| > |ERM|',
        category,
        interpretation:
          'Tipo 3: Estructura inicial y cambio estructural favorables que superan la desventaja competitiva residual (|EE + EEM| > |ERM|).',
      };
    }
    return {
      typeNumber: 4,
      conditionText: 'EE > 0, EEM > 0, ERM < 0 con |EE + EEM| < |ERM|',
      category,
      interpretation:
        'Tipo 4: Pese a tener estructura inicial y reasignación positivas, la caída competitiva regional (-ERM) es mayor (|EE + EEM| < |ERM|).',
    };
  }
  if (eePos && !eemPos && ermPos) {
    const lhs = Math.abs(ee + erm);
    const rhs = Math.abs(eem);
    if (lhs >= rhs) {
      return {
        typeNumber: 5,
        conditionText: 'EE > 0, EEM < 0, ERM > 0 con |EE + ERM| > |EEM|',
        category,
        interpretation:
          'Tipo 5: Región Ganadora (+ERM) con buena estructura inicial (+EE) que compensa con creces un ajuste estructural desfavorable (-EEM).',
      };
    }
    return {
      typeNumber: 6,
      conditionText: 'EE > 0, EEM < 0, ERM > 0 con |EE + ERM| < |EEM|',
      category,
      interpretation:
        'Tipo 6: Región con ERM positivo y buena estructura inicial, pero con fuerte reasignación hacia sectores lentos (|EE + ERM| < |EEM|).',
    };
  }
  if (!eePos && eemPos && ermPos) {
    const lhs = Math.abs(eem + erm);
    const rhs = Math.abs(ee);
    if (lhs >= rhs) {
      return {
        typeNumber: 7,
        conditionText: 'EE < 0, EEM > 0, ERM > 0 con |EEM + ERM| > |EE|',
        category,
        interpretation:
          'Tipo 7: Región Ganadora (+ERM) en reconversión exitosa: la reasignación positiva (+EEM) y la competitividad superan la mala estructura inicial (-EE).',
      };
    }
    return {
      typeNumber: 8,
      conditionText: 'EE < 0, EEM > 0, ERM > 0 con |EEM + ERM| < |EE|',
      category,
      interpretation:
        'Tipo 8: Región Ganadora (+ERM) con reconversión positiva (+EEM), aunque aún lastrada por el peso de su desventaja estructural inicial (|EEM + ERM| < |EE|).',
    };
  }
  if (eePos && !eemPos && !ermPos) {
    const lhs = Math.abs(ee);
    const rhs = Math.abs(eem + erm);
    if (lhs >= rhs) {
      return {
        typeNumber: 9,
        conditionText: 'EE > 0, EEM < 0, ERM < 0 con |EE| > |EEM + ERM|',
        category,
        interpretation:
          'Tipo 9: Región con pérdida competitiva (-ERM) y reasignación negativa (-EEM), amortiguada por una fuerte ventaja estructural inicial (|EE| > |EEM + ERM|).',
      };
    }
    return {
      typeNumber: 10,
      conditionText: 'EE > 0, EEM < 0, ERM < 0 con |EE| < |EEM + ERM|',
      category,
      interpretation:
        'Tipo 10: Región Perdedora (-ERM): la ventaja estructural inicial (+EE) fue insuficiente ante el retroceso competitivo (-ERM) y la reasignación negativa (-EEM).',
    };
  }
  if (!eePos && eemPos && !ermPos) {
    const lhs = Math.abs(eem);
    const rhs = Math.abs(ee + erm);
    if (lhs >= rhs) {
      return {
        typeNumber: 11,
        conditionText: 'EE < 0, EEM > 0, ERM < 0 con |EEM| > |EE + ERM|',
        category,
        interpretation:
          'Tipo 11: Fuerte reestructuración positiva hacia sectores dinámicos (+EEM) que supera la suma de las desventajas inicial y residual (|EEM| > |EE + ERM|).',
      };
    }
    return {
      typeNumber: 12,
      conditionText: 'EE < 0, EEM > 0, ERM < 0 con |EEM| < |EE + ERM|',
      category,
      interpretation:
        'Tipo 12: La reasignación positiva (+EEM) aún es insuficiente para contrarrestar la mala estructura inicial (-EE) y el rezago competitivo (-ERM).',
    };
  }
  // (!eePos && !eemPos && ermPos) -> Tipos 13 y 14
  const lhs = Math.abs(erm);
  const rhs = Math.abs(ee + eem);
  if (lhs >= rhs) {
    return {
      typeNumber: 13,
      conditionText: 'EE < 0, EEM < 0, ERM > 0 con |ERM| > |EE + EEM|',
      category,
      interpretation:
        'Tipo 13: Región Ganadora por alta resiliencia competitiva (+ERM), capaz de superar tanto una estructura inicial adversa (-EE) como una reasignación negativa (-EEM).',
    };
  }
  return {
    typeNumber: 14,
    conditionText: 'EE < 0, EEM < 0, ERM > 0 con |ERM| < |EE + EEM|',
    category,
    interpretation:
      'Tipo 14: Región Ganadora marginal (+ERM > 0): muestra competitividad neta positiva después de descontar la reasignación, aunque |ERM| < |EE + EEM|.',
  };
}

export function computeDynamics(
  structT0: StructurePeriodResult,
  structT1: StructurePeriodResult,
  config: StudyConfig
): DynamicsResult {
  const precision = config.intermediatePrecision;
  const numSectors = config.sectors.length;
  const numRegions = config.regions.length;

  // 1. Variation Quotients rij = Vij(t) / Vij(0), rj, riNac, rNac
  const rij: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  for (let i = 0; i < numSectors; i++) {
    for (let j = 0; j < numRegions; j++) {
      const v0 = structT0.matrix[i]?.[j] || 0;
      const vt = structT1.matrix[i]?.[j] || 0;
      rij[i][j] = v0 > 0 ? roundIntermediate(vt / v0, precision) : 0;
    }
  }

  const rj: number[] = Array(numRegions).fill(0);
  for (let j = 0; j < numRegions; j++) {
    const tot0 = structT0.regionTotals[j] || 0;
    const tott = structT1.regionTotals[j] || 0;
    rj[j] = tot0 > 0 ? roundIntermediate(tott / tot0, precision) : 0;
  }

  const riNac: number[] = Array(numSectors).fill(0);
  for (let i = 0; i < numSectors; i++) {
    const sec0 = structT0.sectorTotals[i] || 0;
    const sect = structT1.sectorTotals[i] || 0;
    riNac[i] = sec0 > 0 ? roundIntermediate(sect / sec0, precision) : 0;
  }

  const rNac =
    structT0.grandTotal > 0
      ? roundIntermediate(structT1.grandTotal / structT0.grandTotal, precision)
      : 0;

  // 2. Coefficient of Restructuring (CRr_j)
  // CRr_j = 0.5 * sum_i | (Vij(t)/sum_i Vij(t)) - (Vij(0)/sum_i Vij(0)) |
  const crrDiffSigned: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const crrDiffAbs: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const crrDiffSignedBase: number[] = Array(numSectors).fill(0);
  const crrAdjustmentSum: number[] = Array(numRegions).fill(0);
  const crr: number[] = Array(numRegions).fill(0);

  for (let i = 0; i < numSectors; i++) {
    crrDiffSignedBase[i] = roundIntermediate(
      structT1.baseSectorShareDecimal[i] - structT0.baseSectorShareDecimal[i],
      precision
    );
  }

  for (let j = 0; j < numRegions; j++) {
    let sumAbs = 0;
    for (let i = 0; i < numSectors; i++) {
      const shareT = structT1.pijDecimal[i][j];
      const share0 = structT0.pijDecimal[i][j];
      const diff = roundIntermediate(shareT - share0, precision);
      const absDiff = Math.abs(diff);
      crrDiffSigned[i][j] = diff;
      crrDiffAbs[i][j] = absDiff;
      sumAbs += absDiff;
    }
    crrAdjustmentSum[j] = roundIntermediate(sumAbs, precision);
    crr[j] = roundIntermediate(sumAbs / 2, precision);
  }

  // 3. Coefficient of Redistribution (CRs_i)
  // CRs_i = 0.5 * sum_j | (Vij(t)/sum_j Vij(t)) - (Vij(0)/sum_j Vij(0)) |
  const crsDiffSigned: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const crsDiffAbs: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const crsAdjustmentSum: number[] = Array(numSectors).fill(0);
  const crs: number[] = Array(numSectors).fill(0);

  for (let i = 0; i < numSectors; i++) {
    let sumAbs = 0;
    for (let j = 0; j < numRegions; j++) {
      const shareT = structT1.pjiDecimal[i][j];
      const share0 = structT0.pjiDecimal[i][j];
      const diff = roundIntermediate(shareT - share0, precision);
      const absDiff = Math.abs(diff);
      crsDiffSigned[i][j] = diff;
      crsDiffAbs[i][j] = absDiff;
      sumAbs += absDiff;
    }
    crsAdjustmentSum[i] = roundIntermediate(sumAbs, precision);
    crs[i] = roundIntermediate(sumAbs / 2, precision);
  }

  // 4. Traditional Shift-Share (ET_j, ED_j, EE_j)
  // ET_j = sum_i Vij(t) - [ sum_i Vij(0) * rNac ]
  // ED_j = sum_i [ Vij(t) - (Vij(0) * riNac[i]) ]
  // EE_j = ET_j - ED_j
  const et: number[] = Array(numRegions).fill(0);
  const edMatrix: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const ed: number[] = Array(numRegions).fill(0);
  const ee: number[] = Array(numRegions).fill(0);
  const traditionalDiagnosis: ShiftShareRegionDiagnosis[] = [];

  for (let j = 0; j < numRegions; j++) {
    const totT = structT1.regionTotals[j];
    const tot0 = structT0.regionTotals[j];
    et[j] = roundIntermediate(totT - tot0 * rNac, precision);

    let sumEd = 0;
    for (let i = 0; i < numSectors; i++) {
      const vt = structT1.matrix[i]?.[j] || 0;
      const v0 = structT0.matrix[i]?.[j] || 0;
      const cellEd = roundIntermediate(vt - v0 * riNac[i], precision);
      edMatrix[i][j] = cellEd;
      sumEd += cellEd;
    }
    ed[j] = roundIntermediate(sumEd, precision);
    ee[j] = roundIntermediate(et[j] - ed[j], precision);
    traditionalDiagnosis.push(classifyTraditionalShiftShare(et[j], ed[j], ee[j]));
  }

  // 5. Stilwell Modified Shift-Share (EI_j, EEM_j, ERM_j, ETM_j)
  const eiMatrix: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  const ei: number[] = Array(numRegions).fill(0);
  const eem: number[] = Array(numRegions).fill(0);
  const erm: number[] = Array(numRegions).fill(0);
  const ermVerification: number[] = Array(numRegions).fill(0);
  const etm: number[] = Array(numRegions).fill(0);
  const etmSum: number[] = Array(numRegions).fill(0);
  const stilwellDiagnosis: StilwellRegionDiagnosis[] = [];

  for (let j = 0; j < numRegions; j++) {
    let sumEi = 0;
    for (let i = 0; i < numSectors; i++) {
      const vt = structT1.matrix[i]?.[j] || 0;
      const diffRate =
        config.stilwellMode === 'slide_37'
          ? roundIntermediate(rNac - riNac[i], precision)
          : roundIntermediate(riNac[i] - rNac, precision);
      const cellEi = roundIntermediate(vt * diffRate, precision);
      eiMatrix[i][j] = cellEi;
      sumEi += cellEi;
    }
    ei[j] = roundIntermediate(sumEi, precision);
    eem[j] = roundIntermediate(ei[j] - ee[j], precision);
    erm[j] = roundIntermediate(ed[j] - eem[j], precision);
    ermVerification[j] = roundIntermediate(et[j] - ei[j], precision);
    etm[j] = roundIntermediate(erm[j] - eem[j], precision);
    etmSum[j] = roundIntermediate(erm[j] + eem[j], precision);
    stilwellDiagnosis.push(classifyStilwell(ee[j], eem[j], erm[j]));
  }

  return {
    rij,
    rj,
    riNac,
    rNac,
    crrDiffSigned,
    crrDiffAbs,
    crrDiffSignedBase,
    crrAdjustmentSum,
    crr,
    crsDiffSigned,
    crsDiffAbs,
    crsAdjustmentSum,
    crs,
    et,
    edMatrix,
    ed,
    ee,
    traditionalDiagnosis,
    eiMatrix,
    ei,
    eem,
    erm,
    ermVerification,
    etm,
    etmSum,
    stilwellDiagnosis,
  };
}

export function computeAnnualSeriesAverage(config: StudyConfig): {
  validCount: number;
  excludedYears: string[];
  averageRatio: number;
  impliedPercent: number;
} {
  const series = config.projection.annualSeries || [];
  const mode = config.projection.annualSeriesInputMode || 'ratios';
  const validRatios: number[] = [];
  const excludedYears: string[] = [];

  for (let idx = 1; idx < series.length; idx++) {
    const pt = series[idx];
    const prev = series[idx - 1];
    const ratio =
      mode === 'totals'
        ? prev.totalValue > 0
          ? pt.totalValue / prev.totalValue
          : 1
        : pt.rateRatio;
    if (pt.excluded) {
      excludedYears.push(pt.year);
    } else if (Number.isFinite(ratio) && ratio > 0) {
      validRatios.push(ratio);
    }
  }

  const validCount = validRatios.length;
  const averageRatio =
    validCount > 0
      ? validRatios.reduce((a, b) => a + b, 0) / validCount
      : 1;
  const impliedPercent = (averageRatio - 1) * 100;

  return {
    validCount,
    excludedYears,
    averageRatio,
    impliedPercent,
  };
}

export function computeProjection(
  structT0: StructurePeriodResult,
  structT1: StructurePeriodResult,
  dynamics: DynamicsResult | null,
  config: StudyConfig
): ProjectionResult {
  const precision = config.intermediatePrecision;
  const useT1 = config.periodType === '2_periods' && config.projection.basePeriod === 't1';
  const activeStruct = useT1 ? structT1 : structT0;
  const periodUsed: 't0' | 't1' = useT1 ? 't1' : 't0';
  const numSectors = config.sectors.length;
  const numRegions = config.regions.length;

  // 1. Exportable Basic Quantity Xij
  // If Qij > 1 => Xij = (1 - (1 / Qij)) * Vij; else 0
  const xijMatrix: number[][] = Array.from({ length: numSectors }, () => Array(numRegions).fill(0));
  for (let i = 0; i < numSectors; i++) {
    for (let j = 0; j < numRegions; j++) {
      const q = activeStruct.qij[i][j];
      const vij = activeStruct.matrix[i]?.[j] || 0;
      if (q > 1) {
        const x = (1 - 1 / q) * vij;
        xijMatrix[i][j] = roundIntermediate(x, precision);
      } else {
        xijMatrix[i][j] = 0;
      }
    }
  }

  const annualSeriesSummary = computeAnnualSeriesAverage(config);
  const regions: ProjectionRegionResult[] = [];

  for (let j = 0; j < numRegions; j++) {
    const et = activeStruct.regionTotals[j] || 0;
    const basicBySector = xijMatrix.map((row) => row[j]);
    const eb = roundIntermediate(
      basicBySector.reduce((acc, v) => acc + v, 0),
      precision
    );
    const enb = roundIntermediate(et - eb, precision);
    const nonBasicRatio = et > 0 ? roundIntermediate(enb / et, precision) : 0;
    const basicRatio = et > 0 ? roundIntermediate(eb / et, precision) : 0;
    const multiplierM = eb > 0 ? roundIntermediate(et / eb, precision) : 0;
    const multiplierFormulaAlt =
      1 - nonBasicRatio > 0 ? roundIntermediate(1 / (1 - nonBasicRatio), precision) : 0;

    let appliedGrowthRatePercent: number | null = null;
    let deltaEB = 0;
    let deltaET = 0;
    let deltaETPercent = 0;
    let stepByStepFormula = '';

    const proj = config.projection;

    if (proj.method === 'manual_percent') {
      appliedGrowthRatePercent = proj.manualPercent;
      const gDec = proj.manualPercent / 100;

      if (proj.manualPercentCriterion === 'criterion_a_multiplier_rate') {
        deltaETPercent = multiplierM * proj.manualPercent;
        deltaET = et * (multiplierM * gDec);
        deltaEB = eb * gDec;
        stepByStepFormula = `Δ% Total = Mⱼ × Δ%E_B = ${multiplierM.toFixed(4)} × ${proj.manualPercent}% = ${deltaETPercent.toFixed(4)}%  ⇒  ΔE_T = E_T × (${deltaETPercent.toFixed(4)}%) = ${et.toFixed(2)} × ${(multiplierM * gDec).toFixed(6)} = ${deltaET.toFixed(4)}`;
      } else {
        deltaEB = eb * gDec;
        deltaET = multiplierM * deltaEB;
        deltaETPercent = et > 0 ? (deltaET / et) * 100 : 0;
        stepByStepFormula = `ΔE_B = E_B × (${proj.manualPercent}%) = ${eb.toFixed(4)} × ${gDec.toFixed(4)} = ${deltaEB.toFixed(4)}  ⇒  ΔE_T = [1 / (1 - (${enb.toFixed(2)}/${et.toFixed(2)}))] × ${deltaEB.toFixed(4)} = ${multiplierM.toFixed(4)} × ${deltaEB.toFixed(4)} = ${deltaET.toFixed(4)}`;
      }
    } else if (proj.method === 'annual_series_avg') {
      appliedGrowthRatePercent = annualSeriesSummary.impliedPercent;
      const gDec = appliedGrowthRatePercent / 100;

      if (proj.manualPercentCriterion === 'criterion_a_multiplier_rate') {
        deltaETPercent = multiplierM * appliedGrowthRatePercent;
        deltaET = et * (multiplierM * gDec);
        deltaEB = eb * gDec;
        stepByStepFormula = `r̄_interanual = ${annualSeriesSummary.averageRatio.toFixed(6)} ⇒ Δ%E_B = ${appliedGrowthRatePercent.toFixed(4)}%  ⇒  Δ% Total = Mⱼ × Δ%E_B = ${multiplierM.toFixed(4)} × ${appliedGrowthRatePercent.toFixed(4)}% = ${deltaETPercent.toFixed(4)}%  ⇒  ΔE_T = ${et.toFixed(2)} × ${(multiplierM * gDec).toFixed(6)} = ${deltaET.toFixed(4)}`;
      } else {
        deltaEB = eb * gDec;
        deltaET = multiplierM * deltaEB;
        deltaETPercent = et > 0 ? (deltaET / et) * 100 : 0;
        stepByStepFormula = `r̄_interanual = ${annualSeriesSummary.averageRatio.toFixed(6)} ⇒ Δ%E_B = ${appliedGrowthRatePercent.toFixed(4)}%  ⇒  ΔE_B = ${eb.toFixed(4)} × ${gDec.toFixed(6)} = ${deltaEB.toFixed(4)}  ⇒  ΔE_T = ${multiplierM.toFixed(4)} × ${deltaEB.toFixed(4)} = ${deltaET.toFixed(4)}`;
      }
    } else if (proj.method === 'historical_dynamic' && dynamics) {
      const rSource =
        proj.historicalRateSource === 'national_rate' ? dynamics.rNac : dynamics.rj[j];
      const nYears = Math.max(1, proj.yearsBetweenPeriods || 1);
      const rateDecimal =
        proj.historicalRateType === 'period_total'
          ? rSource - 1
          : Math.pow(Math.max(0, rSource), 1 / nYears) - 1;
      appliedGrowthRatePercent = rateDecimal * 100;

      if (proj.manualPercentCriterion === 'criterion_a_multiplier_rate') {
        deltaETPercent = multiplierM * appliedGrowthRatePercent;
        deltaET = et * (multiplierM * rateDecimal);
        deltaEB = eb * rateDecimal;
        stepByStepFormula = `g_hist = ${appliedGrowthRatePercent.toFixed(4)}%  ⇒  Δ% Total = Mⱼ × g_hist = ${multiplierM.toFixed(4)} × ${appliedGrowthRatePercent.toFixed(4)}% = ${deltaETPercent.toFixed(4)}%  ⇒  ΔE_T = ${et.toFixed(2)} × ${(multiplierM * rateDecimal).toFixed(6)} = ${deltaET.toFixed(4)}`;
      } else {
        deltaEB = eb * rateDecimal;
        deltaET = multiplierM * deltaEB;
        deltaETPercent = et > 0 ? (deltaET / et) * 100 : 0;
        stepByStepFormula = `g_hist = ${appliedGrowthRatePercent.toFixed(4)}%  ⇒  ΔE_B = ${eb.toFixed(4)} × ${rateDecimal.toFixed(6)} = ${deltaEB.toFixed(4)}  ⇒  ΔE_T = ${multiplierM.toFixed(4)} × ${deltaEB.toFixed(4)} = ${deltaET.toFixed(4)}`;
      }
    } else {
      // manual_absolute: ΔE_T = [1 / (1 - (E_NB/E_T))] * ΔE_B
      appliedGrowthRatePercent = null;
      deltaEB = proj.useSingleManualAbsolute
        ? proj.singleManualAbsoluteValue
        : Number(proj.manualAbsoluteDeltaEB[j] || 0);
      deltaET = multiplierM * deltaEB;
      deltaETPercent = et > 0 ? (deltaET / et) * 100 : 0;
      stepByStepFormula = `ΔE_T = [1 / (1 - (E_NB / E_T))] × ΔE_B = [1 / (1 - (${enb.toFixed(2)} / ${et.toFixed(2)}))] × ${deltaEB} = (1 / (1 - ${nonBasicRatio.toFixed(4)})) × ${deltaEB} = ${multiplierM.toFixed(4)} × ${deltaEB} = ${deltaET.toFixed(4)}`;
    }

    const newProjectedTotal = et + deltaET;

    regions.push({
      regionIndex: j,
      regionName: config.regions[j] || `R${j + 1}`,
      totalEmploymentET: et,
      basicBySector,
      totalBasicEB: eb,
      totalNonBasicENB: enb,
      nonBasicRatio,
      basicRatio,
      multiplierM,
      multiplierFormulaAlt,
      appliedGrowthRatePercent,
      deltaEB,
      deltaET,
      deltaETPercent,
      newProjectedTotal,
      stepByStepFormula,
    });
  }

  return {
    periodUsed,
    periodLabel: activeStruct.periodLabel,
    xijMatrix,
    qijUsed: activeStruct.qij,
    vijUsed: activeStruct.matrix,
    regions,
    annualSeriesSummary,
  };
}
