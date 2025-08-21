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
          createdAt: 1,
          updatedAt: 1,

          // Lấy tháng
          month: {
            $switch: {
              branches: [
                // Nếu là study -> lấy tháng từ createdAt
                {
                  case: { $eq: ['$status', 'study'] },
                  then: { $month: '$createdAt' }
                },
                // Nếu là pass/complete/soon -> lấy tháng từ updatedAt
                {
                  case: { $in: ['$status', ['pass', 'complete', 'soon']] },
                  then: { $month: '$updatedAt' }
                }
              ],
              default: { $month: '$createdAt' }
            }
          },

          // Lấy năm
          year: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', 'study'] },
                  then: { $year: '$createdAt' }
                },
                {
                  case: { $in: ['$status', ['pass', 'complete', 'soon']] },
                  then: { $year: '$updatedAt' }
                }
              ],
              default: { $year: '$createdAt' }
            }
          },

          // Chuẩn hóa status
          normalizedStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$status', 'study'] },
                  then: 'study'
                },
                {
                  case: { $eq: ['$status', 'pass'] },
                  then: 'pass'
                },
                {
                  case: { $in: ['$status', ['complete', 'soon']] },
                  then: 'completeOrSoon'
                }
              ],
              default: 'other'
            }
          }
        }
      },

      // Chỉ lấy năm hiện tại
      {
        $match: { year: currentYear }
      },

      // Group theo tháng + status
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

    // Chuẩn hóa dữ liệu thành 12 tháng
    const studySeries = Array(12).fill(0);
    const passSeries = Array(12).fill(0);
    const completeOrSoonSeries = Array(12).fill(0);

    monthlyStatusData.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (item._id.status === 'study') {
        studySeries[monthIndex] = item.count;
      } else if (item._id.status === 'pass') {
        passSeries[monthIndex] = item.count;
      } else if (item._id.status === 'completeOrSoon') {
        completeOrSoonSeries[monthIndex] = item.count;
      }
    });

    // Tổng
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
    console.error('[Count Intern API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
