import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const [passKS2025, waitKS, studyKS] = await Promise.all([
      // 1. PASS – departureDate năm 2023 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            // job: 'ビルクリーニング',
            type: 'engineer',
            departureDate: { $exists: true, $ne: null },
          },
        },
        {
          $project: {
            year: {
              $year: {
                date: '$departureDate',
                timezone: 'Asia/Ho_Chi_Minh',
              },
            },
          },
        },
        { $match: { year: 2025 } },
        { $count: 'count' },
      ]),

      // 2. PASS – departureDate năm 2024 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            // job: 'ビルクリーニング',
            type: 'engineer',
            status: 'wait',
          },
        },
        { $count: 'count' },
      ]),

      // 3. PASS – departureDate năm 2025 – type skill
      Intern.aggregate([
        {
          $match: {
            // job: 'ビルクリーニング',
            type: 'study',
          },
        },
        { $count: 'count' },
      ]),
    ]);

    return res.status(200).json({
      passKS2025: passKS2025.length > 0 ? passKS2025[0].count : 0,
      waitKS: waitKS.length > 0 ? waitKS[0].count : 0,
      studyKS: studyKS.length > 0 ? studyKS[0].count : 0,
    });
  } catch (error) {
    console.error('[API Error]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
