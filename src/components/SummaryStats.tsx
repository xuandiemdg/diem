import React from 'react';
import { Award, CheckCircle2, TrendingUp, AlertTriangle, Users, Star, BarChart3 } from 'lucide-react';
import { ScanSummary } from '../types';

interface SummaryStatsProps {
  summary: ScanSummary;
  keyword: string;
  businessName: string;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  summary,
  keyword,
  businessName,
}) => {
  if (summary.scannedPoints === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">Chưa có kết quả quét. Nhấn nút <strong>Bắt đầu Quét</strong> để xem tổng kết số liệu.</p>
      </div>
    );
  }

  const getRankHealth = (avg: number | null) => {
    if (avg === null) return { text: 'Chưa xác định', color: 'text-slate-400' };
    if (avg <= 3.5) return { text: 'Xuất sắc (Thống trị Local Pack)', color: 'text-emerald-400' };
    if (avg <= 7.0) return { text: 'Khá tốt (Cần đẩy mạnh rìa ngoài)', color: 'text-sky-400' };
    if (avg <= 12.0) return { text: 'Trung bình (Cạnh tranh gay gắt)', color: 'text-amber-400' };
    return { text: 'Yếu (Cần tối ưu GMB mạnh)', color: 'text-rose-400' };
  };

  const health = getRankHealth(summary.avgRank);

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Thứ hạng trung bình */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Thứ hạng trung bình</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {summary.avgRank !== null ? `#${summary.avgRank}` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400">/ 20</span>
          </div>
          <div className={`text-[11px] mt-2 font-medium ${health.color}`}>
            {health.text}
          </div>
        </div>

        {/* Card 2: Tỷ lệ Top 3 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Tỷ lệ Top 3 (Local Pack)</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {summary.top3Percentage}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Hiển thị trực tiếp trên trang 1 Google
          </div>
        </div>

        {/* Card 3: Tỷ lệ Top 10 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Tỷ lệ lọt Top 10</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {summary.top10Percentage}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Độ phủ trong danh sách Maps chính
          </div>
        </div>

        {/* Card 4: Ngoài top 20 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1.5">
            <span>Không tìm thấy (20+)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {summary.notFoundPercentage}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Khu vực bị mất dấu hoàn toàn
          </div>
        </div>
      </div>

      {/* Rank Distribution Visualizer Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Phân bổ thứ hạng tổng thể ({summary.totalPoints} điểm)</span>
          <span className="text-slate-400">
            Thành công: {summary.successPoints} / {summary.totalPoints}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
          <div
            style={{ width: `${summary.top3Percentage}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`Top 3: ${summary.top3Percentage}%`}
          />
          <div
            style={{ width: `${Math.max(0, summary.top10Percentage - summary.top3Percentage)}%` }}
            className="h-full bg-amber-500 transition-all duration-500"
            title={`Top 4-10: ${summary.top10Percentage - summary.top3Percentage}%`}
          />
          <div
            style={{
              width: `${Math.max(
                0,
                100 - summary.top10Percentage - summary.notFoundPercentage
              )}%`,
            }}
            className="h-full bg-rose-500 transition-all duration-500"
            title="Top 11-20"
          />
          <div
            style={{ width: `${summary.notFoundPercentage}%` }}
            className="h-full bg-slate-600 transition-all duration-500"
            title={`20+: ${summary.notFoundPercentage}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Top 1-3 ({summary.top3Percentage}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Top 4-10 ({Math.max(0, summary.top10Percentage - summary.top3Percentage)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Top 11-20 ({Math.max(0, 100 - summary.top10Percentage - summary.notFoundPercentage)}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span> 20+ ({summary.notFoundPercentage}%)
          </span>
        </div>
      </div>

      {/* Top Competitors Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Đối thủ xuất hiện nhiều nhất theo từ khóa &quot;{keyword}&quot;
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Tổng hợp từ tất cả các điểm quét
          </span>
        </div>

        {summary.topCompetitors.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400">
            Chưa có thông tin đối thủ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Tên đối thủ</th>
                  <th className="py-2.5 px-3 text-center">Tần suất xuất hiện</th>
                  <th className="py-2.5 px-3 text-center">Lọt Top 3</th>
                  <th className="py-2.5 px-3 text-center">Lọt Top 10</th>
                  <th className="py-2.5 px-3 text-center">Hạng TB</th>
                  <th className="py-2.5 px-3 text-center">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.topCompetitors.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-100">{comp.title}</div>
                      {comp.address && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {comp.address}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-white">
                      {comp.appearances} / {summary.totalPoints}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                      {comp.top3Count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-amber-400">
                      {comp.top10Count}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      #{comp.avgRank}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {comp.rating ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-400 font-medium">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {comp.rating}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
