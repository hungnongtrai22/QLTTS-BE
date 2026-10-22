import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import StudyClass from 'src/models/studyClass';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { findInternBasics, internBasics } from 'src/utils/studyMonth';

// ----------------------------------------------------------------------
// Một lớp và các TTS trong lớp (chỉ admin, chỉ đọc). GET /api/studyClass/<id>
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id } = req.query;
    if (typeof id !== 'string' || !isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }

    await db.connectDB();

    const [studyClass, interns] = await Promise.all([
      StudyClass.findById(id).lean(),
      findInternBasics({ studyClass: id }),
    ]);

    if (!studyClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const { _id, name, teacher, createdAt, updatedAt } = studyClass as any;

    return res.status(200).json({
      studyClass: { _id: String(_id), name, teacher: teacher || '', createdAt, updatedAt },
      interns: interns.map(internBasics),
    });
  } catch (error) {
    console.error('[Study Class Detail API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
