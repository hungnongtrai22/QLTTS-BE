import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Intern from 'src/models/intern';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import Source from 'src/models/source';

// Hàm tính tuổi từ ngày sinh
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

    const intern: any = await Intern.findById(req.query.id)
      .populate({ path: 'tradeUnion', model: TradeUnion })
      .populate({ path: 'companySelect', model: Company })
      .populate({ path: 'source', model: Source })
      .lean(); // để object thuần, dễ chỉnh sửa

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    // tính lại tuổi từ birthday
    intern.age = calculateAge(intern.birthday);

    return res.status(200).json({
      intern,
    });
  } catch (error) {
    console.error('[Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}
