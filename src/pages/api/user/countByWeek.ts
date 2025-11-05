import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const now = new Date();

    // Convert JS date to VN timezone date (strip timezone offset)
    const offset = 7 * 60; // VN GMT+7
    const nowVN = new Date(now.getTime() + offset * 60 * 1000);

    const currentDate = nowVN.getUTCDate();
    const dayOfWeek = nowVN.getUTCDay(); // 0=CN,1=T2,...6=T7

    // Start of VN week (Monday)
    const monday = new Date(nowVN);
    monday.setUTCDate(currentDate - ((dayOfWeek + 6) % 7));
    monday.setUTCHours(0, 0, 0, 0);

    // End of week (Sunday)
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    const weeklyStatusData = await Intern.aggregate([
      {
        $project: {
          status: 1,
          createdAt: 1,
          studyDate: 1,
          departureDate: 1,

          dateForCalc: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'study'] }, then: '$studyDate' },
                { case: { $in: ['$status', ['pass', 'complete', 'soon']] }, then: '$departureDate' }
              ],
              default: '$createdAt'
            }
          },

          normalizedStatus: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'study'] }, then: 'study' },
                { case: { $eq: ['$status', 'pass'] }, then: 'pass' },
                { case: { $in: ['$status', ['complete', 'soon']] }, then: 'completeOrSoon' }
              ],
              default: 'other'
            }
          }
        }
      },
      {
        $project: {
          normalizedStatus: 1,
          dateForCalc: 1,
          weekday: {
            $dayOfWeek: {
              date: '$dateForCalc',
              timezone: 'Asia/Ho_Chi_Minh'
            }
          }
        }
      },
      {
        $match: {
          dateForCalc: { $gte: monday, $lte: sunday }
        }
      },
      {
        $group: {
          _id: { weekday: '$weekday', status: '$normalizedStatus' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.weekday': 1 } }
    ]);

    const studySeries = Array(7).fill(0);
    const passSeries = Array(7).fill(0);
    const completeOrSoonSeries = Array(7).fill(0);

    weeklyStatusData.forEach(item => {
      const index = (item._id.weekday + 5) % 7;
      if (item._id.status === 'study') studySeries[index] = item.count;
      if (item._id.status === 'pass') passSeries[index] = item.count;
      if (item._id.status === 'completeOrSoon') completeOrSoonSeries[index] = item.count;
    });

    const studyTotal = studySeries.reduce((a, b) => a + b, 0);
    const passTotal = passSeries.reduce((a, b) => a + b, 0);
    const completeOrSoonTotal = completeOrSoonSeries.reduce((a, b) => a + b, 0);

    return res.status(200).json({
      total: studyTotal + passTotal + completeOrSoonTotal,
      study: { total: studyTotal, chart: { series: studySeries } },
      pass: { total: passTotal, chart: { series: passSeries } },
      completeOrSoon: { total: completeOrSoonTotal, chart: { series: completeOrSoonSeries } }
    });

  } catch (error) {
    console.error('[Count Intern Weekly API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
