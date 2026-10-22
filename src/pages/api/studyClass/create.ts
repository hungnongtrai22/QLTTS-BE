import { NextApiRequest, NextApiResponse } from 'next';
import StudyClass from 'src/models/studyClass';
import { withAuth } from 'src/utils/auth';
import db from 'src/utils/db';
import { cleanStudyClassInput, studyClassNameTaken } from 'src/utils/studyClassInput';

// ----------------------------------------------------------------------
// Tạo lớp (chỉ admin): POST { name, teacher? }. Trùng tên (không phân biệt hoa thường) → 409.
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const input = cleanStudyClassInput(req.body);
    if ('message' in input) {
      return res.status(400).json({ message: input.message });
    }

    await db.connectDB();

    if (await studyClassNameTaken(input.name)) {
      return res.status(409).json({ message: 'Đã có lớp trùng tên', code: 'NAME_TAKEN' });
    }

    const created = await StudyClass.create({
      name: input.name,
      ...(input.teacher && { teacher: input.teacher }),
    });

    return res.status(200).json({ studyClass: created });
  } catch (error) {
    console.error('[Study Class Create API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default withAuth(handler, { roles: ['admin'] });
