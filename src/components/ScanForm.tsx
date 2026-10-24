import React, { useState, useEffect } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Search,
  MapPin,
  Crosshair,
  Sliders,
  ExternalLink,
  Play,
  Square,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { GridSize, GridStepKm, ScanConfig } from '../types';
import { searchLocationNominatim, GeocodeResult } from '../utils/geo';

interface ScanFormProps {
  config: ScanConfig;
  onChangeConfig: (newConfig: ScanConfig) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  isDemo: boolean;
  onToggleDemo: (val: boolean) => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  isPickingCenter: boolean;
  onTogglePickingCenter: () => void;
  onPreviewGrid: () => void;
}

export const ScanForm: React.FC<ScanFormProps> = ({
  config,
  onChangeConfig,
  apiKey,
  onSaveApiKey,
  isDemo,
  onToggleDemo,
  isScanning,
  onStartScan,
  onStopScan,
  isPickingCenter,
  onTogglePickingCenter,
  onPreviewGrid,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalApiKey(val);
    onSaveApiKey(val);
  };

  // Debounced search for address
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      const results = await searchLocationNominatim(searchQuery);
      setSearchResults(results);
      setIsSearchingLocation(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc: GeocodeResult) => {
    onChangeConfig({
      ...config,
      centerLat: loc.lat,
      centerLng: loc.lng,
      centerAddress: loc.displayName,
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ Geolocation');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChangeConfig({
          ...config,
          centerLat: Number(pos.coords.latitude.toFixed(6)),
          centerLng: Number(pos.coords.longitude.toFixed(6)),
          centerAddress: 'Vị trí hiện tại của bạn',
        });
        setGeoLocating(false);
      },
      (err) => {
        alert('Không thể lấy vị trí hiện tại: ' + err.message);
        setGeoLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const totalPoints = config.gridSize * config.gridSize;
  const estimatedCredits = totalPoints;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xl">
      {/* API Key Box */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Serper API Key
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleDemo(!isDemo)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                isDemo
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {isDemo ? 'Chế độ Demo Giả Lập' : 'Bật Demo (Không tốn key)'}
            </button>
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={localApiKey}
            onChange={handleApiKeyChange}
            placeholder={isDemo ? 'Đang chạy chế độ demo giả lập (không cần key)' : 'Nhập Serper API key (ví dụ: a48f1...)'}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-3 pr-20 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title={showApiKey ? 'Ẩn key' : 'Hiện key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Lưu an toàn trong localStorage của bạn</span>
          <a
            href="https://serper.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
          >
            Nhận 2,500 credits free tại serper.dev
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Scan Form */}
      <div className="space-y-4">
        {/* Keyword & Business Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Từ khóa tìm kiếm <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.keyword}
                onChange={(e) => onChangeConfig({ ...config, keyword: e.target.value })}
                placeholder="Ví dụ: phòng khám nha khoa, cafe acoutic..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên doanh nghiệp cần theo dõi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={config.businessName}
              onChange={(e) => onChangeConfig({ ...config, businessName: e.target.value })}
              placeholder="Ví dụ: Nha Khoa Kim, Highlands Coffee..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* CID / Place ID (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>CID hoặc Place ID (Khớp chính xác 100%)</span>
            <span className="text-[11px] text-slate-400 font-normal">Tùy chọn</span>
          </label>
          <input
            type="text"
            value={config.cidOrPlaceId || ''}
            onChange={(e) => onChangeConfig({ ...config, cidOrPlaceId: e.target.value })}
            placeholder="Ví dụ: 108849201948271 hoặc ChIJ..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Center Coordinate & Location Search */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              Tọa độ trung tâm lưới quét
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={geoLocating}
                className="text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-md transition flex items-center gap-1 disabled:opacity-50"
                title="Lấy tọa độ hiện tại của bạn"
              >
                <Crosshair className="w-3 h-3 text-indigo-400" />
                <span>{geoLocating ? 'Đang định vị...' : 'GPS'}</span>
              </button>
              <button
                type="button"
                onClick={onTogglePickingCenter}
                className={`text-[11px] px-2 py-1 rounded-md transition flex items-center gap-1 font-medium ${
                  isPickingCenter
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Bấm để kích hoạt chế độ click trên bản đồ"
              >
                <MapPin className="w-3 h-3" />
                <span>{isPickingCenter ? 'Đang chọn trên Map' : 'Chọn trên bản đồ'}</span>
              </button>
            </div>
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh địa chỉ (Hồ Gươm Hà Nội, Quận 1 TP.HCM, Đà Nẵng...)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {isSearchingLocation && (
              <span className="absolute right-3 top-2.5 text-[11px] text-slate-400 animate-pulse">
                Đang tìm...
              </span>
            )}

            {/* Dropdown results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800">
                {searchResults.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{loc.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lat & Lng Input Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Vĩ độ (Latitude)</span>
              <input
                type="number"
                step="0.000001"
                value={config.centerLat}
                onChange={(e) => onChangeConfig({ ...config, centerLat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Kinh độ (Longitude)</span>
              <input
                type="number"
                step="0.000001"
                value={config.centerLng}
                onChange={(e) => onChangeConfig({ ...config, centerLng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          {config.centerAddress && (
            <div className="text-[11px] text-slate-400 line-clamp-1 italic">
              Vị trí: {config.centerAddress}
            </div>
          )}
        </div>

        {/* Grid Dimensions & Spacing */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kích thước lưới
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700">
              {([3, 5, 7] as GridSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, gridSize: size })}
                  className={`py-1.5 text-xs font-semibold rounded transition ${
                    config.gridSize === size
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {totalPoints} điểm quét
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Khoảng cách mỗi điểm
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700">
              {([0.5, 1, 2, 5] as GridStepKm[]).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, stepKm: step })}
                  className={`py-1.5 text-xs font-semibold rounded transition ${
                    config.stepKm === step
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {step}km
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Phủ bán kính ~{(config.stepKm * Math.floor(config.gridSize / 2)).toFixed(1)} km
            </span>
          </div>
        </div>

        {/* Language & Country */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ngôn ngữ (hl)
            </label>
            <select
              value={config.hl}
              onChange={(e) => onChangeConfig({ ...config, hl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="vi">Tiếng Việt (vi)</option>
              <option value="en">English (en)</option>
              <option value="ja">Japanese (ja)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quốc gia (gl)
            </label>
            <select
              value={config.gl}
              onChange={(e) => onChangeConfig({ ...config, gl: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="vn">Việt Nam (vn)</option>
              <option value="us">Hoa Kỳ (us)</option>
              <option value="sg">Singapore (sg)</option>
              <option value="jp">Nhật Bản (jp)</option>
            </select>
          </div>
        </div>

        {/* Credit Cost Box */}
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-300">Ước tính tiêu thụ: </span>
              <strong className="text-white font-bold">{estimatedCredits} credits</strong>
              <span className="text-slate-400 text-[11px] block">
                (1 credit / 1 điểm tọa độ trên Serper Maps)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700">
              {totalPoints} requests
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          {isScanning ? (
            <button
              type="button"
              onClick={onStopScan}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Dừng Quét</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onStartScan}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt đầu Quét ({totalPoints} điểm)</span>
              </button>

              <button
                type="button"
                onClick={onPreviewGrid}
                className="py-3 px-3.5 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
                title="Cập nhật lưới và xem trước trên bản đồ"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Xem lưới</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
