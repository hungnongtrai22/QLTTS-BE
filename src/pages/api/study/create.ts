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

    await db.connectDB();

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
      tearcher: req?.body?.teacher,
    }).save();

    return res.status(200).json({
      study: newStudy,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
