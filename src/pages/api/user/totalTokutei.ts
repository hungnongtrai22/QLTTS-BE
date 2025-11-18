import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const [pass2023, pass2024, pass2025, waitSkill] = await Promise.all([
      // 1. PASS – departureDate năm 2023 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'skill',
            departureDate: { $exists: true, $ne: null }
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
        { $match: { year: 2023 } },
        { $count: 'count' },
      ]),

      // 2. PASS – departureDate năm 2024 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'skill',
            departureDate: { $exists: true, $ne: null }
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
        { $match: { year: 2024 } },
        { $count: 'count' },
      ]),

      // 3. PASS – departureDate năm 2025 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'skill',
            departureDate: { $exists: true, $ne: null }
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

      // 4. WAIT – type skill
      Intern.countDocuments({
        status: 'wait',
        type: 'skill',
      }),
    ]);

    return res.status(200).json({
      pass2023: pass2023.length > 0 ? pass2023[0].count : 0,
      pass2024: pass2024.length > 0 ? pass2024[0].count : 0,
      pass2025: pass2025.length > 0 ? pass2025[0].count : 0,
      waitSkill,
    });

  } catch (error) {
    console.error('[API Error]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
