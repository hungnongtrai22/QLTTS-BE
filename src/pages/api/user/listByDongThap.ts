/* eslint-disable no-plusplus */

import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Intern from 'src/models/intern';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';

// Hàm tính tuổi
function calculateAge(birthday: Date): number {
  if (!birthday) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const m = today.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const keywordRegex = /đồng tháp|dong thap/i; // không phân biệt hoa thường

    const interns = await Intern.find({
      $or: [
        { address: { $regex: keywordRegex } },
        { city: { $regex: keywordRegex } },
      ],
    })
      .populate({ path: 'tradeUnion', model: TradeUnion })
      .populate({ path: 'companySelect', model: Company })
      .lean();

    const internsWithAge = interns.map((intern) => ({
      ...intern,
      age: calculateAge(intern.birthday as Date),
    }));

    res.status(200).json({ interns: internsWithAge });
  } catch (error) {
    console.error('[Intern API]: ', error);
    res.status(400).json({ message: error instanceof Error ? error.message : error });
  }
}
