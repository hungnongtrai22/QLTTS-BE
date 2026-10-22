import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Intern from 'src/models/intern';
import StudyClass from 'src/models/studyClass';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Xoá lớp (chỉ admin): POST { _id }.
// Gỡ lớp khỏi mọi TTS đang ở lớp đó ($unset studyClass) rồi xoá lớp. Không đụng báo cáo học
// tập hay trường nào khác của TTS. FE hỏi xác nhận kèm số TTS trước khi gọi.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { _id } = req.body || {};
    if (!_id || !isValidObjectId(_id)) {
      return res.status(400).json({ message: 'Missing or invalid class ID (_id)' });
    }

    await db.connectDB();

    if (!(await StudyClass.exists({ _id }))) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const { modifiedCount } = await Intern.updateMany(
      { studyClass: _id },
      { $unset: { studyClass: '' } }
    );
    await StudyClass.deleteOne({ _id });

    return res.status(200).json({ removedFrom: modifiedCount });
  } catch (error) {
    console.error('[Study Class Delete API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
