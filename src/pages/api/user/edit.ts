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

    await db.connectDB();

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

         birthPlace: req?.body?.birthPlace,
      phoneNumber: req?.body?.phoneNumber,
      email: req?.body?.email,
      children: req?.body?.children,

      respiratoryDisease: req?.body?.respiratoryDisease,
      obstetrics: req?.body?.obstetrics,
      highBloodPressure: req?.body?.highBloodPressure,
      ophthalmological: req?.body?.ophthalmological,
      urinaryDiseases: req?.body?.urinaryDiseases,
      anemia: req?.body?.anemia,
      otorhinolaryngological: req?.body?.otorhinolaryngological,
      cranialNerves: req?.body?.cranialNerves,
      headache: req?.body?.headache,
      pharyngealSystemDisease: req?.body?.pharyngealSystemDisease,
      hernia: req?.body?.hernia,
      anyAllergies: req?.body?.anyAllergies,
      cardiovascularDisease: req?.body?.cardiovascularDisease,
      rheumatism: req?.body?.rheumatism,
      irregalerMenstruation: req?.body?.irregalerMenstruation,
      heartDisease: req?.body?.heartDisease,
      fainting: req?.body?.fainting,
      tbTest: req?.body?.tbTest,
      dental: req?.body?.dental,
      diabetes: req?.body?.diabetes,
      history: req?.body?.history,
      digestive: req?.body?.digestive,
      asthma: req?.body?.asthma,
      otherMajor: req?.body?.otherMajor,
      psychosomatic: req?.body?.psychosomatic,
      vnsomnia: req?.body?.vnsomnia,
      surgery: req?.body?.surgery,
      hematology: req?.body?.hematology,
      lowerBack: req?.body?.lowerBack,
      hospitalization: req?.body?.hospitalization,

      others: req?.body?.others,
      moneyMonthFrom: req?.body?.moneyMonthFrom,
      moneyMonthTo: req?.body?.moneyMonthTo,
      money3YearsFrom: req?.body?.money3YearsFrom,
      money3YearsTo: req?.body?.money3YearsTo,
      religion: req?.body?.religion,
      planMarried: req?.body?.planMarried,
      crime: req?.body?.crime,
      crimeDetail: req?.body?.crimeDetail,
      fillInfo: req?.body?.fillInfo,
      },
      { new: true }
    );


    if (!updatedIntern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    return res.status(200).json({
      intern: updatedIntern,
    });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(400).json({
      message: error,
    });
  }
}
