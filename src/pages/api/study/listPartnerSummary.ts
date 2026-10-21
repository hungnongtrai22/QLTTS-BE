import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
import { accountOf, internScope, isAdmin } from 'src/utils/internScope';
// models
import Intern from 'src/models/intern';
import Study from 'src/models/study';
//
import { monthKeyVN, parseLesson } from '../user/lessonProgress';

// ----------------------------------------------------------------------
// Tóm tắt học tập cho danh sách TTS của nghiệp đoàn (trang "組合経由の実習生"): mỗi TTS một dòng
// gồm báo cáo mới nhất + báo cáo liền trước (tổng điểm, so sánh) và bài đang học.
//
// CHỈ dùng báo cáo đã công khai — đúng những gì đối tác được xem ở hồ sơ TTS. Tài khoản nghiệp
// đoàn luôn nhận TTS trong phạm vi của mình (internScope); admin truyền { tradeUnion }.
// Cách đọc số bài giống trang tổng quan (user/lessonProgress): báo cáo mới nhất là "ôn tập" thì
// lấy số bài của báo cáo gần nhất có số bài, review = true.
// Chỉ đọc; tên bắt đầu bằng "list" nên chế độ READ_ONLY không chặn.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);
    let filter: Record<string, unknown>;
    if (isAdmin(account)) {
      const { tradeUnion } = req.body || {};
      if (!tradeUnion || !isValidObjectId(tradeUnion)) {
        return res.status(400).json({ message: 'Missing or invalid tradeUnion' });
      }
      filter = { tradeUnion };
    } else {
      filter = internScope(account) || {};
    }

    const ids = await Intern.find(filter).distinct('_id');

    // Báo cáo đã công khai của các TTS này (index internId_1), mới nhất trước.
    const reports: any[] = await Study.find({ internId: { $in: ids }, isPublic: true })
      .select(
        'internId monthAndYear total discipline attitude health cooperation attend learningProcess updatedAt'
      )
      .sort({ monthAndYear: -1 })
      .lean();

    const byIntern = new Map<string, any[]>();
    reports.forEach((report) => {
      const id = String(report.internId);
      const list = byIntern.get(id) || [];
      list.push(report);
      byIntern.set(id, list);
    });

    // Tháng mới nhất có báo cáo công khai trong phạm vi, và lần cập nhật gần nhất của tháng đó.
    const month = reports[0]?.monthAndYear ? monthKeyVN(reports[0].monthAndYear) : null;
    const updatedAt = reports
      .filter((report) => month && monthKeyVN(report.monthAndYear) === month)
      .reduce<Date | null>(
        (max, report) => (!max || report.updatedAt > max ? report.updatedAt : max),
        null
      );

    const interns = [...byIntern.entries()].map(([id, list]) => {
      const [latest, prev] = list;
      const numbered = list.find(
        (report) => typeof parseLesson(report.learningProcess) === 'number'
      );
      return {
        _id: id,
        latest: {
          month: monthKeyVN(latest.monthAndYear),
          total: latest.total,
          discipline: latest.discipline,
          attitude: latest.attitude,
          health: latest.health,
          cooperation: latest.cooperation,
          attend: latest.attend,
          updatedAt: latest.updatedAt,
        },
        prev: prev ? { month: monthKeyVN(prev.monthAndYear), total: prev.total } : null,
        lesson: numbered ? (parseLesson(numbered.learningProcess) as number) : null,
        review: parseLesson(latest.learningProcess) === 'review',
        lessonMonth: numbered ? monthKeyVN(numbered.monthAndYear) : null,
      };
    });

    return res.status(200).json({ month, updatedAt, interns });
  } catch (error) {
    console.error('[Partner Study Summary API]: ', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

export default withAuth(handler, { roles: ['admin', 'tradeunion'] });
