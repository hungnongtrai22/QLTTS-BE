import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import StudyClass from 'src/models/studyClass';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { cleanStudyClassInput, studyClassNameTaken } from 'src/utils/studyClassInput';

// ----------------------------------------------------------------------
// Sửa tên / giáo viên của lớp (chỉ admin): PUT { _id, name, teacher? }.
// Giáo viên rỗng → $unset (không lưu chuỗi rỗng). Không đụng tới TTS của lớp.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { _id } = req.body || {};
    if (!_id || !isValidObjectId(_id)) {
      return res.status(400).json({ message: 'Missing or invalid class ID (_id)' });
    }

    const input = cleanStudyClassInput(req.body);
    if ('message' in input) {
      return res.status(400).json({ message: input.message });
    }

    await db.connectDB();

    if (await studyClassNameTaken(input.name, _id)) {
      return res.status(409).json({ message: 'Đã có lớp trùng tên', code: 'NAME_TAKEN' });
    }

    const updated = await StudyClass.findByIdAndUpdate(
      _id,
      input.teacher
        ? { $set: { name: input.name, teacher: input.teacher } }
        : { $set: { name: input.name }, $unset: { teacher: '' } },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: 'Class not found' });
    }

    return res.status(200).json({ studyClass: updated });
  } catch (error) {
    console.error('[Study Class Edit API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
