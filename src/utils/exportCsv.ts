import { GridPoint, ScanRecord } from '../types';

/**
 * Escapes a cell value for standard CSV
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports current scan grid points to CSV with UTF-8 BOM
 */
export function exportScanToCsv(record: ScanRecord) {
  const headers = [
    'Mã điểm',
    'Tọa độ Vĩ độ (Lat)',
    'Tọa độ Kinh độ (Lng)',
    'Khoảng cách từ tâm (km)',
    'Thứ hạng',
    'Trạng thái',
    'Tên doanh nghiệp nhận diện',
    'Địa chỉ nhận diện',
    'CID nhận diện',
    'Top 1 Đối thủ',
    'Top 2 Đối thủ',
    'Top 3 Đối thủ',
    'Top 4 Đối thủ',
    'Top 5 Đối thủ',
  ];

  const rows: string[][] = [];

  // Summary header block
  rows.push(['BÁO CÁO QUÉT THỨ HẠNG LOCAL RANK GRID']);
  rows.push(['Thời gian quét', record.dateFormatted]);
  rows.push(['Từ khóa', record.config.keyword]);
  rows.push(['Doanh nghiệp mục tiêu', record.config.businessName]);
  if (record.config.cidOrPlaceId) {
    rows.push(['CID / Place ID', record.config.cidOrPlaceId]);
  }
  rows.push(['Tọa độ tâm', `${record.config.centerLat}, ${record.config.centerLng}`]);
  rows.push(['Kích thước lưới', `${record.config.gridSize}x${record.config.gridSize} (${record.points.length} điểm)`]);
  rows.push(['Khoảng cách điểm', `${record.config.stepKm} km`]);
  rows.push(['Thứ hạng trung bình', record.summary.avgRank ? `${record.summary.avgRank}` : 'N/A']);
  rows.push(['Tỷ lệ Top 3 (%)', `${record.summary.top3Percentage}%`]);
  rows.push(['Tỷ lệ Top 10 (%)', `${record.summary.top10Percentage}%`]);
  rows.push(['Không tìm thấy / 20+ (%)', `${record.summary.notFoundPercentage}%`]);
  rows.push([]); // blank line separator

  // Main table header
  rows.push(headers);

  // Each point row
  for (const pt of record.points) {
    const top5 = pt.places.slice(0, 5).map((p, idx) => `#${p.position || idx + 1}: ${p.title} (${p.rating || 0}★)`);

    rows.push([
      pt.id,
      pt.lat.toString(),
      pt.lng.toString(),
      pt.distanceKm.toString(),
      pt.rankDisplay,
      pt.status,
      pt.matchedPlace?.title || '',
      pt.matchedPlace?.address || '',
      pt.matchedPlace?.cid || '',
      top5[0] || '',
      top5[1] || '',
      top5[2] || '',
      top5[3] || '',
      top5[4] || '',
    ]);
  }

  // Competitor summary section
  if (record.summary.topCompetitors.length > 0) {
    rows.push([]);
    rows.push(['TOP ĐỐI THỦ CẠNH TRANH XUẤT HIỆN NHIỀU NHẤT']);
    rows.push(['Tên đối thủ', 'Số lần xuất hiện', 'Số lần đạt Top 3', 'Số lần đạt Top 10', 'Thứ hạng tốt nhất', 'Thứ hạng trung bình', 'Đánh giá']);
    for (const comp of record.summary.topCompetitors) {
      rows.push([
        comp.title,
        comp.appearances.toString(),
        comp.top3Count.toString(),
        comp.top10Count.toString(),
        comp.bestRank.toString(),
        comp.avgRank.toString(),
        comp.rating ? `${comp.rating}★` : '',
      ]);
    }
  }

  // Format into CSV lines with UTF-8 BOM
  const csvContent =
    '\uFEFF' +
    rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeKeyword = record.config.keyword.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_').slice(0, 25);
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `LocalRank_${safeKeyword}_${new Date(record.timestamp).toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
