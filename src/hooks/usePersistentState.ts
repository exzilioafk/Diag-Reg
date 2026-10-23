import { useCallback, useEffect, useRef, useState } from 'react';
import { StudyConfig } from '../types/regional';

/**
 * Hook personalizado `usePersistentState` conectado a `localStorage`
 * Guarda instantáneamente (de forma síncrona en cada pulsación de tecla / `onChange`)
 * todos los datos en el dispositivo para prevenir pérdidas ante cierres accidentales,
 * recargas de página o apagado del celular/laptop.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
  sanitize?: (raw: unknown, fallback: T) => T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const getFallback = useCallback((): T => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, [initialValue]);

  const [state, setState] = useState<T>(() => {
    const fallback = getFallback();
    if (typeof window === 'undefined') return fallback;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item);
        return sanitize ? sanitize(parsed, fallback) : (parsed as T);
      }
    } catch {
      // Si el JSON previo está corrupto, usar el fallback seguro
    }
    return fallback;
  });

  const stateRef = useRef<T>(state);
  stateRef.current = state;

  // Guardado síncrono inmediato en cada cambio de estado (pulsación de tecla / onChange)
  const setPersistentState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const nextValue =
          typeof value === 'function'
            ? (value as (prevState: T) => T)(prev)
            : value;
        stateRef.current = nextValue;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch {
          // Ignorar errores de cuota de almacenamiento
        }
        return nextValue;
      });
    },
    [key]
  );

  // Respaldo adicional ante eventos de cierre de pestaña, recarga o suspensión móvil
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const flushToStorage = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(stateRef.current));
      } catch {
        // Ignorar errores de cuota
      }
    };

    flushToStorage();
    window.addEventListener('beforeunload', flushToStorage);
    window.addEventListener('pagehide', flushToStorage);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushToStorage();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushToStorage);
      window.removeEventListener('pagehide', flushToStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [key, state]);

  const resetPersistentState = useCallback(() => {
    const fresh = getFallback();
    stateRef.current = fresh;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(fresh));
      }
    } catch {
      // Ignorar
    }
    setState(fresh);
  }, [getFallback, key]);

  return [state, setPersistentState, resetPersistentState];
}

/**
 * Sanitizador defensivo para `StudyConfig` que garantiza que ninguna estructura
 * antigua en `localStorage` provoque una pantalla en blanco al actualizar la app.
 */
