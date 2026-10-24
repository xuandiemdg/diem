/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  History,
  Download,
  GitCompare,
  Radar,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { GridPoint, GridSize, GridStepKm, ScanConfig, ScanRecord, ScanSummary } from './types';
import { generateGridPoints } from './utils/geo';
import { calculateScanSummary, scanGridWithConcurrency } from './utils/serper';
import { exportScanToCsv } from './utils/exportCsv';
import { MapComponent } from './components/MapComponent';
import { ScanForm } from './components/ScanForm';
import { SummaryStats } from './components/SummaryStats';
import { PointDetailModal } from './components/PointDetailModal';
import { HistoryModal } from './components/HistoryModal';
import { CompareModal } from './components/CompareModal';
import { Sidebar } from './components/Sidebar';

const STORAGE_API_KEY = 'serper_api_key';
const STORAGE_HISTORY = 'local_rank_grid_history';

const DEFAULT_CONFIG: ScanConfig = {
  keyword: 'Nha khoa uy tín',
  businessName: 'Nha Khoa Kim',
  cidOrPlaceId: '',
  centerLat: 21.028511,
  centerLng: 105.854444,
  centerAddress: 'Hồ Hoàn Kiếm, Hà Nội',
  gridSize: 5,
  stepKm: 1,
  hl: 'vi',
  gl: 'vn',
};

