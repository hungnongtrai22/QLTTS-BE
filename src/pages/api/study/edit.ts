import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import Study from 'src/models/study';

// _mock
import db from '../../../utils/db';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
