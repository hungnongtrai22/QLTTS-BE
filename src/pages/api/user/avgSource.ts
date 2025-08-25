import { NextApiRequest, NextApiResponse } from 'next';
import { Types } from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
// import Intern from '../../../models/intern';
import Source from '../../../models/source';
import Study from '../../../models/study';

// Kiểu dữ liệu Source
interface SourceType {
  _id: Types.ObjectId;
  name?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // Xác định khoảng thời gian tháng trước
    const now = new Date();
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Pipeline aggregate
    const pipeline = [
      {
        $match: {
          monthAndYear: {
            $gte: firstDayPrevMonth,
            $lt: firstDayThisMonth, // loại bỏ tuyệt đối dữ liệu tháng này
          },
        },
      },
      {
        $lookup: {
          from: 'interns',
          localField: 'internId',
          foreignField: '_id',
          as: 'intern',
        },
      },
      { $unwind: '$intern' },
      {
        $group: {
          _id: '$intern.source',
          avgScore: { $avg: '$total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } }, // sắp xếp giảm dần theo điểm trung bình
    ];

    const stats = await Study.aggregate(pipeline as any[]);

    // Lấy thông tin source
    const sourceIds = stats.map((s) => s._id).filter(Boolean);
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = stats.map((s) => {
      const src = (sources as SourceType[]).find(
        (sc) => sc._id.toString() === (s._id?.toString() || '')
      );
      return {
        sourceId: s._id,
        sourceName: src?.name || 'Nhật Tân',
        averageScore: s.avgScore,
        totalInterns: s.count,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Average Study Score by Source API]:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
