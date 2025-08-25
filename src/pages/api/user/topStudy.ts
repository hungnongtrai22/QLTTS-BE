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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // --- CÁI QUAN TRỌNG: lấy tháng/năm "tháng trước" theo giờ VN (UTC+7) ---
    const TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // 7 giờ bằng bao nhiêu ms
    const now = new Date();
    // giờ hiện tại theo VN
    const nowInVN = new Date(now.getTime() + TZ_OFFSET_MS);

    // prev month number dưới dạng 1..12
    let prevMonthNumber = nowInVN.getMonth() === 0 ? 12 : nowInVN.getMonth(); // nếu tháng VN hiện tại = 0 (Jan), prev = 12
    let prevYear = nowInVN.getFullYear();
    if (nowInVN.getMonth() === 0) prevYear -= 1;

    // Pipeline: cộng TZ_OFFSET_MS vào field monthAndYear trước khi lấy $month/$year
    const pipeline: PipelineStage[] = [
      {
        $addFields: {
          // thêm 7 giờ để biểu diễn thời điểm theo VN, rồi lấy tháng/năm của giá trị đó
          docMonth: { $month: { $add: ['$monthAndYear', TZ_OFFSET_MS] } }, // trả 1-12
          docYear: { $year: { $add: ['$monthAndYear', TZ_OFFSET_MS] } },
        },
      },
      {
        $match: {
          docMonth: prevMonthNumber,
          docYear: prevYear,
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
      { $sort: { total: -1 } },
      { $limit: 3 },
      {
        $project: {
          _id: 0,
          internId: '$intern._id',
          internName: '$intern.name',
          internAvatar: '$intern.avatar',
          sourceId: '$intern.source',
          totalScore: '$total',
        },
      },
    ];

    const topInterns = await Study.aggregate(pipeline);

    // Populate sourceName
    const sourceIds = topInterns.map((t) => t.sourceId).filter(Boolean as any);
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();

    const result = topInterns.map((t) => {
      const src = (sources as SourceType[]).find(
        (s) => s._id.toString() === (t.sourceId?.toString() || '')
      );
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
