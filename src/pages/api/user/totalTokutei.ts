import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import { withAuth } from 'src/utils/auth';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

// Tách logic ra hàm riêng để /api/user/dashboardStats gọi lại được,
// thay vì chép lại pipeline. Endpoint cũ vẫn giữ nguyên đường dẫn và kết quả.
export async function computeTotalTokutei() {
  await db.connectDB();


  const [pass2023, pass2024, pass2025, pass2026, waitSkill] = await Promise.all([
    // 1. PASS – departureDate năm 2023 – type skill
    Intern.aggregate([
      {
        $match: {
          // status: 'pass',
          type: 'skill',
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

    // 2. PASS – departureDate năm 2024 – type skill
    Intern.aggregate([
      {
        $match: {
          // status: 'pass',
          type: 'skill',
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
          type: 'skill',
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

    // 3. PASS – departureDate năm 2025 – type skill
    Intern.aggregate([
      {
        $match: {
          // status: 'pass',
          type: 'skill',
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
      { $match: { year: 2026 } },
      { $count: 'count' },
    ]),

    // 4. WAIT – type skill
    Intern.countDocuments({
      status: 'wait',
      type: 'skill',
    }),
  ]);

  return {
    pass2023: pass2023.length > 0 ? pass2023[0].count : 0,
    pass2024: pass2024.length > 0 ? pass2024[0].count : 0,
    pass2025: pass2025.length > 0 ? pass2025[0].count : 0,
    pass2026: pass2026.length > 0 ? pass2026[0].count : 0,
    waitSkill,
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    return res.status(200).json(await computeTotalTokutei());
  } catch (error) {
    console.error('[API Error]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

export default withAuth(handler);
