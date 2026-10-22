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
} from 'lucide-react';
import { PRESET_EXAMPLES } from './data/presets';
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
import { ConfigWizard } from './components/ConfigWizard';
import { StructureTab } from './components/StructureTab';
import { DynamicsTab } from './components/DynamicsTab';
import { ProjectionTab } from './components/ProjectionTab';

type ActiveTab = 'config' | 'capture' | 'structure' | 'dynamics' | 'projection';

const STORAGE_CURRENT_KEY = 'diagnostico_regional_active_config_v2';
const STORAGE_PROJECTS_KEY = 'diagnostico_regional_saved_projects_v2';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function App() {
  // Load active config from localStorage or fallback to preset 0 (Morelia vs Michoacán)
  const [config, setConfig] = useState<StudyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.sectors) && Array.isArray(parsed.matrixT0)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default preset
    }
    return JSON.parse(JSON.stringify(PRESET_EXAMPLES[0].config));
  });

  // Load saved local projects list
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('structure');
  const [activePresetId, setActivePresetId] = useState<string>(
    PRESET_EXAMPLES[0].id
  );
  const [presetsModalOpen, setPresetsModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectFeedback, setProjectFeedback] = useState<string | null>(null);

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save current config to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
  }, [config]);

  // Persist savedProjects list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(savedProjects));
    } catch {
      // Ignore
    }
  }, [savedProjects]);

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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
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
        // Imported a raw Excel/CSV matrix
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-20 md:pb-6">
      {/* TOP EXECUTIVE HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-inner shrink-0">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight leading-tight">
                  Diagnóstico Estratégico Territorial
                </h1>
                {/* Connection & Local Persistence Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>Modo Online • Guardado Local</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>Modo Offline Activo - Guardado Local</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Estructura, Dinámica y Proyección Productiva (PWA 100% Offline)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Botón Cargar Caso de Estudio */}
            <button
              type="button"
              onClick={() => setPresetsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
              <span>Cargar Caso de Estudio</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Botón Gestor de Proyectos Locales */}
            <button
              type="button"
              onClick={() => setProjectsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs shadow-sm transition cursor-pointer"
              title="Guardar, cargar o importar/exportar proyectos locales (.json / .xlsx)"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Proyectos Locales</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-700 text-[10px] font-mono">
                {savedProjects.length}
              </span>
            </button>

            {/* Exportar XLSX (SheetJS) */}
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
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              title="Exportar libro Excel (.xlsx) completo con todas las hojas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.XLSX</span>
            </button>

            {/* Botón Instalar App PWA */}
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              title="Instalar Aplicación Web Progresiva (PWA) para uso sin internet"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Instalar App</span>
            </button>

            {/* Imprimir / PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition cursor-pointer"
              title="Imprimir reporte o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SUB-BAR: PRECISION CONTROL & STUDY SUMMARY */}
        <div className="bg-slate-950/90 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-300 truncate max-w-full">
              <span className="font-semibold text-white truncate">
                {config.title}
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Ref:{' '}
                <strong className="text-emerald-300">
                  {config.baseTotalName}
                </strong>{' '}
                (
                {config.baseTotalMode === 'manual_column'
                  ? 'Manual'
                  : 'Σⱼ Vᵢⱼ'}
                )
              </span>
            </div>

            {/* Controles de Precisión de Cálculo */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-400 font-medium hidden sm:inline">
                  Precisión:
                </span>
                <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                  {(
                    [
                      { id: 'exact', label: 'Exacto (Excel)' },
                      { id: '2_decimals', label: 'Redondeo 2 dec. (Pizarrón)' },
                      { id: '4_decimals', label: '4 dec.' },
                    ] as { id: IntermediatePrecision; label: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setConfig({ ...config, intermediatePrecision: opt.id })
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                        config.intermediatePrecision === opt.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <select
                  value={config.displayDecimals}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      displayDecimals: Number(
                        e.target.value
                      ) as DisplayDecimals,
                    })
                  }
                  className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] font-mono font-bold"
                >
                  <option value={2}>Ver 2 dec.</option>
                  <option value={4}>Ver 4 dec.</option>
                  <option value={6}>Ver 6 dec.</option>
                  <option value={9}>Ver 9 dec.</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Dimensiones (I × J)
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mt-1">
              {config.sectors.length} Sectores × {config.regions.length}{' '}
              {config.regions.length === 1 ? 'Región' : 'Regiones'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {config.regions.join(', ')}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Base ({config.year0Label})
            </div>
            <div className="text-base sm:text-xl font-extrabold font-mono text-indigo-950 mt-1">
              {formatNumber(structT0.grandTotal, 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">
              {config.baseTotalName} en t₀
            </div>
          </div>

          {config.periodType === '2_periods' && dynamics ? (
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Base ({config.year1Label}) y r_global
              </div>
              <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                <span className="text-base sm:text-xl font-extrabold font-mono text-indigo-950">
                  {formatNumber(structT1.grandTotal, 0)}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    dynamics.rNac >= 1
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  r={formatNumber(dynamics.rNac, 2)} (
                  {((dynamics.rNac - 1) * 100 >= 0 ? '+' : '') +
                    formatNumber((dynamics.rNac - 1) * 100, 1)}
                  %)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {config.year0Label} → {config.year1Label}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Alcance Temporal
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">
                1 Periodo ({config.year0Label})
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Estructura + Proyección
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Multiplicador Básico (Mⱼ)
            </div>
            {(() => {
              const bestReg = projection.regions.reduce(
                (best, r) => (r.multiplierM > best.multiplierM ? r : best),
                projection.regions[0]
              );
              return (
                <>
                  <div className="text-base sm:text-xl font-extrabold font-mono text-emerald-700 mt-1">
                    M = {formatNumber(bestReg?.multiplierM || 0, 2)}{' '}
                    <span className="text-xs font-sans font-bold text-slate-600">
                      ({bestReg?.regionName})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    ΔE_T: +
                    {formatNumber(
                      projection.regions.reduce((s, r) => s + r.deltaET, 0),
                      1
                    )}{' '}
                    unidades
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* DESKTOP NAVIGATION TABS (Hidden on Mobile < 768px) */}
        <div className="hidden md:flex bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex-wrap gap-1.5 no-print">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs lg:text-sm transition cursor-pointer ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>1. Configuración</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs lg:text-sm transition cursor-pointer ${
              activeTab === 'capture'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-4 h-4 text-emerald-400" />
            <span>2. Captura de Datos (Vᵢⱼ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs lg:text-sm transition cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>3. Estructura</span>
          </button>

          <button
            type="button"
            disabled={config.periodType !== '2_periods'}
            onClick={() => setActiveTab('dynamics')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs lg:text-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'dynamics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>4. Dinámica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projection')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs lg:text-sm transition cursor-pointer ${
              activeTab === 'projection'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>5. Proyección</span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
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

      {/* MOBILE BOTTOM TAB BAR (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.2)] no-print">
        <div className="grid grid-cols-5 h-16">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'config'
                ? 'text-indigo-400 bg-slate-800/80'
                : 'text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>1. Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'capture'
                ? 'text-emerald-400 bg-slate-800/80'
                : 'text-slate-400'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>2. Datos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'structure'
                ? 'text-indigo-400 bg-slate-800/80'
                : 'text-slate-400'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>3. Estructura</span>
          </button>

          <button
            type="button"
            disabled={config.periodType !== '2_periods'}
            onClick={() => setActiveTab('dynamics')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition disabled:opacity-30 ${
              activeTab === 'dynamics'
                ? 'text-indigo-400 bg-slate-800/80'
                : 'text-slate-400'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>4. Dinámica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projection')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
              activeTab === 'projection'
                ? 'text-emerald-400 bg-slate-800/80'
                : 'text-slate-400'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>5. Proyecc.</span>
          </button>
        </div>
      </nav>

      {/* MODAL DE CASOS DE ESTUDIO PRECARGADOS (OFFLINE) */}
      {presetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Cargar Caso de Estudio Precargado (100% Offline)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Incluye el Caso Real Morelia vs. Michoacán (2015-2025),
                    Ejercicios de Clase (Colón, Shift-Share) y Examen 1
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPresetsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {PRESET_EXAMPLES.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                          {preset.slideReference}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                            <Check className="w-3.5 h-3.5" /> Activo
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {preset.name}
                      </h4>
                      <div className="text-xs font-semibold text-indigo-700 mt-0.5">
                        {preset.subtitle}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>
                        {preset.config.sectors.length} Sectores ×{' '}
                        {preset.config.regions.length} Regiones
                      </span>
                      <span className="font-sans font-bold text-indigo-600">
                        Cargar caso →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTOR DE PROYECTOS LOCALES (.JSON / .XLSX / LOCALSTORAGE) */}
      {projectsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Gestor de Proyectos Locales y Respaldo (.XLSX / .JSON)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Guarda múltiples escenarios en tu dispositivo, o expórtalos
                    e impórtalos sin conexión
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjectsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            {projectFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                {projectFeedback}
              </div>
            )}

            {/* Save Current Scenario */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Guardar Escenario Actual en este Dispositivo
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={`Nombre (por defecto: ${config.title})`}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrentProject}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Escenario Local
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
                className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel (.XLSX)
              </button>

              <button
                type="button"
                onClick={() => exportProjectToJSON(config)}
                className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                <FileJson className="w-4 h-4" />
                Exportar Proyecto (.JSON)
              </button>

              <button
                type="button"
                onClick={() => importFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 min-h-[44px] p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Escenarios Guardados en el Dispositivo ({savedProjects.length}
                  )
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
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Descargar también en .CSV plano
                </button>
              </div>

              {savedProjects.length === 0 ? (
                <div className="p-6 text-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Aún no has guardado escenarios personalizados en la lista.
                  (Nota: Tu sesión activa siempre se guarda automáticamente en
                  cada cambio).
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {savedProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 bg-white hover:bg-slate-50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Guardado: {proj.updatedAt} •{' '}
                          {proj.config.sectors.length} Sectores ×{' '}
                          {proj.config.regions.length} Regiones
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadProject(proj)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
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

      {/* MODAL INSTRUCCIONES DE INSTALACIÓN PWA */}
      {installHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-violet-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Instalar App (100% Offline en Celular y PC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInstallHelpOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Esta aplicación cuenta con <strong>Service Worker</strong> y{' '}
                <strong>Manifest PWA</strong> activos para funcionar sin
                conexión:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>En Android (Chrome):</strong> Toca el menú de 3 puntos
                  (⋮) y selecciona{' '}
                  <em>&ldquo;Instalar aplicación&rdquo;</em> o{' '}
                  <em>&ldquo;Agregar a la pantalla principal&rdquo;</em>.
                </li>
                <li>
                  <strong>En iPhone / iPad (Safari):</strong> Toca el botón{' '}
                  <em>Compartir</em> y selecciona{' '}
                  <em>&ldquo;Agregar a inicio&rdquo;</em>.
                </li>
                <li>
                  <strong>En Escritorio (Chrome / Edge):</strong> Haz clic en el
                  icono de instalación en la barra de direcciones derecha.
                </li>
              </ul>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInstallHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
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
