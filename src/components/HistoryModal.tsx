import React, { useState } from 'react';
import {
  X,
  History,
  Download,
  Trash2,
  ExternalLink,
  Calendar,
  Building2,
  TrendingUp,
  GitCompare,
  CheckCircle,
  Eye
} from 'lucide-react';
import { ScanRecord } from '../types';
import { exportScanToCsv } from '../utils/exportCsv';

interface HistoryModalProps {
  history: ScanRecord[];
  onClose: () => void;
  onLoadScan: (record: ScanRecord) => void;
  onDeleteScan: (id: string) => void;
  onClearHistory: () => void;
  onOpenCompareWith: (recordA: ScanRecord) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  onClose,
  onLoadScan,
  onDeleteScan,
  onClearHistory,
  onOpenCompareWith,
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredHistory = history.filter((item) => {
    const q = filterText.toLowerCase();
    return (
      item.config.keyword.toLowerCase().includes(q) ||
      item.config.businessName.toLowerCase().includes(q) ||
      item.dateFormatted.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lịch sử quét Local SEO</h3>
              <p className="text-xs text-slate-400">
                Đã lưu {history.length} lần quét trong bộ nhớ trình duyệt
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử quét?')) {
                    onClearHistory();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-900/40 hover:bg-rose-950/40 transition"
              >
                Xóa tất cả
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Input */}
        {history.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Lọc theo từ khóa, tên doanh nghiệp..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-2">
              <History className="w-10 h-10 mx-auto text-slate-600" />
              <p>Chưa có lịch sử quét nào được lưu.</p>
              <p className="text-xs text-slate-500">
                Mỗi khi bạn hoàn thành một lần quét, dữ liệu sẽ tự động lưu tại đây.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Không tìm thấy lần quét nào khớp với từ khóa tìm kiếm.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {item.config.businessName}
                      </span>
                      {item.isDemo && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-indigo-400 font-medium mt-0.5">
                      Từ khóa: &quot;{item.config.keyword}&quot;
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.dateFormatted}</span>
                  </div>
                </div>

                {/* Metrics pill */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 px-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Lưới quét</span>
                    <span className="font-semibold text-slate-200">
                      {item.config.gridSize}x{item.config.gridSize} ({item.config.stepKm}km)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Hạng trung bình</span>
                    <span className="font-bold text-white font-mono">
                      {item.summary.avgRank ? `#${item.summary.avgRank}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Tỷ lệ Top 3</span>
                    <span className="font-bold text-emerald-400">
                      {item.summary.top3Percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Tỷ lệ Top 10</span>
                    <span className="font-bold text-amber-400">
                      {item.summary.top10Percentage}%
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onLoadScan(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem lại</span>
                    </button>

                    <button
                      onClick={() => onOpenCompareWith(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                      title="Chọn để so sánh với một lần quét khác"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>So sánh</span>
                    </button>

                    <button
                      onClick={() => exportScanToCsv(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
                      title="Tải về file CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteScan(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="Xóa lần quét này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
