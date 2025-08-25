// pages/api/stats/intern-source.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PipelineStage, Types } from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Source from '../../../models/source';
import Study from '../../../models/study';

const TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
const NULL_SOURCE_NAME = 'Nhật Tân'; // tên mặc định khi intern.source = null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // --- tính tháng trước theo giờ VN ---
    const now = new Date();
    const nowVN = new Date(now.getTime() + TZ_OFFSET_MS);
    const curMonthVN = nowVN.getUTCMonth() + 1; // 1..12
    const curYearVN = nowVN.getUTCFullYear();

    const prevMonth = curMonthVN === 1 ? 12 : curMonthVN - 1;
    const prevYear = curMonthVN === 1 ? curYearVN - 1 : curYearVN;

    // --- pipeline: chịu được month/year là number hoặc string; nếu thiếu thì rơi về monthAndYear ---
    const pipeline: PipelineStage[] = [
      // Chuẩn hóa month/year -> number (nếu tồn tại)
      {
        $addFields: {
          _monthNum: {
            $switch: {
              branches: [
                { case: { $in: [{ $type: '$month' }, ['int', 'long', 'double', 'decimal']] }, then: '$month' },
                { case: { $eq: [{ $type: '$month' }, 'string'] }, then: { $toInt: '$month' } },
              ],
              default: null,
            },
          },
          _yearNum: {
            $switch: {
              branches: [
                { case: { $in: [{ $type: '$year' }, ['int', 'long', 'double', 'decimal']] }, then: '$year' },
                { case: { $eq: [{ $type: '$year' }, 'string'] }, then: { $toInt: '$year' } },
              ],
              default: null,
            },
          },
        },
      },
      // Chuẩn hóa monthAndYear -> Date (nếu cần) và suy ra tháng/năm theo giờ VN
      {
        $addFields: {
          _dateField: {
            $cond: [
              { $and: [{ $eq: ['$_monthNum', null] }, { $eq: ['$_yearNum', null] }] }, // chỉ khi thiếu month/year
              {
                $cond: [
                  { $eq: [{ $type: '$monthAndYear' }, 'string'] },
                  { $toDate: '$monthAndYear' },
                  {
                    $cond: [
                      { $eq: [{ $type: '$monthAndYear' }, 'date'] },
                      '$monthAndYear',
                      null,
                    ],
                  },
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $addFields: {
          _monthFromDate: {
            $cond: [
              { $ne: ['$_dateField', null] },
              { $month: { $add: ['$_dateField', TZ_OFFSET_MS] } },
              null,
            ],
          },
          _yearFromDate: {
            $cond: [
              { $ne: ['$_dateField', null] },
              { $year: { $add: ['$_dateField', TZ_OFFSET_MS] } },
              null,
            ],
          },
        },
      },
      // Lấy tháng/năm hiệu lực: ưu tiên month/year, nếu thiếu thì lấy từ monthAndYear
      {
        $addFields: {
          _effMonth: { $ifNull: ['$_monthNum', '$_monthFromDate'] },
          _effYear: { $ifNull: ['$_yearNum', '$_yearFromDate'] },
        },
      },
      // Lọc tháng trước
      { $match: { _effMonth: prevMonth, _effYear: prevYear } },

      // Join Intern để lấy source
      {
        $lookup: {
          from: 'interns',
          localField: 'internId',
          foreignField: '_id',
          as: 'intern',
        },
      },
      { $unwind: { path: '$intern', preserveNullAndEmptyArrays: false } },

      // Gom theo source và tính điểm TB + số intern duy nhất
      {
        $group: {
          _id: '$intern.source', // có thể null
          avgScore: { $avg: '$total' },
          internSet: { $addToSet: '$intern._id' },
          studyCount: { $sum: 1 },
        },
      },
      {
        $project: {
          avgScore: { $round: ['$avgScore', 2] },
          internCount: { $size: '$internSet' },
          studyCount: 1,
        },
      },
      { $sort: { avgScore: -1 } },
    ];

    const stats = await Study.aggregate(pipeline as any[]);

    // Lấy tên source; bỏ null khi query Source
    const sourceIds = (stats.map((s: any) => s._id).filter((x: any) => !!x) || []) as Types.ObjectId[];
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = stats.map((s: any) => {
      const src = sources.find((sc: any) => sc._id.toString() === (s._id?.toString() || ''));
      return {
        sourceId: s._id ?? null,
        sourceName: src?.name ?? (s._id ? 'Không rõ nguồn' : NULL_SOURCE_NAME),
        averageScore: s.avgScore,
        internCount: s.internCount,
        studyCount: s.studyCount,
      };
    });

    return res.status(200).json({ prevMonth, prevYear, stats: result });
  } catch (error) {
    console.error('[Average Study Score by Source API]:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
