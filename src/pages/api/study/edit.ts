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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const {
      _id,
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

    if (!_id) {
      return res.status(400).json({ message: 'Missing Study ID (_id)' });
    }

    // Báo cáo đã công khai bị khóa: chỉ sửa khi người dùng đã bấm "Mở khóa để sửa" (xem studyLock).
    const current: any = await Study.findById(_id).select('isPublic').lean();
    if (!current) {
      return res.status(404).json({ message: 'Study not found' });
    }
    if (current.isPublic && !isUnlockRequest(req.body)) {
      return res.status(409).json({ message: STUDY_LOCKED_MESSAGE, code: STUDY_LOCKED_CODE });
    }

    const updatedStudy = await Study.findByIdAndUpdate(
      _id,
      {
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
        teacher: req?.body?.teacher,
        isPublic: req?.body?.isPublic,
      },
      { new: true }
    );

    if (!updatedStudy) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    return res.status(200).json({
      study: updatedStudy,
    });
  } catch (error) {
    console.error('[Update Study API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}

export default withAuth(handler);
