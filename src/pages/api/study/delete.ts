import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Study from 'src/models/study';

// _mock
import { withAuth } from 'src/utils/auth';
import { STUDY_LOCKED_CODE, STUDY_LOCKED_MESSAGE, isUnlockRequest } from 'src/utils/studyLock';
import db from '../../../utils/db';
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const { id } = req.body; // Lấy id từ query string hoặc req.body tùy ý

    if (!id) {
      return res.status(400).json({ message: 'Missing study ID' });
    }

    // Báo cáo đã công khai bị khóa: chỉ xóa khi người dùng đã xác nhận mở khóa (xem studyLock).
    const current: any = await Study.findById(id).select('isPublic').lean();
    if (!current) {
      return res.status(404).json({ message: 'Study not found' });
    }
    if (current.isPublic && !isUnlockRequest(req.body)) {
      return res.status(409).json({ message: STUDY_LOCKED_MESSAGE, code: STUDY_LOCKED_CODE });
    }

    const deletedStudy = await Study.findByIdAndDelete(id);

    if (!deletedStudy) {
      return res.status(404).json({ message: 'Study not found' });
    }

    return res.status(200).json({
      message: 'Deleted successfully',
      study: deletedStudy,
    });
  } catch (error) {
    console.error('[Delete Study API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler);
