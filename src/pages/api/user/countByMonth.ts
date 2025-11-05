import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; 
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const dailyStatusData = await Intern.aggregate([
      {
        $project: {
          status: 1,
          studyDate: 1,
          departureDate: 1,
          createdAt: 1,

          // Lấy parts theo timezone Việt Nam
          dateParts: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', 'study'] },
                  then: {
                    $dateToParts: {
                      date: "$studyDate",
                      timezone: "Asia/Ho_Chi_Minh"
                    }
                  }
                },
                {
                  case: { $in: ['$status', ['pass', 'complete', 'soon']] },
                  then: {
                    $dateToParts: {
                      date: "$departureDate",
                      timezone: "Asia/Ho_Chi_Minh"
                    }
                  }
                }
              ],
              default: {
                $dateToParts: {
                  date: "$createdAt",
                  timezone: "Asia/Ho_Chi_Minh"
                }
              }
            }
          },

          // Chuẩn hóa status
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

      // Extract year, month, day
      {
        $addFields: {
          year: '$dateParts.year',
          month: '$dateParts.month',
          day: '$dateParts.day'
        }
      },

      // Chỉ lấy data tháng & năm hiện tại
      {
        $match: { year: currentYear, month: currentMonth }
      },

      {
        $group: {
          _id: { day: '$day', status: '$normalizedStatus' },
          count: { $sum: 1 }
        }
      },

      { $sort: { '_id.day': 1 } }
    ]);

    // Chuẩn hóa sang array
    const studySeries = Array(daysInMonth).fill(0);
    const passSeries = Array(daysInMonth).fill(0);
    const completeOrSoonSeries = Array(daysInMonth).fill(0);

    dailyStatusData.forEach(item => {
      if (item._id.day) {
        const dayIndex = item._id.day - 1;
        if (item._id.status === 'study') studySeries[dayIndex] = item.count;
        if (item._id.status === 'pass') passSeries[dayIndex] = item.count;
        if (item._id.status === 'completeOrSoon') completeOrSoonSeries[dayIndex] = item.count;
      }
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
    console.error('[Count Intern Daily API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
