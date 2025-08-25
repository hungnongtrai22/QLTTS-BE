import { NextApiRequest, NextApiResponse } from 'next';
import { PipelineStage, Types } from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Source from '../../../models/source';
import Study from '../../../models/study';

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // +7h (VN)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // --- xác định tháng trước theo giờ VN ---
    const now = new Date();
    const nowInVN = new Date(now.getTime() + TZ_OFFSET_MS);
    const currentMonth = nowInVN.getMonth(); // 0-11
    const currentYear = nowInVN.getFullYear();

    // ngày đầu tháng hiện tại
    const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
    // ngày đầu tháng trước
    const firstDayPrevMonth =
      currentMonth === 0
        ? new Date(currentYear - 1, 11, 1)
        : new Date(currentYear, currentMonth - 1, 1);

    // --- main pipeline ---
    const mainPipeline: PipelineStage[] = [
      {
        $match: {
          monthAndYear: {
            $gte: firstDayPrevMonth,
            $lt: firstDayCurrentMonth,
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
          internCount: { $addToSet: '$intern._id' }, // đếm intern duy nhất
        },
      },
      {
        $project: {
          avgScore: 1,
          internCount: { $size: '$internCount' },
        },
      },
      { $sort: { avgScore: -1 } },
    ];

    const stats = await Study.aggregate(mainPipeline as any[]);

    // lấy tên source
    const sourceIds = stats.map((s: any) => s._id).filter(Boolean) as Types.ObjectId[];
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = stats.map((s: any) => {
      const src = (sources as any[]).find(
        (sc) => sc._id.toString() === (s._id?.toString() || '')
      );
      return {
        sourceId: s._id,
        sourceName: src?.name || 'Nhật Tân',
        averageScore: Math.round(s.avgScore * 100) / 100,
        internCount: s.internCount,
      };
    });

    return res.status(200).json({
      prevMonth:
        currentMonth === 0 ? 12 : currentMonth, // 1..12
      prevYear:
        currentMonth === 0 ? currentYear - 1 : currentYear,
      stats: result,
    });
  } catch (error) {
    console.error('[Average Study Score by Source API]:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
