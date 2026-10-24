import React, { useState } from 'react';
import {
  X,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Calendar,
  Building2,
  ArrowRight,
  Award
} from 'lucide-react';
import { ScanRecord } from '../types';

interface CompareModalProps {
  history: ScanRecord[];
  initialRecordA?: ScanRecord | null;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  history,
  initialRecordA,
  onClose,
}) => {
  const [selectedIdA, setSelectedIdA] = useState<string>(
    initialRecordA?.id || (history.length > 1 ? history[1].id : history[0]?.id || '')
  );
  const [selectedIdB, setSelectedIdB] = useState<string>(
    history[0]?.id || ''
  );

  const scanA = history.find((s) => s.id === selectedIdA);
  const scanB = history.find((s) => s.id === selectedIdB);

  // Compute point-by-point deltas
  const pointDeltas = React.useMemo(() => {
    if (!scanA || !scanB) {
      return {
        deltas: [] as Array<{
          id: string;
          row: number;
          col: number;
          lat: number;
          lng: number;
          rankA: number;
          rankB: number;
          diff: number;
          rankDisplayA: string;
          rankDisplayB: string;
        }>,
        improved: 0,
        dropped: 0,
        unchanged: 0,
      };
    }

    let improved = 0;
    let dropped = 0;
    let unchanged = 0;

    // Map scanA points by ID or row_col
    const mapA = new Map<string, number>();
    scanA.points.forEach((p) => {
      // 21 if not found in top 20
      const r = p.rank !== null ? p.rank : 21;
      mapA.set(`${p.row}_${p.col}`, r);
    });

    const deltas = scanB.points.map((pB) => {
      const key = `${pB.row}_${pB.col}`;
      const rankB = pB.rank !== null ? pB.rank : 21;
      const rankA = mapA.get(key) ?? 21;

      // Delta: lower rank number is BETTER (e.g. from 10 to 3 -> improved by 7)
      const diff = rankA - rankB; // positive means improved, negative means dropped

      if (diff > 0) improved++;
      else if (diff < 0) dropped++;
      else unchanged++;

      return {
        id: pB.id,
        row: pB.row,
        col: pB.col,
        lat: pB.lat,
        lng: pB.lng,
        rankA,
        rankB,
        diff,
        rankDisplayA: rankA > 20 ? '20+' : `${rankA}`,
        rankDisplayB: rankB > 20 ? '20+' : `${rankB}`,
      };
    });

    return {
      deltas,
      improved,
      dropped,
      unchanged,
    };
  }, [scanA, scanB]);

  const avgRankDiff =
    scanA?.summary.avgRank && scanB?.summary.avgRank
      ? Number((scanA.summary.avgRank - scanB.summary.avgRank).toFixed(1))
      : null;

  const top3Diff =
    scanA && scanB
      ? scanB.summary.top3Percentage - scanA.summary.top3Percentage
      : null;

  // Export comparison to CSV
  const handleExportComparisonCsv = () => {
    if (!scanA || !scanB) return;

    const rows = [
      ['SO SÁNH BIẾN ĐỘNG THỨ HẠNG LOCAL RANK GRID'],
      ['Lần quét A (Cũ)', scanA.dateFormatted, `Từ khóa: ${scanA.config.keyword}`, `Hạng TB: #${scanA.summary.avgRank || 'N/A'}`],
      ['Lần quét B (Mới)', scanB.dateFormatted, `Từ khóa: ${scanB.config.keyword}`, `Hạng TB: #${scanB.summary.avgRank || 'N/A'}`],
      ['Chênh lệch Hạng TB', avgRankDiff !== null ? `${avgRankDiff > 0 ? '+' : ''}${avgRankDiff} bậc` : 'N/A'],
      ['Chênh lệch Top 3 (%)', top3Diff !== null ? `${top3Diff > 0 ? '+' : ''}${top3Diff}%` : 'N/A'],
      [],
      ['Mã điểm', 'Hàng', 'Cột', 'Vĩ độ', 'Kinh độ', 'Hạng lần A', 'Hạng lần B', 'Biến động (Delta)', 'Trạng thái'],
    ];

    pointDeltas.deltas.forEach((d) => {
      let statusText = 'Giữ nguyên';
      if (d.diff > 0) statusText = `Thăng hạng (+${d.diff})`;
      if (d.diff < 0) statusText = `Tụt hạng (${d.diff})`;

      rows.push([
        d.id,
        d.row.toString(),
        d.col.toString(),
        d.lat.toString(),
        d.lng.toString(),
        d.rankDisplayA,
        d.rankDisplayB,
        d.diff > 0 ? `+${d.diff}` : `${d.diff}`,
        statusText,
      ]);
    });

    const csvContent =
      '\uFEFF' +
      rows
        .map((r) => r.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `So_sanh_LocalRank_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">So sánh 2 lần quét (A vs B)</h3>
              <p className="text-xs text-slate-400">
                Phân tích biến động thăng hạng hoặc tụt hạng tại từng vị trí tọa độ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportComparisonCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV so sánh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan Selector Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scan A */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Lần quét A (Mốc ban đầu / Quá khứ)
            </label>
            <select
              value={selectedIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {history.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.dateFormatted} - {s.config.businessName} (&quot;{s.config.keyword}&quot;) [Hạng TB #{s.summary.avgRank || '20+'}]
                </option>
              ))}
            </select>
          </div>

          {/* Scan B */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Lần quét B (Mốc hiện tại / Mới nhất)
            </label>
            <select
              value={selectedIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {history.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.dateFormatted} - {s.config.businessName} (&quot;{s.config.keyword}&quot;) [Hạng TB #{s.summary.avgRank || '20+'}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Delta KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Improved */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1">
                <span>Điểm thăng hạng</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {pointDeltas.improved} điểm
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Vị trí được cải thiện</div>
            </div>

            {/* Dropped */}
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/60">
              <div className="flex items-center justify-between text-rose-400 text-xs font-medium mb-1">
                <span>Điểm tụt hạng</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-rose-400">
                {pointDeltas.dropped} điểm
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Cần tối ưu lại</div>
            </div>

            {/* Unchanged */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Điểm không đổi</span>
                <Minus className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-slate-200">
                {pointDeltas.unchanged} điểm
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Giữ nguyên thứ hạng</div>
            </div>

            {/* Avg Rank Shift */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/60">
              <div className="flex items-center justify-between text-indigo-400 text-xs font-medium mb-1">
                <span>Thay đổi Hạng TB</span>
                <Award className="w-4 h-4" />
              </div>
              <div
                className={`text-2xl font-bold ${
                  avgRankDiff && avgRankDiff > 0
                    ? 'text-emerald-400'
                    : avgRankDiff && avgRankDiff < 0
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {avgRankDiff !== null ? `${avgRankDiff > 0 ? '+' : ''}${avgRankDiff}` : '0'} bậc
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {top3Diff !== null && `Top 3: ${top3Diff > 0 ? '+' : ''}${top3Diff}%`}
              </div>
            </div>
          </div>

          {/* Grid Delta Matrix Visualization */}
          {scanB && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Ma trận biến động thứ hạng theo lưới ({scanB.config.gridSize}x{scanB.config.gridSize})</span>
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Thăng hạng (+)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Tụt hạng (-)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-700"></span> Không đổi
                  </span>
                </div>
              </div>

              {/* Grid Tiles */}
              <div
                className="grid gap-2 max-w-md mx-auto py-2"
                style={{
                  gridTemplateColumns: `repeat(${scanB.config.gridSize}, minmax(0, 1fr))`,
                }}
              >
                {pointDeltas.deltas.map((d) => {
                  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
                  let icon = '=';
                  if (d.diff > 0) {
                    bg = 'bg-emerald-600/90 text-white border-emerald-400 shadow-sm';
                    icon = `+${d.diff}`;
                  } else if (d.diff < 0) {
                    bg = 'bg-rose-600/90 text-white border-rose-400 shadow-sm';
                    icon = `${d.diff}`;
                  }

                  return (
                    <div
                      key={d.id}
                      className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 text-center transition hover:scale-105 cursor-default ${bg}`}
                      title={`Tọa độ: ${d.lat}, ${d.lng} | Lần A: #${d.rankDisplayA} -> Lần B: #${d.rankDisplayB}`}
                    >
                      <span className="text-xs font-bold leading-none">{icon}</span>
                      <span className="text-[9px] opacity-80 mt-1 font-mono">
                        {d.rankDisplayA}→{d.rankDisplayB}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table list of points */}
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Điểm</th>
                    <th className="py-2.5 px-3">Tọa độ</th>
                    <th className="py-2.5 px-3 text-center">Hạng Lần A</th>
                    <th className="py-2.5 px-3 text-center">Hạng Lần B</th>
                    <th className="py-2.5 px-3 text-center">Biến động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {pointDeltas.deltas.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-slate-400">{d.id}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-400 font-mono">
                        {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-slate-300">
                        #{d.rankDisplayA}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-white">
                        #{d.rankDisplayB}
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        {d.diff > 0 ? (
                          <span className="text-emerald-400 inline-flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +{d.diff}
                          </span>
                        ) : d.diff < 0 ? (
                          <span className="text-rose-400 inline-flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" /> {d.diff}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
