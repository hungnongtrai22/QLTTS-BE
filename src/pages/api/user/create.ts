
import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import db from '../../../utils/db';
import Intern from '../../../models/intern';
// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    await db.connectDB();

    const {
      name,
      namejp,
      gender,
      blood,
      birthday,
      age,
      height,
      weight,
      BMI,
      blindColor,
      leftEye,
      rightEye,
      hand,
      married,
      driverLicense,
      smoke,
      alcohol,
      tattoo,
      address,
      city,
      school,
      avatar,
      company,
      family,
      interest,
      foreignLanguage,
      strong,
      weak,
      aim,
      plan,
      money,
      familyInJapan,
      moveForeign,
    } = req.body;
    const newIntern = await new Intern({
      name,
      namejp,
      gender,
      blood,
      birthday,
      age,
      height,
      weight,
      BMI,
      blindColor,
      leftEye,
      rightEye,
      hand,
      married,
      driverLicense,
      smoke,
      alcohol,
      tattoo,
      address,
      city,
      school,
      avatar,
      company,
      family,
      interest,
      foreignLanguage,
      strong,
      weak,
      aim,
      plan,
      money,
      familyInJapan,
      moveForeign,
    }).save();


    return res.status(200).json({
      intern: newIntern,
    });
  } catch (error) {
    console.error('[Auth API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
