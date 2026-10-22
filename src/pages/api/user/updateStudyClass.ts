import { NextApiRequest, NextApiResponse } from 'next';
import { isValidObjectId } from 'mongoose';
import Intern from 'src/models/intern';
import StudyClass from 'src/models/studyClass';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';

// ----------------------------------------------------------------------
// Xếp lớp cho nhiều TTS một lần (chỉ admin): PUT { ids: [id TTS], studyClass }.
//
// - studyClass = id của một lớp có thật → $set (TTS đang ở lớp khác thì chuyển sang lớp này).
// - studyClass rỗng / null → $unset: gỡ khỏi lớp. Không lưu null hay chuỗi rỗng.
// Chỉ ghi đúng trường studyClass. Tên bắt đầu bằng "update" nên chế độ READ_ONLY tự chặn.
// ----------------------------------------------------------------------

const MAX_IDS = 500;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { ids, studyClass } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_IDS) {
      return res.status(400).json({ message: `ids phải có từ 1 đến ${MAX_IDS} TTS` });
    }
    if (ids.some((id: unknown) => typeof id !== 'string' || !isValidObjectId(id))) {
      return res.status(400).json({ message: 'Có id TTS không hợp lệ' });
    }
    if (studyClass && !isValidObjectId(studyClass)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }

    await db.connectDB();

    if (studyClass && !(await StudyClass.exists({ _id: studyClass }))) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const { matchedCount, modifiedCount } = await Intern.updateMany(
      { _id: { $in: Array.from(new Set(ids)) } },
      studyClass ? { $set: { studyClass } } : { $unset: { studyClass: '' } }
    );

    return res.status(200).json({ matched: matchedCount, modified: modifiedCount });
  } catch (error) {
    console.error('[Update Study Class API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

// Chỉ admin: trang Lớp và danh sách TTS (thao tác ghi) chỉ admin dùng.
export default withAuth(handler, { roles: ['admin'] });
