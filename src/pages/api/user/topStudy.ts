import { NextApiRequest, NextApiResponse } from 'next';
import { PipelineStage } from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Source from '../../../models/source';
import Study from '../../../models/study';

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // +7h (VN)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // --- xác định "tháng trước" theo giờ VN ---
    const now = new Date();
    const nowInVN = new Date(now.getTime() + TZ_OFFSET_MS);
    const jsMonthVN = nowInVN.getMonth(); // 0-11
    const currentYearVN = nowInVN.getFullYear();

    let prevMonthMongo: number; // 1..12
    let prevYear: number;
    if (jsMonthVN === 0) {
      prevMonthMongo = 12;
      prevYear = currentYearVN - 1;
    } else {
      prevMonthMongo = jsMonthVN; // VD: tháng 8 => prev = 7
      prevYear = currentYearVN;
    }

    // --- stage chuẩn hóa và lọc theo tháng/năm VN ---
    const normalizeAndMatchStages: PipelineStage[] = [
      {
        $addFields: {
          dateField: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $type: '$monthAndYear' }, 'missing'] },
                  { $eq: [{ $type: '$monthAndYear' }, 'null'] },
                ],
              },
              null,
              {
                $cond: [
                  { $eq: [{ $type: '$monthAndYear' }, 'string'] },
                  { $toDate: '$monthAndYear' },
                  '$monthAndYear',
                ],
              },
            ],
          },
        },
      },
      { $match: { dateField: { $ne: null } } },
      {
        $addFields: {
          monthInVN: { $month: { $add: ['$dateField', TZ_OFFSET_MS] } },
          yearInVN: { $year: { $add: ['$dateField', TZ_OFFSET_MS] } },
        },
      },
      {
        $match: {
          monthInVN: prevMonthMongo,
          yearInVN: prevYear,
        },
      },
    ];

    // --- main pipeline: group theo source ---
    const mainPipeline: PipelineStage[] = [
      ...normalizeAndMatchStages,
      {
        $lookup: {
          from: 'interns',
          localField: 'internId',
          foreignField: '_id',
          as: 'intern',
        },
      },
      { $unwind: { path: '$intern', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$intern.source',
          avgScore: { $avg: '$total' },
          totalRecords: { $sum: 1 },
        },
      },
      { $sort: { avgScore: -1 } },
    ];

    const stats = await Study.aggregate(mainPipeline as any[]);

    // lấy tên source
    const sourceIds = stats.map((s: any) => s._id).filter(Boolean);
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = stats.map((s: any) => {
      const src = (sources as any[]).find(
        (sc) => sc._id.toString() === (s._id?.toString() || '')
      );
      return {
        sourceId: s._id,
        sourceName: src?.name || 'Không rõ nguồn',
        averageScore: s.avgScore,
        totalRecords: s.totalRecords,
      };
    });

    return res.status(200).json({
      prevMonth: prevMonthMongo,
      prevYear,
      stats: result,
    });
  } catch (error) {
    console.error('[Average Study Score by Source API]:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
