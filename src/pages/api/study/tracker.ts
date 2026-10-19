import { NextApiRequest, NextApiResponse } from 'next';
import Study from 'src/models/study';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { byIntern, findMonthInterns, internBasics, parseStudyMonth } from 'src/utils/studyMonth';

// ----------------------------------------------------------------------
// Bảng theo dõi báo cáo học tập theo tháng (trang "Báo cáo học tập", chỉ admin).
//
//   GET ?month=YYYY-MM   (tháng theo giờ Việt Nam)
//
// Liệt kê TTS của tháng (xem findMonthInterns). Mỗi dòng kèm:
//   - report:      báo cáo của tháng (null = chưa nhập)
//   - prevTotal:   tổng điểm tháng trước, để so sánh
//   - lastTeacher: giáo viên của báo cáo tháng này, hoặc gần nhất trước đó (dòng chưa nhập)
// ----------------------------------------------------------------------

// attend: điểm chuyên cần — FE đánh dấu "Cần chú ý" khi thấp.
const REPORT_FIELDS = 'internId total average attend level teacher isPublic monthAndYear updatedAt';

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

    const [reports, prevReports] = await Promise.all([
      Study.find({ monthAndYear: { $gte: month.start, $lt: month.end } })
        .select(REPORT_FIELDS)
        .sort({ updatedAt: 1 })
        .lean(),
      Study.find({ monthAndYear: { $gte: month.prevStart, $lt: month.start } })
        .select('internId total updatedAt')
        .sort({ updatedAt: 1 })
        .lean(),
    ]);

    const reportByIntern = byIntern(reports);
    const prevByIntern = byIntern(prevReports);

    const interns: any[] = await findMonthInterns(month.end, Array.from(reportByIntern.keys()));

    // Giáo viên gần nhất (khác rỗng) tính tới hết tháng này — để dòng chưa nhập vẫn biết ai
    // phụ trách. Sắp giảm dần nên bản đầu tiên gặp của mỗi TTS là bản mới nhất.
    const teacherReports = await Study.find({
      internId: { $in: interns.map((intern) => intern._id) },
      monthAndYear: { $lt: month.end },
      teacher: { $nin: [null, ''] },
    })
      .select('internId teacher')
      .sort({ monthAndYear: -1 })
      .lean();

    const lastTeacherByIntern = new Map<string, string>();
    teacherReports.forEach((report: any) => {
      const id = String(report.internId);
      const name = String(report.teacher || '').trim();
      if (name && !lastTeacherByIntern.has(id)) lastTeacherByIntern.set(id, name);
    });

    const rows = interns.map((intern) => {
      const id = String(intern._id);
      const report: any = reportByIntern.get(id);
      const prev: any = prevByIntern.get(id);

      return {
        ...internBasics(intern),
        report: report
          ? {
              _id: String(report._id),
              total: report.total ?? null,
              average: report.average ?? null,
              attend: report.attend ?? null,
              level: report.level || '',
              teacher: String(report.teacher || '').trim(),
              isPublic: !!report.isPublic,
              updatedAt: report.updatedAt || null,
            }
          : null,
        prevTotal: prev?.total ?? null,
        lastTeacher: lastTeacherByIntern.get(id) || '',
      };
    });

    return res.status(200).json({ month: month.key, rows });
  } catch (error) {
    console.error('[Study Tracker API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: trang nhập điểm và danh sách nhập điểm hiện đều chỉ admin vào được.
export default withAuth(handler, { roles: ['admin'] });
