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
      pass3Year2022,
      pass3Year2023,
      pass3Year2024,
      pass3Year2025,
      wait3Year,
      studyDN,
      studyTV,
      studyCT,
      studyHN,
      studyTraminco,
      studyIkigai,
      studyBCN,
      studyNTC,
      studyTG,
      studyDT,
      studyNT,
    ] = await Promise.all([
      // 2. PASS – departureDate năm 2024 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'intern',
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
        { $match: { year: 2022 } },
        { $count: 'count' },
      ]),

      // 2. PASS – departureDate năm 2024 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'intern',
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
        { $match: { year: 2023 } },
        { $count: 'count' },
      ]),

      // 3. PASS – departureDate năm 2025 – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'intern',
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

      // 4. WAIT – type skill
      Intern.aggregate([
        {
          $match: {
            // status: 'pass',
            type: 'intern',
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

      Intern.countDocuments({ status: 'wait', type: 'intern' }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('691be541ff50cf6c50816f3c'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('68786d6c5fc5821e5d48c07a'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('68902f7f19919951f2fa3cef'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('691be8dbde02e10d7e2bf24e'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('68a32f0ab843c4bca9f10342'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('68904ddc8ed5429c9cba301b'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('691be566ff50cf6c50816f40'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('691be570ff50cf6c50816f42'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('689aa89f6b1722f6dd058e2e'),
      }),

      Intern.countDocuments({
        status: 'study',
        type: 'intern',
        source: new mongoose.Types.ObjectId('6881a41d2c7b866020ae35f6'),
      }),

      Intern.aggregate([
        {
          $match: {
            status: 'study',
            type: 'intern',
            $or: [{ source: '' }, { source: null }, { source: { $exists: false } }],
          },
        },
        { $count: 'count' },
      ]),
    ]);

    return res.status(200).json({
      pass3Year2022: pass3Year2022.length > 0 ? pass3Year2022[0].count : 0,
      pass3Year2023: pass3Year2023.length > 0 ? pass3Year2023[0].count : 0,
      pass3Year2024: pass3Year2024.length > 0 ? pass3Year2024[0].count : 0,
      pass3Year2025: pass3Year2025.length > 0 ? pass3Year2025[0].count : 0,
      wait3Year,
      studyDN,
      studyTV,
      studyCT,
      studyHN,
      studyTraminco,
      studyIkigai,
      studyBCN,
      studyNTC,
      studyTG,
      studyDT,
      studyNT: studyNT.length > 0 ? studyNT[0].count : 0,
    });
  } catch (error) {
    console.error('[API Error]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
