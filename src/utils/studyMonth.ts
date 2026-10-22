import Intern from 'src/models/intern';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';
import Source from 'src/models/source';
import StudyClass from 'src/models/studyClass';

// ----------------------------------------------------------------------
// Dùng chung cho các endpoint báo cáo học tập theo tháng (study/tracker, study/bulk,
// study/updateBulk).
//
// monthAndYear của báo cáo được lưu là 00:00 giờ VN (= 17:00 UTC hôm trước), nên ranh giới
// tháng cũng tính theo giờ VN — không theo múi giờ của máy chủ.
// ----------------------------------------------------------------------

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// 00:00 ngày 1 của tháng theo giờ VN. monthIndex được phép âm hoặc > 11 (Date.UTC tự quy đổi).
export const monthStartVN = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex, 1) - VN_OFFSET_MS);

export type StudyMonth = {
  key: string; // YYYY-MM
  start: Date; // đầu tháng
  end: Date; // đầu tháng sau
  prevStart: Date; // đầu tháng trước
};

// "YYYY-MM" → ranh giới tháng; sai định dạng trả null.
export function parseStudyMonth(value: unknown): StudyMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  return {
    key: match[0],
    start: monthStartVN(year, monthIndex),
    end: monthStartVN(year, monthIndex + 1),
    prevStart: monthStartVN(year, monthIndex - 1),
  };
}

// TTS kèm đúng các trường internBasics cần (tên nghiệp đoàn / công ty / nguồn / lớp), sắp theo
// tên. Dùng cho báo cáo theo tháng và trang Lớp.
export function findInternBasics(filter: Record<string, unknown>) {
  return Intern.find(filter)
    .select('name namejp avatar status studyDate tradeUnion companySelect source studyClass')
    .populate({ path: 'tradeUnion', model: TradeUnion, select: 'name' })
    .populate({ path: 'companySelect', model: Company, select: 'name' })
    .populate({ path: 'source', model: Source, select: 'name' })
    .populate({ path: 'studyClass', model: StudyClass, select: 'name teacher' })
    .sort({ name: 1 })
    .lean();
}

// TTS của một tháng: đang học (status 'study') đã nhập học trước cuối tháng, cộng mọi TTS đã có
// báo cáo trong tháng (kể cả người đã đổi trạng thái sau này).
export function findMonthInterns(end: Date, reportedInternIds: string[]) {
  return findInternBasics({
    $or: [
      // $nor: nhận cả TTS chưa có ngày nhập học, chỉ loại người nhập học sau tháng này.
      { status: 'study', $nor: [{ studyDate: { $gte: end } }] },
      { _id: { $in: reportedInternIds } },
    ],
  });
}

// Phần thông tin TTS chung cho mọi dòng trả về.
export const internBasics = (intern: any) => ({
  _id: String(intern._id),
  name: intern.name || '',
  namejp: intern.namejp || '',
  avatar: intern.avatar || '',
  status: intern.status || '',
  studyDate: intern.studyDate || null,
  tradeUnion: intern.tradeUnion?.name || '',
  company: intern.companySelect?.name || '',
  // Rỗng = chưa có nguồn; FE hiển thị/lọc là "Nhật Tân" (DEFAULT_SOURCE_NAME).
  source: intern.source?.name || '',
  // Lớp ở trung tâm: rỗng = chưa xếp lớp. classTeacher điền sẵn giáo viên cho báo cáo mới.
  studyClass: intern.studyClass?.name || '',
  studyClassId: intern.studyClass?._id ? String(intern.studyClass._id) : '',
  classTeacher: intern.studyClass?.teacher || '',
});

// Gom báo cáo theo TTS. Danh sách đã sắp theo updatedAt tăng dần thì bản sửa sau cùng thắng
// (phòng khi một TTS có hai báo cáo cùng tháng).
export const byIntern = (reports: any[]) =>
  new Map<string, any>(reports.map((report) => [String(report.internId), report]));
