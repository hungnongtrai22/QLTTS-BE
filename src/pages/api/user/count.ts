import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const currentYear = new Date().getFullYear();

    const monthlyStatusData = await Intern.aggregate([
      {
        $project: {
          status: 1,
          studyDate: 1,
          departureDate: 1,
          createdAt: 1,

          // Lấy tháng theo timezone VN
          month: {
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

      // Extract month and year from parts
      {
        $addFields: {
          month: '$month.month',
          year: '$month.year'
        }
      },

      // Lọc theo năm hiện tại
      {
        $match: { year: currentYear }
      },

      // Group theo month + status
      {
        $group: {
          _id: {
            month: '$month',
            status: '$normalizedStatus'
          },
          count: { $sum: 1 }
        }
      },

      { $sort: { '_id.month': 1 } }
    ]);

    // Đưa về series 12 tháng
    const studySeries = Array(12).fill(0);
    const passSeries = Array(12).fill(0);
    const completeOrSoonSeries = Array(12).fill(0);

    monthlyStatusData.forEach(item => {
      if (item._id.month) {
        const monthIndex = item._id.month - 1;
        if (item._id.status === 'study') studySeries[monthIndex] = item.count;
        if (item._id.status === 'pass') passSeries[monthIndex] = item.count;
        if (item._id.status === 'completeOrSoon') completeOrSoonSeries[monthIndex] = item.count;
      }
    });

    return res.status(200).json({
      total:
        studySeries.reduce((a, b) => a + b, 0) +
        passSeries.reduce((a, b) => a + b, 0) +
        completeOrSoonSeries.reduce((a, b) => a + b, 0),

      study: { total: studySeries.reduce((a, b) => a + b, 0), chart: { series: studySeries } },
      pass: { total: passSeries.reduce((a, b) => a + b, 0), chart: { series: passSeries } },
      completeOrSoon: { total: completeOrSoonSeries.reduce((a, b) => a + b, 0), chart: { series: completeOrSoonSeries } }
    });
  } catch (error) {
    console.error('[Count Intern API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
