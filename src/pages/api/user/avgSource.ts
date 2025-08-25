// pages/api/stats/intern-source.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PipelineStage } from 'mongoose';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';
import Study from '../../../models/study';
import Source from '../../../models/source';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const now = new Date();
    // Tháng trước
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'studies',
          localField: '_id',
          foreignField: 'internId',
          as: 'studies',
        },
      },
      { $unwind: '$studies' },
      {
        $match: {
          'studies.monthAndYear': {
            $gte: firstDayLastMonth,
            $lte: lastDayLastMonth,
          },
        },
      },
      {
        $lookup: {
          from: 'sources',
          localField: 'source',
          foreignField: '_id',
          as: 'source',
        },
      },
      { $unwind: '$source' },
      {
        $group: {
          _id: '$source._id',
          sourceName: { $first: '$source.name' },
          internCount: { $addToSet: '$_id' }, // tránh trùng intern
          avgTotal: { $avg: '$studies.total' },
        },
      },
      {
        $project: {
          _id: 0,
          sourceId: '$_id',
          sourceName: 1,
          internCount: { $size: '$internCount' },
          avgTotal: { $round: ['$avgTotal', 2] },
        },
      },
      { $sort: { sourceName: 1 } },
    ];

    const result = await Intern.aggregate(pipeline);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
