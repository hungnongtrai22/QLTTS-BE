import { NextApiRequest, NextApiResponse } from 'next';
import { Types } from 'mongoose';

import cors from 'src/utils/cors';
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';
import Intern from '../../../models/intern';
import Source from '../../../models/source';

// Định nghĩa kiểu dữ liệu cho Source
interface SourceType {
  _id: Types.ObjectId;
  name?: string;
}

// Tách logic ra hàm riêng để /api/user/dashboardStats gọi lại được,
// thay vì chép lại pipeline. Endpoint cũ vẫn giữ nguyên đường dẫn và kết quả.
export async function computeCountSource() {
  await db.connectDB();


  // Pipeline để lọc intern đúng điều kiện
  const pipeline = [
    {
      $match: {
        $or: [
          { status: 'study' },
        ],
      },
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
      },
    },
  ];

  const counts = await Intern.aggregate(pipeline);

  // Lấy thông tin tên nguồn (populate thủ công)
  const sourceIds = counts.map((c) => c._id).filter(Boolean);
  const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

  const result = counts.map((c) => {
    const src = (sources as SourceType[]).find(
      (s) => s._id.toString() === (c._id?.toString() || '')
    );
    return {
      sourceId: c._id,
      sourceName: src?.name || 'Nhật Tân',
      count: c.count,
    };
  });

  return result;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    return res.status(200).json(await computeCountSource());
  } catch (error) {
    console.error('[Count Intern by Source API]:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

export default withAuth(handler);
