import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Study from 'src/models/study';
import Intern from 'src/models/intern';
import Company from 'src/models/company';
import TradeUnion from 'src/models/tradeUnion';
import { withAge } from 'src/utils/age';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Đọc nhiều báo cáo học tập đầy đủ một lần — để xuất gói báo cáo gửi đối tác (PDF / Excel) ở
// trang "Báo cáo học tập" (chỉ admin).
//
//   POST { ids: string[] }   (id báo cáo, tối đa 500)
//
// Mỗi báo cáo kèm `intern`: đúng những trường mẫu PDF báo cáo học tập cần (tên, ảnh, giới tính,
// ngày sinh, ngành nghề, các mốc ngày, nghiệp đoàn, công ty), đã tính lại tuổi (withAge).
// Chỉ đọc. Dùng POST vì danh sách id có thể dài; tên bắt đầu bằng "list" nên READ_ONLY không chặn.
// ----------------------------------------------------------------------

const MAX_IDS = 500;

const INTERN_FIELDS =
  'name namejp avatar gender birthday job interviewDate studyDate startDate tradeUnion companySelect';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_IDS) {
      return res.status(400).json({ message: `ids phải có từ 1 đến ${MAX_IDS} báo cáo` });
    }
    const unique = Array.from(new Set(ids.map(String)));
    if (unique.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: 'Có id báo cáo không hợp lệ' });
    }

    await db.connectDB();

    // Tra theo _id (index mặc định) — chỉ đọc đúng số báo cáo được yêu cầu.
    const reports: any[] = await Study.find({ _id: { $in: unique } })
      .populate({
        path: 'internId',
        model: Intern,
        select: INTERN_FIELDS,
        populate: [
          { path: 'tradeUnion', model: TradeUnion, select: 'name' },
          { path: 'companySelect', model: Company, select: 'name' },
        ],
      })
      .lean();

    return res.status(200).json({
      reports: reports.map(({ internId, ...report }) => ({
        ...report,
        // Giữ internId là chuỗi như mọi endpoint khác; hồ sơ TTS nằm ở `intern`.
        internId: internId?._id ? String(internId._id) : String(internId || ''),
        intern: internId?._id ? withAge(internId) : null,
      })),
    });
  } catch (error) {
    console.error('[Study List By Ids API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: cùng quyền với trang Báo cáo học tập.
export default withAuth(handler, { roles: ['admin'] });
