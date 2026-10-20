import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
// models
import Intern from 'src/models/intern';
import Study from 'src/models/study';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';
import Source from 'src/models/source';

// ----------------------------------------------------------------------
// Tiến độ bài học (giáo trình 皆の日本語) của TTS đang học — cho trang tổng quan, nhóm theo
// nghiệp đoàn / công ty ở phía giao diện.
//
// Hồ sơ TTS không lưu "đang học bài nào"; thông tin này chỉ có ở ô "Tiến độ học tập"
// (learningProcess) của báo cáo học tập hằng tháng, nên lấy theo báo cáo mới nhất:
//   "入門"               → bài 0
//   "皆の日本語第25課"    → bài 25
//   "皆の日本語復習"      → đang ôn tập: lấy số bài của báo cáo gần nhất trước đó, review = true
// Dữ liệu vì vậy chậm khoảng một tháng — giao diện hiện kèm tháng của báo cáo.
//
// Hàm computeLessonProgress() được /api/user/dashboardStats gọi lại (cache 3 phút).
// ----------------------------------------------------------------------

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// "YYYY-MM" theo giờ VN (monthAndYear lưu 00:00 giờ VN = 17:00 UTC hôm trước).
const monthKeyVN = (value: Date) => {
  const date = new Date(new Date(value).getTime() + VN_OFFSET_MS);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

// Số bài từ ô "Tiến độ học tập"; 'review' = đang ôn tập; null = không đọc được.
export const parseLesson = (value: unknown): number | 'review' | null => {
  const text = String(value || '').trim();
  if (!text) return null;
  if (text.includes('入門')) return 0;
  if (text.includes('復習')) return 'review';
  const match = text.match(/第\s*(\d+)\s*課/);
  return match ? Number(match[1]) : null;
};

export async function computeLessonProgress() {
  await db.connectDB();

  // studyDate / startDate (ngày nhập học / ngày xuất cảnh dự kiến): giao diện ước tính tốc độ học
  // và số bài lúc bay.
  const interns: any[] = await Intern.find({ status: 'study' })
    .select('name namejp avatar tradeUnion companySelect source studyDate startDate')
    .populate({ path: 'tradeUnion', model: TradeUnion, select: 'name' })
    .populate({ path: 'companySelect', model: Company, select: 'name' })
    .populate({ path: 'source', model: Source, select: 'name' })
    .lean();

  // Mọi báo cáo của các TTS này (index internId_1), mới nhất trước.
  const reports: any[] = await Study.find({
    internId: { $in: interns.map((intern) => intern._id) },
  })
    .select('internId learningProcess monthAndYear')
    .sort({ monthAndYear: -1 })
    .lean();

  const byIntern = new Map<string, any[]>();
  reports.forEach((report) => {
    const id = String(report.internId);
    const list = byIntern.get(id) || [];
    list.push(report);
    byIntern.set(id, list);
  });

  return {
    interns: interns.map((intern) => {
      const list = byIntern.get(String(intern._id)) || [];
      const latest = list[0];

      // Báo cáo mới nhất là "ôn tập" (hoặc không đọc được) thì lùi về báo cáo trước đó có số bài.
      const numbered = list.find(
        (report) => typeof parseLesson(report.learningProcess) === 'number'
      );
      const lesson = numbered ? (parseLesson(numbered.learningProcess) as number) : null;
      const review = !!latest && parseLesson(latest.learningProcess) === 'review';

      return {
        _id: String(intern._id),
        name: intern.name || '',
        namejp: intern.namejp || '',
        avatar: intern.avatar || '',
        tradeUnion: intern.tradeUnion?.name || '',
        company: intern.companySelect?.name || '',
        // Rỗng = chưa có nguồn; giao diện hiện là "Nhật Tân" (DEFAULT_SOURCE_NAME) như mọi nơi khác.
        source: intern.source?.name || '',
        lesson,
        review,
        // Tháng của báo cáo mới nhất; null = chưa có báo cáo nào
        month: latest?.monthAndYear ? monthKeyVN(latest.monthAndYear) : null,
        // Tháng của báo cáo cho ra `lesson` (khác `month` khi báo cáo mới nhất là "ôn tập")
        lessonMonth: numbered?.monthAndYear ? monthKeyVN(numbered.monthAndYear) : null,
        studyDate: intern.studyDate || null,
        startDate: intern.startDate || null,
      };
    }),
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    const data = await computeLessonProgress();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Lesson Progress API]: ', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

export default withAuth(handler);
