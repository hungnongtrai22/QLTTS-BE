import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Intern from 'src/models/intern';
import Source from 'src/models/source';
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';

// ----------------------------------------------------------------------
// Gán nhanh nguồn tuyển cho một TTS (nút "Nguồn" trong danh sách ứng viên ở trang Đơn hàng).
//
// - source = id của một Source có thật → $set.
// - source rỗng / null → $unset: TTS về "Nhật Tân" (quy ước "không có nguồn", cùng cách với
//   cancelOrder). Không lưu null hay chuỗi rỗng.
// Chỉ ghi đúng trường source.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { _id, source } = req.body || {};

    if (!_id || !isValidObjectId(_id)) {
      return res.status(400).json({ message: 'Missing or invalid intern ID (_id)' });
    }

    if (source && !isValidObjectId(source)) {
      return res.status(400).json({ message: 'Invalid source ID' });
    }

    await db.connectDB();

    if (source && !(await Source.exists({ _id: source }))) {
      return res.status(404).json({ message: 'Source not found' });
    }

    const intern = await Intern.findByIdAndUpdate(
      _id,
      source ? { $set: { source } } : { $unset: { source: '' } },
      { new: true }
    )
      .select('source')
      .lean();

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({ intern });
  } catch (error) {
    console.error('[Update Source API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: trang Đơn hàng chỉ admin vào được.
export default withAuth(handler, { roles: ['admin'] });
