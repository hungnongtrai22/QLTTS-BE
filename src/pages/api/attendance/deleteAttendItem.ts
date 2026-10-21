import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Attendance from 'src/models/attendance';
import { sendAuthError, withAuth } from 'src/utils/auth';
import { accountOf, assertInternAccess } from 'src/utils/internScope';
import db from '../../../utils/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    // Chỉ TTS trong phạm vi tài khoản (xem src/utils/internScope.ts).
    await assertInternAccess(accountOf(req), req.body.internId);

    const { internId, itemId } = req.body;

    if (!internId || !itemId) {
      return res.status(400).json({ message: 'Thiếu dữ liệu: internId, itemId' });
    }

    const updatedAttendance = await Attendance.findOneAndUpdate(
      { internId, 'attend._id': itemId },
      { $pull: { attend: { _id: itemId } } },
      { new: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công hoặc attend item' });
    }

    return res.status(200).json({ attendance: updatedAttendance });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Delete Attend Item API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'source'] });
