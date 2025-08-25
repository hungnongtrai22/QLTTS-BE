import { NextApiRequest, NextApiResponse } from 'next';
import { PipelineStage, Types } from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Source from '../../../models/source';
import Study from '../../../models/study';

interface SourceType {
  _id: Types.ObjectId;
  name?: string;
}

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // +7 hours in ms

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const now = new Date();
    const nowInVN = new Date(now.getTime() + TZ_OFFSET_MS);

    // prev month/year in VN time
    // let prevMonthNumber = nowInVN.getMonth() === 0 ? 12 : nowInVN.getMonth(); // 1..12
    const prevMonthNumber = nowInVN.getMonth() === 0 ? 12 : nowInVN.getMonth(); // 1..12
    let prevYear = nowInVN.getFullYear();
    if (nowInVN.getMonth() === 0) prevYear -= 1;

    // debug logs (xem trên CloudWatch / logs)
    console.log('now (server local):', now.toISOString());
    console.log('nowInVN (+7h):', nowInVN.toISOString());
    console.log('prevMonthNumber (1..12):', prevMonthNumber, 'prevYear:', prevYear);

    // Pipeline:
    // 1) ensure dateField is Date (convert string to Date if needed with $toDate)
    // 2) create month/year after adding TZ_OFFSET_MS (so month/year reflect VN timezone)
    // 3) match by month/year (VN)
    // 4) rest of pipeline (lookup, unwind, sort, limit, project)
    const pipeline: PipelineStage[] = [
      // convert string -> Date if necessary and guard nulls
      {
        $addFields: {
          dateField: {
            $cond: [
              { $or: [{ $eq: [{ $type: '$monthAndYear' }, 'missing'] }, { $eq: [{ $type: '$monthAndYear' }, 'null'] }] },
              null,
              {
                $cond: [
                  { $eq: [{ $type: '$monthAndYear' }, 'string'] },
                  { $toDate: '$monthAndYear' },
                  '$monthAndYear'
                ]
              }
            ]
          }
        }
      },

      // optional: filter out docs without dateField early to speed up
      {
        $match: {
          dateField: { $ne: null }
        }
      },

      // compute month/year in VN by adding TZ offset
      {
        $addFields: {
          monthInVN: { $month: { $add: ['$dateField', TZ_OFFSET_MS] } }, // 1..12
          yearInVN: { $year: { $add: ['$dateField', TZ_OFFSET_MS] } },
        }
      },

      // DEBUG STAGE: uncomment if you want to sample values (or temporarily keep)
      // { $limit: 20 },
      // { $project: { _id: 0, dateField: 1, monthInVN: 1, yearInVN: 1, total: 1 } },

      // match prev month/year (VN)
      {
        $match: {
          monthInVN: prevMonthNumber,
          yearInVN: prevYear,
        }
      },

      // original pipeline logic
      {
        $lookup: {
          from: 'interns',
          localField: 'internId',
          foreignField: '_id',
          as: 'intern'
        }
      },
      { $unwind: '$intern' },
      { $sort: { total: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          internId: '$intern._id',
          internName: '$intern.name',
          internAvatar: '$intern.avatar',
          sourceId: '$intern.source',
          totalScore: '$total'
        }
      }
    ];

    // For debugging: run a small aggregation to inspect docMonth values if needed
    // const debugSample = await Study.aggregate(pipeline.slice(0, 4) as any);
    // console.log('DEBUG sample (first stages):', JSON.stringify(debugSample, null, 2));

    const topInterns = await Study.aggregate(pipeline as any[]);

    // Populate sourceName
    const sourceIds = topInterns.map((t: any) => t.sourceId).filter(Boolean);
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = topInterns.map((t: any) => {
      const src = (sources as SourceType[]).find((s) => s._id.toString() === (t.sourceId?.toString() || ''));
      return {
        internId: t.internId,
        internName: t.internName,
        internAvatar: t.internAvatar,
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
