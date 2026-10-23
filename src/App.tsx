import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map,
  Settings,
  Table2,
  PieChart,
  Activity,
  Rocket,
  BookOpen,
  Download,
  Printer,
  SlidersHorizontal,
  Check,
  Sparkles,
  ChevronDown,
  Wifi,
  WifiOff,
  FolderKanban,
  Save,
  Trash2,
  Upload,
  FileSpreadsheet,
  FileJson,
  Smartphone,
  RotateCcw,
  Share,
  PlusSquare,
  AlertTriangle,
  Flame,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { PRESET_EXAMPLES, createBlankStudyConfig } from './data/presets';
import {
  DisplayDecimals,
  IntermediatePrecision,
  SavedProject,
  StudyConfig,
} from './types/regional';
import {
  computeDynamics,
  computeProjection,
  computeStructureForPeriod,
  formatNumber,
} from './utils/mathEngine';
import {
  exportFullReportToCSV,
  exportFullReportToXLSX,
  exportProjectToJSON,
  parseUploadedMatrixOrProjectFile,
} from './utils/exportReport';
import {
  sanitizeStudyConfig,
  usePersistentState,
} from './hooks/usePersistentState';
import { ConfigWizard } from './components/ConfigWizard';
import { StructureTab } from './components/StructureTab';
import { DynamicsTab } from './components/DynamicsTab';
import { ProjectionTab } from './components/ProjectionTab';

type ActiveTab = 'config' | 'capture' | 'structure' | 'dynamics' | 'projection';

const STORAGE_CURRENT_KEY = 'diagnostico_regional_active_config_v2';
const STORAGE_PROJECTS_KEY = 'diagnostico_regional_saved_projects_v2';
const STORAGE_ACTIVE_TAB_KEY = 'diagnostico_regional_active_tab_v2';
const STORAGE_ACTIVE_PRESET_KEY = 'diagnostico_regional_active_preset_v2';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const sanitizeActiveTab = (raw: unknown, fallback: ActiveTab): ActiveTab => {
  if (
    raw === 'config' ||
    raw === 'capture' ||
    raw === 'structure' ||
    raw === 'dynamics' ||
    raw === 'projection'
  ) {
    return raw;
  }
  return fallback;
};

