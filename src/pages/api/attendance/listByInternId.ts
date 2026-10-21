import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Attendance from 'src/models/attendance';
import db from 'src/utils/db';
import { ALL_ROLES, sendAuthError, withAuth } from 'src/utils/auth';
import { accountOf, assertInternAccess } from 'src/utils/internScope';

// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // Chỉ TTS trong phạm vi tài khoản (xem src/utils/internScope.ts).
    await assertInternAccess(accountOf(req), req.body.internId);

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Missing internId' });
    }

    const attendances = await Attendance.find({ internId }).sort({
      year: -1,
      month: -1, // Sắp xếp theo thời gian giảm dần: năm -> tháng
    });

    return res.status(200).json({
      attendances,
    });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Attendance API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
    });
  }
}

export default withAuth(handler, { roles: ALL_ROLES });