export function sanitizeStudyConfig(
  raw: unknown,
  fallback: StudyConfig
): StudyConfig {
  if (!raw || typeof raw !== 'object') return fallback;
  const obj = raw as Partial<StudyConfig>;

  if (
    !Array.isArray(obj.sectors) ||
    obj.sectors.length < 1 ||
    !Array.isArray(obj.regions) ||
    obj.regions.length < 1 ||
    !Array.isArray(obj.matrixT0)
  ) {
    return fallback;
  }

  const numSectors = obj.sectors.length;
  const numRegions = obj.regions.length;

  const normalizeMatrix = (mat: unknown, defaultMat: number[][]): number[][] => {
    if (!Array.isArray(mat)) return defaultMat;
    return Array.from({ length: numSectors }, (_, i) =>
      Array.from({ length: numRegions }, (_, j) => {
        const val = Number((mat as unknown[][])?.[i]?.[j]);
        return Number.isFinite(val) ? val : 0;
      })
    );
  };

  const normalizeVector = (vec: unknown, len: number): number[] => {
    if (!Array.isArray(vec)) return Array(len).fill(0);
    return Array.from({ length: len }, (_, i) => {
      const val = Number(vec[i]);
      return Number.isFinite(val) ? val : 0;
    });
  };

  const proj = (obj.projection || {}) as Partial<StudyConfig['projection']>;

  return {
    title: typeof obj.title === 'string' ? obj.title : fallback.title,
    variableName:
      typeof obj.variableName === 'string'
        ? obj.variableName
        : fallback.variableName,
    baseTotalName:
      typeof obj.baseTotalName === 'string'
        ? obj.baseTotalName
        : fallback.baseTotalName,
    periodType:
      obj.periodType === '1_period' || obj.periodType === '2_periods'
        ? obj.periodType
        : fallback.periodType,
    year0Label:
      typeof obj.year0Label === 'string' ? obj.year0Label : fallback.year0Label,
    year1Label:
      typeof obj.year1Label === 'string' ? obj.year1Label : fallback.year1Label,
    baseTotalMode:
      obj.baseTotalMode === 'sum_regions' ||
      obj.baseTotalMode === 'manual_column'
        ? obj.baseTotalMode
        : fallback.baseTotalMode,
    sectors: obj.sectors.map((s, i) =>
      typeof s === 'string' ? s : `S${i + 1}`
    ),
    regions: obj.regions.map((r, j) =>
      typeof r === 'string' ? r : `R${j + 1}`
    ),
    matrixT0: normalizeMatrix(obj.matrixT0, fallback.matrixT0),
    manualBaseT0: normalizeVector(obj.manualBaseT0, numSectors),
    matrixT1: normalizeMatrix(obj.matrixT1, fallback.matrixT1),
    manualBaseT1: normalizeVector(obj.manualBaseT1, numSectors),
    intermediatePrecision:
      obj.intermediatePrecision === 'exact' ||
      obj.intermediatePrecision === '2_decimals' ||
      obj.intermediatePrecision === '4_decimals'
        ? obj.intermediatePrecision
        : fallback.intermediatePrecision,
    displayDecimals:
      obj.displayDecimals === 2 ||
      obj.displayDecimals === 4 ||
      obj.displayDecimals === 6 ||
      obj.displayDecimals === 9
        ? obj.displayDecimals
        : fallback.displayDecimals,
    stilwellMode:
      obj.stilwellMode === 'slide_37' ||
      obj.stilwellMode === 'standard_stilwell'
        ? obj.stilwellMode
        : fallback.stilwellMode,
    projection: {
      basePeriod:
        proj.basePeriod === 't0' || proj.basePeriod === 't1'
          ? proj.basePeriod
          : fallback.projection.basePeriod,
      method:
        proj.method === 'manual_percent' ||
        proj.method === 'annual_series_avg' ||
        proj.method === 'historical_dynamic' ||
        proj.method === 'manual_absolute'
          ? proj.method
          : fallback.projection.method,
      manualPercent: Number.isFinite(Number(proj.manualPercent))
        ? Number(proj.manualPercent)
        : fallback.projection.manualPercent,
      manualPercentCriterion:
        proj.manualPercentCriterion === 'criterion_a_multiplier_rate' ||
        proj.manualPercentCriterion === 'criterion_b_base_proportion'
          ? proj.manualPercentCriterion
          : fallback.projection.manualPercentCriterion,
      annualSeriesInputMode:
        proj.annualSeriesInputMode === 'totals' ||
        proj.annualSeriesInputMode === 'ratios'
          ? proj.annualSeriesInputMode
          : fallback.projection.annualSeriesInputMode,
      annualSeries: Array.isArray(proj.annualSeries)
        ? proj.annualSeries
        : fallback.projection.annualSeries,
      historicalRateType:
        proj.historicalRateType === 'period_total' ||
        proj.historicalRateType === 'cagr_annual'
          ? proj.historicalRateType
          : fallback.projection.historicalRateType,
      historicalRateSource:
        proj.historicalRateSource === 'national_rate' ||
        proj.historicalRateSource === 'regional_rate'
          ? proj.historicalRateSource
          : fallback.projection.historicalRateSource,
      yearsBetweenPeriods: Number.isFinite(Number(proj.yearsBetweenPeriods))
        ? Math.max(1, Number(proj.yearsBetweenPeriods))
        : fallback.projection.yearsBetweenPeriods,
      manualAbsoluteDeltaEB: normalizeVector(
        proj.manualAbsoluteDeltaEB,
        numRegions
      ),
      useSingleManualAbsolute:
        typeof proj.useSingleManualAbsolute === 'boolean'
          ? proj.useSingleManualAbsolute
          : fallback.projection.useSingleManualAbsolute,
      singleManualAbsoluteValue: Number.isFinite(
        Number(proj.singleManualAbsoluteValue)
      )
        ? Number(proj.singleManualAbsoluteValue)
        : fallback.projection.singleManualAbsoluteValue,
    },
  };
}
