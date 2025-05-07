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

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    db.connectDB();

    const {
      _id,
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

    if (!_id) {
      db.disconnectDB();
      return res.status(400).json({ message: 'Missing intern ID (_id)' });
    }

    const updatedIntern = await Intern.findByIdAndUpdate(
      _id,
      {
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
      },
      { new: true }
    );

    db.disconnectDB();

    if (!updatedIntern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({
      intern: updatedIntern,
    });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
