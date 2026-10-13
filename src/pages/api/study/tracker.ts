import { NextApiRequest, NextApiResponse } from 'next';
import Study from 'src/models/study';
import Intern from 'src/models/intern';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';
import Source from 'src/models/source';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Bảng theo dõi báo cáo học tập theo tháng (trang "Báo cáo học tập", chỉ admin).
//
//   GET ?month=YYYY-MM   (tháng theo giờ Việt Nam)
//
// Liệt kê: TTS đang học (status 'study') đã nhập học trước cuối tháng đó, cộng với mọi TTS
// đã có báo cáo trong tháng (kể cả người đã đổi trạng thái sau này). Mỗi dòng kèm:
//   - report:      báo cáo của tháng (null = chưa nhập)
//   - prevTotal:   tổng điểm tháng trước, để so sánh
//   - lastTeacher: giáo viên của báo cáo tháng này, hoặc gần nhất trước đó (dòng chưa nhập)
//
// monthAndYear được lưu là 00:00 giờ VN (= 17:00 UTC hôm trước), nên ranh giới tháng cũng
// tính theo giờ VN.
// ----------------------------------------------------------------------

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// 00:00 ngày 1 của tháng theo giờ VN. monthIndex được phép âm hoặc > 11 (Date.UTC tự quy đổi).
const monthStartVN = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex, 1) - VN_OFFSET_MS);

const REPORT_FIELDS = 'internId total average level teacher isPublic monthAndYear updatedAt';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const match = /^(\d{4})-(\d{2})$/.exec(String(req.query.month || ''));
    const year = match ? Number(match[1]) : NaN;
    const monthIndex = match ? Number(match[2]) - 1 : NaN;

    if (!match || monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ message: 'month phải có dạng YYYY-MM' });
    }

    const start = monthStartVN(year, monthIndex);
    const end = monthStartVN(year, monthIndex + 1);
    const prevStart = monthStartVN(year, monthIndex - 1);

    await db.connectDB();

    const [reports, prevReports] = await Promise.all([
      Study.find({ monthAndYear: { $gte: start, $lt: end } })
        .select(REPORT_FIELDS)
        .sort({ updatedAt: 1 })
        .lean(),
      Study.find({ monthAndYear: { $gte: prevStart, $lt: start } })
        .select('internId total updatedAt')
        .sort({ updatedAt: 1 })
        .lean(),
    ]);

    // Phòng khi một TTS có hai báo cáo cùng tháng: sort tăng dần theo updatedAt nên bản
    // sửa sau cùng ghi đè bản trước.
    const reportByIntern = new Map(reports.map((report: any) => [String(report.internId), report]));
    const prevByIntern = new Map(
      prevReports.map((report: any) => [String(report.internId), report])
    );

    const interns: any[] = await Intern.find({
      $or: [
        // $nor: nhận cả TTS chưa có ngày nhập học, chỉ loại người nhập học sau tháng này.
        { status: 'study', $nor: [{ studyDate: { $gte: end } }] },
        { _id: { $in: Array.from(reportByIntern.keys()) } },
      ],
    })
      .select('name namejp avatar status studyDate tradeUnion companySelect source')
      .populate({ path: 'tradeUnion', model: TradeUnion, select: 'name' })
      .populate({ path: 'companySelect', model: Company, select: 'name' })
      .populate({ path: 'source', model: Source, select: 'name' })
      .sort({ name: 1 })
      .lean();

    // Giáo viên gần nhất (khác rỗng) tính tới hết tháng này — để dòng chưa nhập vẫn biết ai
    // phụ trách. Sắp giảm dần nên bản đầu tiên gặp của mỗi TTS là bản mới nhất.
    const teacherReports = await Study.find({
      internId: { $in: interns.map((intern) => intern._id) },
      monthAndYear: { $lt: end },
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
        _id: id,
        name: intern.name || '',
        namejp: intern.namejp || '',
        avatar: intern.avatar || '',
        status: intern.status || '',
        studyDate: intern.studyDate || null,
        tradeUnion: intern.tradeUnion?.name || '',
        company: intern.companySelect?.name || '',
        // Rỗng = chưa có nguồn; FE hiển thị/lọc là "Nhật Tân" (DEFAULT_SOURCE_NAME).
        source: intern.source?.name || '',
        report: report
          ? {
              _id: String(report._id),
              total: report.total ?? null,
              average: report.average ?? null,
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

    return res.status(200).json({ month: match[0], rows });
  } catch (error) {
    console.error('[Study Tracker API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: trang nhập điểm và danh sách nhập điểm hiện đều chỉ admin vào được.
export default withAuth(handler, { roles: ['admin'] });
