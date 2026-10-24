import React from 'react';
import { ExternalLink, MapPin, Star, X, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { GridPoint } from '../types';

interface PointDetailModalProps {
  point: GridPoint | null;
  businessName: string;
  onClose: () => void;
}

export const PointDetailModal: React.FC<PointDetailModalProps> = ({
  point,
  businessName,
  onClose,
}) => {
  if (!point) return null;

  const top5Places = point.places.slice(0, 5);

  const getRankBadge = (rank: number | null | undefined) => {
    if (rank === null || rank === undefined || rank > 20) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
          Hạng 20+
        </span>
      );
    }
    if (rank <= 3) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/50">
          Hạng #{rank} (Top 3)
        </span>
      );
    }
    if (rank <= 10) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500 text-slate-950">
          Hạng #{rank}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500 text-white">
        Hạng #{rank}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Tọa độ: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </span>
              <span className="text-xs text-slate-400">
                Khoảng cách tâm: {point.distanceKm} km
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              Chi tiết xếp hạng tại điểm {point.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Target Business Performance Card */}
          <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Doanh nghiệp mục tiêu: <span className="text-white font-bold">{businessName}</span>
              </div>
              <div>{getRankBadge(point.rank)}</div>
            </div>

            {point.matchedPlace ? (
              <div className="pt-2 text-sm space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Tìm thấy: {point.matchedPlace.title}
                </div>
                {point.matchedPlace.address && (
                  <div className="text-xs text-slate-300 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{point.matchedPlace.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  {point.matchedPlace.rating !== undefined && (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {point.matchedPlace.rating} ({point.matchedPlace.ratingCount || 0} đánh giá)
                    </span>
                  )}
                  {point.matchedPlace.cid && (
                    <span className="font-mono text-[11px] text-slate-500">
                      CID: {point.matchedPlace.cid}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-1 text-xs text-rose-300 flex items-center gap-1.5 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Không tìm thấy doanh nghiệp trong top 20 kết quả Google Maps tại điểm này.</span>
              </div>
            )}
          </div>

          {/* Top 5 Competitors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Top 5 Đối thủ tại tọa độ này
              </h4>
              <span className="text-xs text-slate-400">
                Tổng tìm thấy: {point.places.length} kết quả
              </span>
            </div>

            {top5Places.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400 bg-slate-800/30 rounded-xl">
                Chưa có dữ liệu hoặc không có địa điểm nào được trả về.
              </div>
            ) : (
              <div className="space-y-2.5">
                {top5Places.map((place, idx) => {
                  const placeRank = place.position || idx + 1;
                  const isTarget = point.matchedPlace && point.matchedPlace.title === place.title;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-sm transition ${
                        isTarget
                          ? 'border-indigo-500/60 bg-indigo-950/40 ring-1 ring-indigo-500/30'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                              placeRank <= 3
                                ? 'bg-emerald-500 text-white'
                                : placeRank <= 10
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-700 text-slate-200'
                            }`}
                          >
                            #{placeRank}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              <span>{place.title}</span>
                              {isTarget && (
                                <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            {place.address && (
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="line-clamp-1">{place.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {place.rating !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{place.rating}</span>
                            <span className="text-slate-500 font-normal">
                              ({place.ratingCount || 0})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Extra info if available */}
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{place.category || 'Địa điểm Google Maps'}</span>
                        {place.cid && (
                          <a
                            href={`https://www.google.com/maps?cid=${place.cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                          >
                            <span>Mở trên Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