export default function App() {
  // 1. API Key & Settings
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_API_KEY) || '';
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    // If user hasn't set an API key yet, default to Demo mode so they can try right away
    return !localStorage.getItem(STORAGE_API_KEY);
  });

  // 2. Scan Form Config
  const [config, setConfig] = useState<ScanConfig>(DEFAULT_CONFIG);

  // 3. Grid Points State
  const [points, setPoints] = useState<GridPoint[]>(() => {
    return generateGridPoints(DEFAULT_CONFIG.centerLat, DEFAULT_CONFIG.centerLng, DEFAULT_CONFIG.gridSize, DEFAULT_CONFIG.stepKm);
  });

  // 4. Scanning Execution State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 5. Summary Results State
  const [summary, setSummary] = useState<ScanSummary>(() => {
    return calculateScanSummary([], DEFAULT_CONFIG.businessName);
  });

  // 6. History State
  const [history, setHistory] = useState<ScanRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 7. Modals & UI Controls
  const [selectedPoint, setSelectedPoint] = useState<GridPoint | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareInitialA, setCompareInitialA] = useState<ScanRecord | null>(null);
  const [isPickingCenter, setIsPickingCenter] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'competitors'>('map');

  // 8. Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Save API key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_API_KEY, key);
    if (key.trim()) {
      setIsDemo(false);
    }
  };

  // Preview / Reset Grid Points when grid geometry changes
  const handlePreviewGrid = useCallback(() => {
    const newPoints = generateGridPoints(config.centerLat, config.centerLng, config.gridSize, config.stepKm);
    setPoints(newPoints);
    setScannedCount(0);
    setSummary(calculateScanSummary([], config.businessName));
  }, [config.centerLat, config.centerLng, config.gridSize, config.stepKm]);

  // When center coordinates or grid size changes, re-generate preview if not scanning
  useEffect(() => {
    if (!isScanning) {
      handlePreviewGrid();
    }
  }, [handlePreviewGrid, isScanning]);

  // Save history to localStorage
  const saveToHistory = (record: ScanRecord) => {
    setHistory((prev) => {
      const updated = [record, ...prev].slice(0, 50); // keep last 50 scans
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  // Start Scan
  const handleStartScan = async () => {
    if (!config.keyword.trim()) {
      alert('Vui lòng nhập Từ khóa tìm kiếm');
      return;
    }
    if (!config.businessName.trim()) {
      alert('Vui lòng nhập Tên doanh nghiệp cần theo dõi');
      return;
    }
    if (!isDemo && !apiKey.trim()) {
      const confirmDemo = confirm(
        'Bạn chưa nhập Serper API Key!\n\nBạn có muốn chuyển sang "Chế độ Demo Giả Lập" để trải nghiệm thử miễn phí không?'
      );
      if (confirmDemo) {
        setIsDemo(true);
      } else {
        return;
      }
    }

    // Prepare fresh grid
    const freshPoints = generateGridPoints(config.centerLat, config.centerLng, config.gridSize, config.stepKm);
    setPoints(freshPoints);
    setIsScanning(true);
    setScannedCount(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const completedPoints = await scanGridWithConcurrency(
        freshPoints,
        config,
        apiKey,
        isDemo,
        (currentPoints, currentIdx) => {
          setPoints(currentPoints);
          setActivePointIndex(currentIdx);
          const done = currentPoints.filter((p) => p.status === 'success' || p.status === 'failed').length;
          setScannedCount(done);
        },
        controller.signal
      );

      // Final summary
      const finalSummary = calculateScanSummary(completedPoints, config.businessName, config.cidOrPlaceId);
      setSummary(finalSummary);

      // Save scan record to history
      const record: ScanRecord = {
        id: `scan_${Date.now()}`,
        timestamp: Date.now(),
        dateFormatted: new Date().toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        config: { ...config },
        points: completedPoints,
        summary: finalSummary,
        isDemo,
      };
      saveToHistory(record);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert('Lỗi trong quá trình quét: ' + err.message);
      }
    } finally {
      setIsScanning(false);
      setActivePointIndex(null);
      abortControllerRef.current = null;
    }
  };

  // Stop Scan
  const handleStopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsScanning(false);
      // Compute partial summary
      const partialSummary = calculateScanSummary(points, config.businessName, config.cidOrPlaceId);
      setSummary(partialSummary);
    }
  };

  // Center coordinate picking from map
  const handleSelectCenterFromMap = (lat: number, lng: number) => {
    setConfig((prev) => ({
      ...prev,
      centerLat: Number(lat.toFixed(6)),
      centerLng: Number(lng.toFixed(6)),
      centerAddress: `Tọa độ chọn: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    }));
    setIsPickingCenter(false);
  };

  // Export current scan to CSV
  const handleExportCurrentCsv = () => {
    if (points.length === 0) return;
    const currentRecord: ScanRecord = {
      id: `current_${Date.now()}`,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('vi-VN'),
      config,
      points,
      summary,
      isDemo,
    };
    exportScanToCsv(currentRecord);
  };

  // Load past scan from history
  const handleLoadScanFromHistory = (record: ScanRecord) => {
    setConfig(record.config);
    setPoints(record.points);
    setSummary(record.summary);
    setShowHistoryModal(false);
  };

  // Delete scan from history
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_HISTORY);
  };

  // Open comparison modal with record A
  const handleOpenCompareWith = (recordA: ScanRecord) => {
    setCompareInitialA(recordA);
    setShowHistoryModal(false);
    setShowCompareModal(true);
  };

  const progressPercent =
    points.length > 0 ? Math.round((scannedCount / points.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* Left Sidebar: Pinned and clearly visible */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectDashboard={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setActiveTab('map');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation Header */}
        <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Tool Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0">
                  <Radar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                      Local Rank Grid Scanner
                    </h1>
                    <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Maps SEO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Quét thứ hạng từ khóa Local Pack theo ma trận tọa độ địa phương
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links to Ecosystem Tools */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href="https://geotag-ai.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition"
                title="Mở công cụ GeoTag Vị trí"
              >
                <span>GeoTag Vị trí</span>
                <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">Mới</span>
              </a>

              <a
                href="https://audit-maps1.ai.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition"
                title="Mở công cụ Audit Maps và đối thủ"
              >
                <span>Audit Maps và đối thủ</span>
                <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">Hot</span>
              </a>
            </div>

            {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Demo indicator */}
            {isDemo && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Chế độ Demo
              </span>
            )}

            {/* Compare Button */}
            <button
              onClick={() => {
                setCompareInitialA(history[0] || null);
                setShowCompareModal(true);
              }}
              disabled={history.length < 2}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title={history.length < 2 ? 'Cần ít nhất 2 lần quét để so sánh' : 'So sánh 2 lần quét'}
            >
              <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">So sánh 2 lần</span>
            </button>

            {/* History Button */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition flex items-center gap-1.5 relative"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lịch sử ({history.length})</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCurrentCsv}
              disabled={summary.scannedPoints === 0}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Xuất kết quả hiện tại ra CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Progress Bar Banner when Scanning */}
        {isScanning && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-xl space-y-2 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                <span className="font-bold text-white text-sm">
                  Đang quét lưới thứ hạng Google Maps ({scannedCount} / {points.length} điểm)
                </span>
                <span className="text-indigo-400 font-mono">
                  • {progressPercent}%
                </span>
              </div>
              <div className="text-slate-400 flex items-center gap-2">
                <span>Chạy song song 4 luồng (Concurrency: 4)</span>
                <span>• Tự động retry khi gặp lỗi mạng</span>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Scan Configuration Form (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <ScanForm
              config={config}
              onChangeConfig={setConfig}
              apiKey={apiKey}
              onSaveApiKey={handleSaveApiKey}
              isDemo={isDemo}
              onToggleDemo={setIsDemo}
              isScanning={isScanning}
              onStartScan={handleStartScan}
              onStopScan={handleStopScan}
              isPickingCenter={isPickingCenter}
              onTogglePickingCenter={() => setIsPickingCenter(!isPickingCenter)}
              onPreviewGrid={handlePreviewGrid}
            />

            {/* Instructions & Best Practices */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Hướng dẫn tối ưu Local SEO Grid
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-slate-300">Lưới 3x3:</strong> Thích hợp kiểm tra nhanh bán kính hẹp (9 credits).
                </li>
                <li>
                  <strong className="text-slate-300">Lưới 5x5:</strong> Tiêu chuẩn đánh giá toàn diện bán kính đô thị (25 credits).
                </li>
                <li>
                  <strong className="text-slate-300">Khớp CID/Place ID:</strong> Đảm bảo nhận diện chính xác 100% doanh nghiệp ngay cả khi trùng tên với đối thủ.
                </li>
                <li>
                  <strong className="text-slate-300">Màu sắc:</strong> Xanh (Top 1-3), Vàng (Top 4-10), Đỏ (Top 11-20), Xám (Ngoài top 20).
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Interactive Map + Analytics Dashboard (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6 flex flex-col">
            {/* View Switcher Tabs (Bản đồ / Phân tích đối thủ) */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'map'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Bản đồ nhiệt ({points.length} điểm)</span>
                </button>
                <button
                  onClick={() => setActiveTab('competitors')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'competitors'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Bảng tổng kết & Đối thủ</span>
                </button>
              </div>

              {/* Status indicator */}
              <div className="text-xs text-slate-400">
                {summary.scannedPoints > 0 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã quét xong {summary.scannedPoints} điểm
                  </span>
                ) : (
                  <span>Chế độ xem trước lưới</span>
                )}
              </div>
            </div>

            {/* Map View */}
            <div className={`space-y-4 ${activeTab === 'map' ? 'block' : 'hidden'}`}>
              <div className="h-[480px] sm:h-[540px] w-full">
                <MapComponent
                  centerLat={config.centerLat}
                  centerLng={config.centerLng}
                  businessName={config.businessName}
                  points={points}
                  stepKm={config.stepKm}
                  isPickingCenter={isPickingCenter}
                  onSelectCenter={handleSelectCenterFromMap}
                  onSelectPoint={(point) => setSelectedPoint(point)}
                  selectedPointId={selectedPoint?.id}
                />
              </div>

              {/* Hint under map */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>
                  💡 Nhấn trực tiếp vào bất kỳ số thứ hạng nào trên bản đồ để xem <strong>Top 5 đối thủ</strong> tại tọa độ đó.
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Tâm: {config.centerLat.toFixed(4)}, {config.centerLng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Summary Statistics & Competitors View */}
            <div className={`${activeTab === 'competitors' ? 'block' : 'block'}`}>
              <SummaryStats
                summary={summary}
                keyword={config.keyword}
                businessName={config.businessName}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding & Attribution */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 py-5 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="leading-relaxed text-slate-300 text-xs sm:text-[13px]">
            Local Rank Grid Scanner by{' '}
            <a
              href="https://mapsngon.vn/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
            >
              <strong>Mapsngon</strong>
            </a>{' '}
            - Phát triển bởi <strong className="font-bold text-white">Mr. Đình Diệm</strong>{' '}
            <a
              href="tel:0966666341"
              className="text-slate-300 hover:text-white transition-colors"
            >
              0966666341
            </a>
            · Phân tích thứ hạng Google Maps Local SEO đa điểm · Hỗ trợ Serper API &amp; OpenStreetMap.
          </p>
          <a
            href="https://mapsngon.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 transition-all flex items-center gap-1.5"
          >
            <span>mapsngon.vn</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
      </div>

      {/* Point Detail Modal (Top 5 Competitors at coordinate) */}
      <PointDetailModal
        point={selectedPoint}
        businessName={config.businessName}
        onClose={() => setSelectedPoint(null)}
      />

      {/* History Modal */}
      {showHistoryModal && (
        <HistoryModal
          history={history}
          onClose={() => setShowHistoryModal(false)}
          onLoadScan={handleLoadScanFromHistory}
          onDeleteScan={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          onOpenCompareWith={handleOpenCompareWith}
        />
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <CompareModal
          history={history}
          initialRecordA={compareInitialA}
          onClose={() => {
            setShowCompareModal(false);
            setCompareInitialA(null);
          }}
        />
      )}
    </div>
  );
}
