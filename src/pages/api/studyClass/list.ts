import { NextApiRequest, NextApiResponse } from 'next';
import Intern from 'src/models/intern';
import StudyClass from 'src/models/studyClass';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Danh sách lớp (chỉ admin), sắp theo tên, kèm sĩ số:
//   total    — mọi TTS đang gắn lớp này
//   studying — trong đó đang học (status 'study')
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const [classes, counts] = await Promise.all([
      StudyClass.find().sort({ name: 1 }).lean(),
      Intern.aggregate([
        { $match: { studyClass: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$studyClass',
            total: { $sum: 1 },
            studying: { $sum: { $cond: [{ $eq: ['$status', 'study'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const countById = new Map(counts.map((item: any) => [String(item._id), item]));

    return res.status(200).json({
      classes: classes.map((item: any) => ({
        _id: String(item._id),
        name: item.name,
        teacher: item.teacher || '',
        total: countById.get(String(item._id))?.total || 0,
        studying: countById.get(String(item._id))?.studying || 0,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  } catch (error) {
    console.error('[Study Class List API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
