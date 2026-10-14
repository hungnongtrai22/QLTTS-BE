import { NextApiRequest, NextApiResponse } from 'next';
import Study from 'src/models/study';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { byIntern, findMonthInterns, internBasics, parseStudyMonth } from 'src/utils/studyMonth';

// ----------------------------------------------------------------------
// Dữ liệu cho trang "Nhập điểm hàng loạt" (chỉ đọc, chỉ admin).
//
//   GET ?month=YYYY-MM
//
// Cùng danh sách TTS với study/tracker, nhưng mỗi dòng kèm đủ các ô của báo cáo:
//   - report:      báo cáo tháng này (null = chưa nhập) — để sửa tiếp
//   - prev:        báo cáo tháng trước — nút "Lấy điểm tháng trước" và điền sẵn tính cách /
//                  tiến độ / trình độ
//   - nextTime:    "Tháng học" cho báo cáo mới = tháng học của báo cáo gần nhất trước đó + 1
//                  (cùng cách tính với form nhập điểm)
//   - lastTeacher: giáo viên gần nhất
// và `teachers`: tên giáo viên đã dùng, gộp các cách viết chỉ khác dấu cách / dấu chấm.
// ----------------------------------------------------------------------

const SCORE_FIELDS =
  'health cooperation attend discipline attitude acquiringKnowledge write read listen speak';

const DETAIL_FIELDS = `internId ${SCORE_FIELDS} total level time kanji grammarAndReading listeningComprehension learningProcess characteristic teacher comment monthAndYear updatedAt`;

const pickReport = (report: any, withPublic: boolean) => {
  if (!report) return null;
  const result: Record<string, unknown> = {
    _id: String(report._id),
    total: report.total ?? null,
    level: report.level || '',
    time: report.time ?? null,
    kanji: report.kanji ?? null,
    grammarAndReading: report.grammarAndReading ?? null,
    listeningComprehension: report.listeningComprehension ?? null,
    learningProcess: report.learningProcess || '',
    characteristic: report.characteristic || '',
    teacher: String(report.teacher || '').trim(),
    comment: report.comment || '',
    updatedAt: report.updatedAt || null,
  };
  SCORE_FIELDS.split(' ').forEach((key) => {
    result[key] = report[key] ?? null;
  });
  if (withPublic) result.isPublic = !!report.isPublic;
  return result;
};

// Khóa so khớp tên giáo viên: bỏ khoảng trắng và các dấu ngăn cách (・ . ･ • …), chuẩn hóa
// chữ toàn/bán độ rộng. Chỉ gộp những cách viết chắc chắn là một người; không đoán chính tả.
const teacherKey = (name: string) => name.normalize('NFKC').replace(/[\s・.。．•·]/g, '');

async function teacherOptions() {
  const groups: { _id: string; count: number }[] = await Study.aggregate([
    { $match: { teacher: { $nin: [null, ''] } } },
    { $group: { _id: { $trim: { input: '$teacher' } }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Mỗi khóa giữ cách viết được dùng nhiều nhất.
  const best = new Map<string, string>();
  groups.forEach(({ _id: name }) => {
    if (!name) return;
    const key = teacherKey(name);
    if (key && !best.has(key)) best.set(key, name);
  });

  return Array.from(best.values()).sort((a, b) => a.localeCompare(b, 'ja'));
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const month = parseStudyMonth(req.query.month);

    if (!month) {
      return res.status(400).json({ message: 'month phải có dạng YYYY-MM' });
    }

    await db.connectDB();

    const [reports, prevReports, teachers] = await Promise.all([
      Study.find({ monthAndYear: { $gte: month.start, $lt: month.end } })
        .select(`${DETAIL_FIELDS} isPublic`)
        .sort({ updatedAt: 1 })
        .lean(),
      Study.find({ monthAndYear: { $gte: month.prevStart, $lt: month.start } })
        .select(DETAIL_FIELDS)
        .sort({ updatedAt: 1 })
        .lean(),
      teacherOptions(),
    ]);

    const reportByIntern = byIntern(reports);
    const prevByIntern = byIntern(prevReports);

    const interns: any[] = await findMonthInterns(month.end, Array.from(reportByIntern.keys()));

    // Báo cáo trước tháng này, mới nhất trước: tháng học + giáo viên gần nhất của từng TTS.
    const priorReports = await Study.find({
      internId: { $in: interns.map((intern) => intern._id) },
      monthAndYear: { $lt: month.start },
    })
      .select('internId time teacher')
      .sort({ monthAndYear: -1 })
      .lean();

    const lastTimeByIntern = new Map<string, number>();
    const lastTeacherByIntern = new Map<string, string>();
    priorReports.forEach((report: any) => {
      const id = String(report.internId);
      if (!lastTimeByIntern.has(id)) lastTimeByIntern.set(id, Number(report.time) || 0);
      const name = String(report.teacher || '').trim();
      if (name && !lastTeacherByIntern.has(id)) lastTeacherByIntern.set(id, name);
    });

    const rows = interns.map((intern) => {
      const id = String(intern._id);
      const report: any = reportByIntern.get(id);

      return {
        ...internBasics(intern),
        report: pickReport(report, true),
        prev: pickReport(prevByIntern.get(id), false),
        nextTime: report?.time ?? (lastTimeByIntern.get(id) || 0) + 1,
        lastTeacher: String(report?.teacher || '').trim() || lastTeacherByIntern.get(id) || '',
      };
    });

    return res.status(200).json({ month: month.key, rows, teachers });
  } catch (error) {
    console.error('[Study Bulk API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: cùng quyền với trang Báo cáo học tập.
export default withAuth(handler, { roles: ['admin'] });
