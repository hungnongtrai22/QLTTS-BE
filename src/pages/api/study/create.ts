import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Study from 'src/models/study';

// _mock
import { sendAuthError, withAuth } from 'src/utils/auth';
import { accountOf, assertInternAccess } from 'src/utils/internScope';
import db from '../../../utils/db';
// ----------------------------------------------------------------------

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    // Chỉ TTS trong phạm vi tài khoản (xem src/utils/internScope.ts).
    await assertInternAccess(accountOf(req), req.body.internId);

    const {
      internId,
      health,
      cooperation,
      attend,
      discipline,
      attitude,
      acquiringKnowledge,
      write,
      read,
      listen,
      speak,
      total,
      average,
      level,
      time,
      kanji,
      grammarAndReading,
      listeningComprehension,
      totalReadingAndListening,
      learningProcess,
      characteristic,
      comment,
      monthAndYear,
    } = req.body;
    const newStudy = await new Study({
      internId,
      health,
      cooperation,
      attend,
      discipline,
      attitude,
      acquiringKnowledge,
      write,
      read,
      listen,
      speak,
      total,
      average,
      level,
      time,
      kanji,
      grammarAndReading,
      listeningComprehension,
      totalReadingAndListening,
      learningProcess,
      characteristic,
      comment,
      monthAndYear,
      // Trước đây gõ nhầm thành "tearcher" (không có trong schema) nên báo cáo tạo mới mất tên giáo viên.
      teacher: req?.body?.teacher,
      isPublic: req?.body?.isPublic,
    }).save();

    return res.status(200).json({
      study: newStudy,
    });
  } catch (error) {
    if (sendAuthError(error, res)) return undefined;
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'source'] });
