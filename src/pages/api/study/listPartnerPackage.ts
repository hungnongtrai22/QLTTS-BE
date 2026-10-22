import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
// utils
import db from 'src/utils/db';
import { withAge } from 'src/utils/age';
import { withAuth } from 'src/utils/auth';
import { parseStudyMonth } from 'src/utils/studyMonth';
import { accountOf, internScope, isAdmin } from 'src/utils/internScope';
// models
import Study from 'src/models/study';
import Intern from 'src/models/intern';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';

// ----------------------------------------------------------------------
// Gói báo cáo một tháng cho đối tác tự tải (PDF / Excel) ở trang TTS của nghiệp đoàn.
//
//   POST { month: 'YYYY-MM' }          (admin truyền thêm { tradeUnion })
//
// CHỈ báo cáo đã công khai, CHỈ TTS trong phạm vi tài khoản (internScope). Mỗi báo cáo kèm
// `intern` — đúng các trường mẫu PDF cần, như study/listByIds — và `prevTotal`: tổng điểm báo
// cáo ĐÃ CÔNG KHAI của tháng trước (đối tác không được thấy bản nháp, kể cả qua phép so sánh).
// Chỉ đọc; tên bắt đầu bằng "list" nên READ_ONLY không chặn.
// ----------------------------------------------------------------------

const INTERN_FIELDS =
  'name namejp avatar gender birthday job interviewDate studyDate startDate tradeUnion companySelect';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { month: monthParam, tradeUnion } = req.body || {};
    const month = parseStudyMonth(monthParam);
    if (!month) {
      return res.status(400).json({ message: 'month phải có dạng YYYY-MM' });
    }

    const account = accountOf(req);
    let filter: Record<string, unknown>;
    if (isAdmin(account)) {
      if (!tradeUnion || !isValidObjectId(tradeUnion)) {
        return res.status(400).json({ message: 'Missing or invalid tradeUnion' });
      }
      filter = { tradeUnion };
    } else {
      filter = internScope(account) || {};
    }

    await db.connectDB();

    const ids = await Intern.find(filter).distinct('_id');

    // Index monthAndYear_1 / internId_1: chỉ đọc báo cáo của hai tháng cần dùng.
    const [reports, prevReports]: [any[], any[]] = await Promise.all([
      Study.find({
        internId: { $in: ids },
        isPublic: true,
        monthAndYear: { $gte: month.start, $lt: month.end },
      })
        .populate({
          path: 'internId',
          model: Intern,
          select: INTERN_FIELDS,
          populate: [
            { path: 'tradeUnion', model: TradeUnion, select: 'name' },
            { path: 'companySelect', model: Company, select: 'name' },
          ],
        })
        .lean(),
      Study.find({
        internId: { $in: ids },
        isPublic: true,
        monthAndYear: { $gte: month.prevStart, $lt: month.start },
      })
        .select('internId total')
        .lean(),
    ]);

    const prevTotals = new Map(
      prevReports.map((report) => [String(report.internId), report.total])
    );

    return res.status(200).json({
      month: month.key,
      reports: reports.map(({ internId, ...report }) => {
        const id = internId?._id ? String(internId._id) : String(internId || '');
        return {
          ...report,
          // Giữ internId là chuỗi như mọi endpoint khác; hồ sơ TTS nằm ở `intern`.
          internId: id,
          intern: internId?._id ? withAge(internId) : null,
          prevTotal: prevTotals.has(id) ? prevTotals.get(id) : null,
        };
      }),
    });
  } catch (error) {
    console.error('[Partner Study Package API]: ', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

export default withAuth(handler, { roles: ['admin', 'tradeunion'] });
