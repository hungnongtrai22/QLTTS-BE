import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Intern from 'src/models/intern';
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';

// ----------------------------------------------------------------------
// Hủy đơn của một TTS: đưa về trạng thái "Phỏng vấn" và xóa khối "Thông tin nghiệp đoàn và
// công ty" (đúng các trường form intern-company-trade-union-form ghi qua updateTradeUnion).
//
// Chỉ hủy được khi TTS đang ở trạng thái "Đang học". Điều kiện nằm ngay trong bộ lọc của
// findOneAndUpdate nên kiểm tra và ghi là một thao tác — không có khe hở giữa đọc và ghi.
//
// Cố ý không đụng đơn hàng: TTS vẫn nằm trong listIntern/listInternPass của các đơn
// (chủ dự án chọn gỡ tay ở trang Đơn hàng nếu cần).
// ----------------------------------------------------------------------

// Nghiệp đoàn, Công ty, Công việc, Ngày phỏng vấn, Ngày nhập học, Ngày dự định khởi hành, Nguồn.
const CLEARED_FIELDS = [
  'tradeUnion',
  'companySelect',
  'job',
  'interviewDate',
  'studyDate',
  'startDate',
  'source',
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { _id } = req.body || {};

    if (!_id || !isValidObjectId(_id)) {
      return res.status(400).json({ message: 'Missing or invalid intern ID (_id)' });
    }

    await db.connectDB();

    const intern = await Intern.findOneAndUpdate(
      { _id, status: 'study' },
      {
        $set: { status: 'interview' },
        $unset: Object.fromEntries(CLEARED_FIELDS.map((field) => [field, ''])),
      },
      { new: true }
    )
      .select(['status', ...CLEARED_FIELDS].join(' '))
      .lean();

    if (!intern) {
      const exists = await Intern.exists({ _id });
      return exists
        ? res.status(409).json({ message: 'Chỉ hủy đơn được khi TTS đang ở trạng thái Đang học' })
        : res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({ intern });
  } catch (error) {
    console.error('[Cancel Order API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: menu hành động của danh sách TTS là thao tác quản trị (cùng chỗ với Xóa).
export default withAuth(handler, { roles: ['admin'] });
