import { NextApiRequest, NextApiResponse } from 'next';
import { PipelineStage, Types } from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';
import Source from '../../../models/source';
import Study from '../../../models/study';

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
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          monthAndYear: {
            $gte: firstDayPrevMonth,
            $lte: lastDayPrevMonth,
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
      { $sort: { total: -1 } },   // sắp xếp theo total giảm dần
      { $limit: 3 },              // lấy top 3
      {
        $project: {
          _id: 0,
          internId: '$intern._id',
          internName: '$intern.name',
          sourceId: '$intern.source',
          totalScore: '$total',
        },
      },
    ];

    const topInterns = await Study.aggregate(pipeline);

    // Populate sourceName
    const sourceIds = topInterns.map((t) => t.sourceId).filter(Boolean);
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = topInterns.map((t) => {
      const src = (sources as SourceType[]).find(
        (s) => s._id.toString() === (t.sourceId?.toString() || '')
      );
      return {
        internId: t.internId,
        internName: t.internName,
        sourceName: src?.name || 'Nhật Tân',
        totalScore: t.totalScore,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Top 3 Interns by Total Score (Prev Month) API]:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
