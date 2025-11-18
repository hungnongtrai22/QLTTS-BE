import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const [
      pass1Year2024,
      pass1Year2025,
      wait1Year,
      study1YearTV,
      study1YearCT,
      study1YearTraminco,
      study1YearNT,
    ] = await Promise.all([
      // 2. PASS – departureDate năm 2024 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'intern1year',
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
        { $match: { year: 2024 } },
        { $count: 'count' },
      ]),

      // 3. PASS – departureDate năm 2025 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'intern1year',
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

      // 4. WAIT – type skill
      Intern.countDocuments({
        status: 'wait',
        type: 'intern1year',
      }),

      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            status: 'study',
            type: 'intern1year',
            // departureDate: { $exists: true, $ne: null },
            source: new mongoose.Types.ObjectId('68786d6c5fc5821e5d48c07a'),
          },
        },
        { $count: 'count' },
      ]),

      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            status: 'study',
            type: 'intern1year',
            // departureDate: { $exists: true, $ne: null },
            source: new mongoose.Types.ObjectId('68902f7f19919951f2fa3cef'),
          },
        },
        { $count: 'count' },
      ]),

      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            status: 'study',
            type: 'intern1year',
            // departureDate: { $exists: true, $ne: null },
            source: new mongoose.Types.ObjectId('68a32f0ab843c4bca9f10342'),
          },
        },
        { $count: 'count' },
      ]),

      Intern.aggregate([
        {
          $match: {
            status: 'study',
            type: 'intern1year',
            $or: [{ source: '' }, { source: null }, { source: { $exists: false } }],
          },
        },
        { $count: 'count' },
      ]),
    ]);

    return res.status(200).json({
      pass1Year2024: pass1Year2024.length > 0 ? pass1Year2024[0].count : 0,
      pass1Year2025: pass1Year2025.length > 0 ? pass1Year2025[0].count : 0,
      wait1Year,
      study1YearTV: study1YearTV.length > 0 ? study1YearTV[0].count : 0,
      study1YearCT: study1YearCT.length > 0 ? study1YearCT[0].count : 0,
      study1YearTraminco: study1YearTraminco.length > 0 ? study1YearTraminco[0].count : 0,
      study1YearNT: study1YearNT.length > 0 ? study1YearNT[0].count : 0,
    });
  } catch (error) {
    console.error('[API Error]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