export function App() {
  // Real-time persistent state connected to localStorage (every keystroke / onChange)
  const [config, setConfig] = usePersistentState<StudyConfig>(
    STORAGE_CURRENT_KEY,
    () => JSON.parse(JSON.stringify(PRESET_EXAMPLES[0].config)),
    sanitizeStudyConfig
  );

  const [savedProjects, setSavedProjects] = usePersistentState<SavedProject[]>(
    STORAGE_PROJECTS_KEY,
    [],
    (raw, fallback) => (Array.isArray(raw) ? (raw as SavedProject[]) : fallback)
  );

  const [activeTab, setActiveTab] = usePersistentState<ActiveTab>(
    STORAGE_ACTIVE_TAB_KEY,
    'structure',
    sanitizeActiveTab
  );

  const [activePresetId, setActivePresetId] = usePersistentState<string>(
    STORAGE_ACTIVE_PRESET_KEY,
    PRESET_EXAMPLES[0].id,
    (raw, fallback) => (typeof raw === 'string' ? raw : fallback)
  );

  const [presetsModalOpen, setPresetsModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectFeedback, setProjectFeedback] = useState<string | null>(null);
  const [lastSavedPulse, setLastSavedPulse] = useState(false);

  // Online / Offline & PWA Install Prompt state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Subtle visual pulse when autosave triggers on keystroke
  useEffect(() => {
    setLastSavedPulse(true);
    const t = setTimeout(() => setLastSavedPulse(false), 600);
    return () => clearTimeout(t);
  }, [config, activeTab]);

  // Ensure if periodType is 1_period and activeTab is dynamics, we redirect to structure
  useEffect(() => {
    if (config.periodType === '1_period' && activeTab === 'dynamics') {
      setActiveTab('structure');
    }
  }, [config.periodType, activeTab, setActiveTab]);

  // Listen to online/offline & PWA install prompt events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt && !isIOS) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setInstallHelpOpen(true);
    }
  };

  // Compute all regional analysis results reactively
  const structT0 = useMemo(
    () =>
      computeStructureForPeriod(
        config.matrixT0,
        config.manualBaseT0,
        config.baseTotalMode,
        config.year0Label,
        config.intermediatePrecision
      ),
    [
      config.matrixT0,
      config.manualBaseT0,
      config.baseTotalMode,
      config.year0Label,
      config.intermediatePrecision,
    ]
  );

  const structT1 = useMemo(
    () =>
      computeStructureForPeriod(
        config.matrixT1,
        config.manualBaseT1,
        config.baseTotalMode,
        config.year1Label,
        config.intermediatePrecision
      ),
    [
      config.matrixT1,
      config.manualBaseT1,
      config.baseTotalMode,
      config.year1Label,
      config.intermediatePrecision,
    ]
  );

  const dynamics = useMemo(() => {
    if (config.periodType !== '2_periods') return null;
    return computeDynamics(structT0, structT1, config);
  }, [config, structT0, structT1]);

  const projection = useMemo(
    () => computeProjection(structT0, structT1, dynamics, config),
    [structT0, structT1, dynamics, config]
  );

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_EXAMPLES.find((p) => p.id === presetId);
    if (!found) return;
    const cloned: StudyConfig = JSON.parse(JSON.stringify(found.config));
    setConfig(cloned);
    setActivePresetId(found.id);
    setPresetsModalOpen(false);
    if (cloned.periodType === '1_period' && activeTab === 'dynamics') {
      setActiveTab('structure');
    }
  };

  const handleConfirmResetBlank = () => {
    const blank = createBlankStudyConfig();
    setConfig(blank);
    setActivePresetId('custom_blank');
    setActiveTab('config');
    setResetConfirmOpen(false);
  };

  const handleConfirmRestoreDefault = () => {
    const def: StudyConfig = JSON.parse(
      JSON.stringify(PRESET_EXAMPLES[0].config)
    );
    setConfig(def);
    setActivePresetId(PRESET_EXAMPLES[0].id);
    setActiveTab('structure');
    setResetConfirmOpen(false);
  };

  // Local Project Manager actions
  const handleSaveCurrentProject = () => {
    const nameToUse = (newProjectName.trim() || config.title).slice(0, 80);
    const newEntry: SavedProject = {
      id: `proj_${Date.now()}`,
      name: nameToUse,
      updatedAt: new Date().toLocaleString('es-MX'),
      config: JSON.parse(JSON.stringify(config)),
    };
    setSavedProjects([newEntry, ...savedProjects]);
    setNewProjectName('');
    setProjectFeedback(`Escenario "${nameToUse}" guardado en este dispositivo.`);
    setTimeout(() => setProjectFeedback(null), 3500);
  };

  const handleLoadProject = (proj: SavedProject) => {
    const cloned: StudyConfig = JSON.parse(JSON.stringify(proj.config));
    setConfig(cloned);
    setProjectsModalOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    setSavedProjects(savedProjects.filter((p) => p.id !== id));
  };

  const handleImportProjectFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseUploadedMatrixOrProjectFile(file);
      if (result.type === 'full_project') {
        setConfig(result.config);
        setProjectFeedback(
          `Proyecto "${result.config.title}" importado correctamente.`
        );
      } else {
        const secCount = result.sectors.length;
        const regCount = result.regions.length;
        setConfig({
          ...config,
          title: file.name.replace(/\.[^.]+$/, ''),
          sectors: result.sectors,
          regions: result.regions,
          matrixT0: result.matrix,
          matrixT1: result.matrix.map((r) => [...r]),
          manualBaseT0: result.lastColAsManualBase,
          manualBaseT1: [...result.lastColAsManualBase],
        });
        setProjectFeedback(
          `Matriz de ${secCount}×${regCount} importada desde "${file.name}".`
        );
      }
    } catch (err) {
      setProjectFeedback(
        `Error al importar: ${
          err instanceof Error ? err.message : 'Archivo no válido'
        }`
      );
    } finally {
      e.target.value = '';
      setTimeout(() => setProjectFeedback(null), 4000);
    }
  };

  const activeStructureForHero =
    config.periodType === '2_periods' ? structT1 : structT0;
  const avgQr =
    activeStructureForHero.qr.length > 0
      ? activeStructureForHero.qr.reduce((a, b) => a + b, 0) /
        activeStructureForHero.qr.length
      : 0;
  const avgDiv = Math.max(0, Math.min(1, 1 - avgQr));

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100 pb-24 md:pb-10 relative overflow-x-hidden">
      {/* AMBIENT STREAMING / SOCIAL RADIAL GLOWS */}
      <div
        className="pointer-events-none fixed top-[-180px] left-[10%] w-[520px] h-[360px] rounded-full bg-emerald-500/[0.07] blur-[130px] z-0 no-print"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-[120px] right-[5%] w-[460px] h-[360px] rounded-full bg-violet-500/[0.07] blur-[140px] z-0 no-print"
        aria-hidden="true"
      />

      {/* TOP STREAMING GLASS HEADER */}
      <header className="sticky top-0 z-30 bg-[#09090B]/85 backdrop-blur-xl border-b border-white/[0.07] no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand + Live Autosave Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-400 to-violet-500 p-[1px] shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-[#09090B]/90 rounded-[15px] flex items-center justify-center">
                <Map className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white">
                  Diagnóstico Estratégico Territorial
                </h1>

                {/* Pulsing Green Dot: Autoguardado activo en dispositivo */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-zinc-900/90 text-emerald-300 border border-emerald-500/25 shadow-sm"
                  title="Cada cambio se guarda instantáneamente en el almacenamiento local de tu dispositivo"
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
                        lastSavedPulse ? 'scale-125' : ''
                      }`}
                    />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ED760]" />
                  </span>
                  <span>Autoguardado activo en dispositivo</span>
                </span>

                {/* Online/Offline Pill */}
                <span
                  className={`hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    isOnline
                      ? 'bg-white/[0.04] text-zinc-400 border-white/[0.07]'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      <span>PWA Lista</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      <span>Modo Offline</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Estructura, Dinámica Shift-Share y Proyección de Base Económica
              </p>
            </div>
          </div>

          {/* Action Pill Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Biblioteca de Escenarios Metodológicos */}
            <button
              type="button"
              onClick={() => setPresetsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Biblioteca de Escenarios</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Discreet Button: Limpiar / Nuevo Proyecto */}
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.08] font-semibold text-xs transition cursor-pointer"
              title="Limpiar datos actuales o iniciar un nuevo proyecto desde cero"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Limpiar / Nuevo Proyecto</span>
            </button>

            {/* Gestor de Proyectos Locales */}
            <button
              type="button"
              onClick={() => setProjectsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] font-semibold text-xs transition cursor-pointer"
              title="Guardar, cargar o importar/exportar proyectos locales (.json / .xlsx)"
            >
              <FolderKanban className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Proyectos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[10px] font-mono tabular-nums text-zinc-200">
                {savedProjects.length}
              </span>
            </button>

            {/* Exportar XLSX */}
            <button
              type="button"
              onClick={() =>
                exportFullReportToXLSX(
                  config,
                  structT0,
                  structT1,
                  dynamics,
                  projection
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition cursor-pointer"
              title="Exportar libro Excel (.xlsx) completo con todas las hojas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.XLSX</span>
            </button>

            {/* Botón Visible: Instalar App */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border border-violet-500/35 font-bold text-xs shadow-sm shadow-violet-500/10 transition cursor-pointer"
              title="Instalar Aplicación Web Progresiva (PWA) en Laptop, Android o iOS"
            >
              <Smartphone className="w-3.5 h-3.5 text-violet-300" />
              <span>Instalar App</span>
            </button>

            {/* Imprimir / PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition cursor-pointer"
              title="Imprimir reporte o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SUB-BAR: STUDY METADATA & PILL CHIP PRECISION CONTROLS */}
        <div className="bg-[#121214]/90 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-zinc-300 truncate max-w-full">
              <span className="inline-flex items-center gap-1.5 font-bold text-white truncate">
                <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {config.title}
              </span>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-zinc-400">
                Base Comparativa:{' '}
                <strong className="text-emerald-400 font-semibold">
                  {config.baseTotalName}
                </strong>{' '}
                <span className="text-zinc-500">
                  (
                  {config.baseTotalMode === 'manual_column'
                    ? 'Columna Independiente'
                    : 'Suma Σⱼ Vᵢⱼ'}
                  )
                </span>
              </span>
            </div>

            {/* Pill Chips for Calculation Precision */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-zinc-400 font-medium hidden sm:inline">
                  Precisión:
                </span>
                <div className="inline-flex rounded-full bg-zinc-950 p-0.5 border border-white/[0.08]">
                  {(
                    [
                      { id: 'exact', label: 'Exacto (Excel)' },
                      { id: '2_decimals', label: 'Redondeo 2 dec.' },
                      { id: '4_decimals', label: '4 dec.' },
                    ] as { id: IntermediatePrecision; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setConfig({ ...config, intermediatePrecision: opt.id })
                      }
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                        config.intermediatePrecision === opt.id
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <select
                value={config.displayDecimals}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    displayDecimals: Number(e.target.value) as DisplayDecimals,
                  })
                }
                className="bg-zinc-950 text-zinc-200 border border-white/[0.08] rounded-full px-2.5 py-0.5 text-[11px] font-mono tabular-nums font-bold focus:outline-none focus:border-emerald-500/50"
              >
                <option value={2}>Ver 2 dec.</option>
                <option value={4}>Ver 4 dec.</option>
                <option value={6}>Ver 6 dec.</option>
                <option value={9}>Ver 9 dec.</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 space-y-6">
        {/* BENTO GRID: STREAMING STATS & STORIES FEED CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Matriz & Diversificación Circular Ring */}
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                <Layers className="w-3 h-3" />
                <span>Estructura Territorial</span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-white mt-1 tabular-nums">
                {config.sectors.length} Sectores × {config.regions.length}{' '}
                {config.regions.length === 1 ? 'Región' : 'Regiones'}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                {config.regions.join(' • ')}
              </div>
            </div>
            {/* Circular Progress SVG for Average Diversification (1 - QR) */}
            <div
              className="relative w-14 h-14 shrink-0 flex items-center justify-center"
              title={`Diversificación media (1 - Qᴿ): ${formatNumber(avgDiv * 100, 1)}%`}
            >
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.round(avgDiv * 138.2)} 138.2`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-mono tabular-nums font-bold text-violet-300">
                <span>{formatNumber(avgDiv, 2)}</span>
                <span className="text-[8px] text-zinc-500">1-Qᴿ</span>
              </div>
            </div>
          </div>

          {/* Card 2: Volumen Base t0 */}
          <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-4 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Volumen Base ({config.year0Label})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-zinc-300 border border-white/[0.06]">
                t₀
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white mt-1.5">
              {formatNumber(structT0.grandTotal, 0)}
            </div>
            <div className="mt-2">
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" />
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                {config.baseTotalName} ({config.variableName})
              </div>
            </div>
          </div>

          {/* Card 3: Dinámica Intertemporal t1 / r_global */}
          {config.periodType === '2_periods' && dynamics ? (
            <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Dinámica ({config.year0Label} → {config.year1Label})
                </span>
                <span
                  className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full border ${
                    dynamics.rNac >= 1
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {((dynamics.rNac - 1) * 100 >= 0 ? '+' : '') +
                    formatNumber((dynamics.rNac - 1) * 100, 1)}
                  %
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white">
                  {formatNumber(structT1.grandTotal, 0)}
                </span>
                <span className="text-xs font-mono tabular-nums text-zinc-400">
                  r={formatNumber(dynamics.rNac, 3)}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      dynamics.rNac >= 1
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(18, Math.round(dynamics.rNac * 65))
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 truncate">
                  Shift-Share & Stilwell activos
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#121214]/90 backdrop-blur-xl rounded-3xl border border-white/[0.07] p-4 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Corte de Estudio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  Estático
                </span>
              </div>
              <div className="text-lg font-extrabold text-white mt-1.5">
                1 Periodo ({config.year0Label})
              </div>
              <div className="text-[11px] text-zinc-400 mt-2">
                Cocientes Qᵢⱼ, Especialización Qᴿ y Base Exportadora
              </div>
            </div>
          )}

          {/* Card 4: Multiplicador Básico Regional (Story Highlight Card) */}
          <div className="bg-gradient-to-br from-[#121214] via-[#18181B] to-emerald-950/40 backdrop-blur-xl rounded-3xl border border-emerald-500/25 p-4 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
            {(() => {
              const bestReg = projection.regions.reduce(
                (best, r) => (r.multiplierM > best.multiplierM ? r : best),
                projection.regions[0]
              );
              const totalDeltaET = projection.regions.reduce(
                (s, r) => s + r.deltaET,
                0
              );
              const basicPct = Math.min(
                100,
                Math.max(8, Math.round((bestReg?.basicRatio || 0) * 100))
              );
              return (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Multiplicador Básico (Mⱼ)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-[110px]">
                      {bestReg?.regionName}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mt-1.5">
                    <span className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
                      M = {formatNumber(bestReg?.multiplierM || 0, 2)}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-teal-300">
                      +
                      {formatNumber(totalDeltaET, 1)} ΔE_T
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${basicPct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 flex justify-between">
                      <span>Base Exportadora ({basicPct}%)</span>
                      <span className="font-mono tabular-nums text-emerald-300">
                        {projection.periodLabel}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* DESKTOP PILL CHIPS NAVIGATION BAR (Hidden on Mobile < 768px) */}
        <div className="hidden md:flex bg-[#121214]/90 backdrop-blur-xl rounded-full border border-white/[0.07] p-1.5 shadow-xl items-center gap-1.5 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs lg:text-sm transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>1. Configuración</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs lg:text-sm transition-all cursor-pointer ${
              activeTab === 'capture'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>2. Captura de Datos (Vᵢⱼ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs lg:text-sm transition-all cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>3. Estructura Productiva</span>
          </button>

          <button
            type="button"
            disabled={config.periodType !== '2_periods'}
            onClick={() => setActiveTab('dynamics')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs lg:text-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              activeTab === 'dynamics'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>4. Dinámica y Shift-Share</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projection')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs lg:text-sm transition-all cursor-pointer ${
              activeTab === 'projection'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-extrabold shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>5. Proyección Base</span>
          </button>
        </div>

        {/* ACTIVE MODULE VIEW */}
        <section>
          {activeTab === 'config' && (
            <ConfigWizard
              config={config}
              viewFilter="config"
              onChange={setConfig}
              onNavigateToCapture={() => setActiveTab('capture')}
              onNavigateToResults={() => setActiveTab('structure')}
            />
          )}

          {activeTab === 'capture' && (
            <ConfigWizard
              config={config}
              viewFilter="capture"
              onChange={setConfig}
              onNavigateToResults={() => setActiveTab('structure')}
            />
          )}

          {activeTab === 'structure' && (
            <StructureTab
              config={config}
              structT0={structT0}
              structT1={structT1}
            />
          )}

          {activeTab === 'dynamics' &&
            config.periodType === '2_periods' &&
            dynamics && (
              <DynamicsTab
                config={config}
                structT0={structT0}
                structT1={structT1}
                dynamics={dynamics}
                onChangeConfig={setConfig}
              />
            )}

          {activeTab === 'projection' && (
            <ProjectionTab
              config={config}
              projection={projection}
              onChangeConfig={setConfig}
            />
          )}
        </section>
      </main>

      {/* FLOATING MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-zinc-900/80 border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] no-print">
        <div className="grid grid-cols-5 h-16 px-1">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'config' ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition ${
                activeTab === 'config'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : ''
              }`}
            >
              <Settings className="w-4 h-4" />
            </div>
            <span>Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'capture' ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition ${
                activeTab === 'capture'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : ''
              }`}
            >
              <Table2 className="w-4 h-4" />
            </div>
            <span>Datos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'structure' ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition ${
                activeTab === 'structure'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : ''
              }`}
            >
              <PieChart className="w-4 h-4" />
            </div>
            <span>Estructura</span>
          </button>

          <button
            type="button"
            disabled={config.periodType !== '2_periods'}
            onClick={() => setActiveTab('dynamics')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition disabled:opacity-25 ${
              activeTab === 'dynamics' ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition ${
                activeTab === 'dynamics'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : ''
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
            <span>Dinámica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projection')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'projection' ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition ${
                activeTab === 'projection'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : ''
              }`}
            >
              <Rocket className="w-4 h-4" />
            </div>
            <span>Proyección</span>
          </button>
        </div>
      </nav>

      {/* MODAL: BIBLIOTECA DE ESCENARIOS METODOLÓGICOS */}
      {presetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print">
          <div className="bg-[#121214] rounded-3xl border border-white/[0.09] shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    Biblioteca de Escenarios Metodológicos
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Selecciona un procedimiento analítico precargado para
                    simulación inmediata 100% offline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPresetsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PRESET_EXAMPLES.map((preset, index) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/[0.08] border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'bg-[#18181B]/90 border-white/[0.07] hover:border-emerald-500/40 hover:bg-zinc-800/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          {index + 1}. {preset.badge}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Activo
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm sm:text-base text-white">
                        {preset.name}
                      </h4>
                      <div className="text-xs font-semibold text-emerald-400 mt-1">
                        {preset.subtitle}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-400">
                      <span>
                        {preset.config.sectors.length} Sectores ×{' '}
                        {preset.config.regions.length}{' '}
                        {preset.config.regions.length === 1
                          ? 'Región'
                          : 'Regiones'}
                      </span>
                      <span className="font-sans font-bold text-emerald-400">
                        Cargar procedimiento →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN LIMPIAR / NUEVO PROYECTO */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print">
          <div className="bg-[#121214] rounded-3xl border border-white/[0.09] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">
                  Limpiar / Iniciar Nuevo Proyecto
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Tu progreso actual está guardado automáticamente. Si deseas
              comenzar un estudio desde cero, elige cómo deseas inicializar las
              tablas:
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmResetBlank}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-extrabold text-xs text-left flex items-center justify-between shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <div>
                  <div className="text-sm">Crear Proyecto en Blanco (Ceros)</div>
                  <div className="text-[11px] font-medium opacity-80">
                    Limpia las celdas numéricas y abre el Paso 1 de Configuración
                  </div>
                </div>
                <RotateCcw className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleConfirmRestoreDefault}
                className="w-full p-3.5 rounded-2xl bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] font-bold text-xs text-left flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-sm">
                    Restaurar Diagnóstico Territorial SCIAN
                  </div>
                  <div className="text-[11px] font-normal text-zinc-400">
                    Vuelve al escenario predeterminado de 20 sectores
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancelar y conservar mis datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GESTOR DE PROYECTOS LOCALES (.JSON / .XLSX / LOCALSTORAGE) */}
      {projectsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print">
          <div className="bg-[#121214] rounded-3xl border border-white/[0.09] shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Gestor de Proyectos Locales y Respaldo (.XLSX / .JSON)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Guarda múltiples escenarios en tu dispositivo o expórtalos
                    sin conexión
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjectsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {projectFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                {projectFeedback}
              </div>
            )}

            {/* Save Current Scenario */}
            <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.07] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Guardar Copia del Escenario Actual en este Dispositivo
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={`Nombre (por defecto: ${config.title})`}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-white/10 bg-zinc-950 text-white text-sm focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentProject}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 text-xs font-extrabold cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4" />
                  Guardar Escenario
                </button>
              </div>
            </div>

            {/* Export / Import Files (.xlsx, .json, .csv) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  exportFullReportToXLSX(
                    config,
                    structT0,
                    structT1,
                    dynamics,
                    projection
                  )
                }
                className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel (.XLSX)
              </button>

              <button
                type="button"
                onClick={() => exportProjectToJSON(config)}
                className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-white/10 font-bold text-xs cursor-pointer"
              >
                <FileJson className="w-4 h-4 text-violet-400" />
                Exportar Proyecto (.JSON)
              </button>

              <button
                type="button"
                onClick={() => importFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-2xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 border border-violet-500/30 font-bold text-xs cursor-pointer"
              >
                <Upload className="w-4 h-4 text-violet-300" />
                Importar (.JSON / .XLSX)
              </button>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".json,.xlsx,.xls,.csv"
                onChange={handleImportProjectFile}
                className="hidden"
              />
            </div>

            {/* Saved Projects List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Escenarios Guardados ({savedProjects.length})
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    exportFullReportToCSV(
                      config,
                      structT0,
                      structT1,
                      dynamics,
                      projection
                    )
                  }
                  className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                >
                  Descargar también en .CSV plano
                </button>
              </div>

              {savedProjects.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-white/10 text-xs text-zinc-400">
                  Aún no has guardado copias adicionales en esta lista. Tu
                  sesión activa se guarda automáticamente en tiempo real en cada
                  pulsación de tecla.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] border border-white/[0.08] rounded-2xl overflow-hidden">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 bg-[#18181B] hover:bg-zinc-800/80 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-sm text-white">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                          {proj.updatedAt} • {proj.config.sectors.length}{' '}
                          Sectores × {proj.config.regions.length} Regiones
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadProject(proj)}
                          className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold cursor-pointer"
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 cursor-pointer"
                          title="Eliminar escenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELEGANTE: INSTALAR APP PWA (ANDROID, LAPTOP E iOS) */}
      {installHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print">
          <div className="bg-[#121214] rounded-3xl border border-white/[0.09] shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">
                    Instalar App en tu Dispositivo
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Acceso directo y funcionamiento 100% Offline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInstallHelpOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed">
              {/* iOS Step-by-Step Highlight */}
              <div className="p-4 rounded-2xl bg-[#18181B] border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs uppercase tracking-wider">
                  <Share className="w-4 h-4" />
                  <span>En iPhone / iPad (Safari iOS)</span>
                </div>
                <p className="text-zinc-300">
                  Para instalar la aplicación en tu pantalla de inicio en iOS:
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-zinc-200 font-medium">
                  <li>
                    Pulsa el botón{' '}
                    <strong className="text-emerald-300 inline-flex items-center gap-1">
                      Compartir <Share className="w-3 h-3 inline" />
                    </strong>{' '}
                    en la barra de navegación de Safari.
                  </li>
                  <li>
                    Desliza el menú y selecciona{' '}
                    <strong className="text-emerald-300 inline-flex items-center gap-1">
                      &ldquo;Agregar a pantalla de inicio&rdquo;{' '}
                      <PlusSquare className="w-3 h-3 inline" />
                    </strong>
                    .
                  </li>
                  <li>
                    Pulsa <strong>Agregar</strong> en la esquina superior
                    derecha.
                  </li>
                </ol>
              </div>

              {/* Android & Desktop Instructions */}
              <div className="p-4 rounded-2xl bg-[#18181B] border border-white/[0.07] space-y-2">
                <div className="font-bold text-violet-300 text-xs uppercase tracking-wider">
                  En Android y Laptop (Chrome / Edge)
                </div>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
                  <li>
                    <strong>Android:</strong> Abre el menú del navegador (⋮) y
                    pulsa <em>&ldquo;Instalar aplicación&rdquo;</em> o{' '}
                    <em>&ldquo;Agregar a la pantalla principal&rdquo;</em>.
                  </li>
                  <li>
                    <strong>Laptop / PC:</strong> Haz clic en el ícono de
                    instalación en el extremo derecho de la barra de
                    direcciones.
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInstallHelpOpen(false)}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 text-xs font-extrabold cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
