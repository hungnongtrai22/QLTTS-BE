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
    const currentMonth = now.getMonth() + 1; // tháng hiện tại (1-12)
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // số ngày trong tháng

    const dailyStatusData = await Intern.aggregate([
      {
        $project: {
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          day: {
            $switch: {
              branches: [
                // Nếu là study -> lấy ngày từ createdAt
                {
                  case: {
                    $in: [{ $ifNull: ['$status', 'study'] }, ['study', null, '']]
                  },
                  then: { $dayOfMonth: '$createdAt' }
                },
                // Nếu là pass/complete/soon -> lấy ngày từ updatedAt
                {
                  case: { $in: ['$status', ['pass', 'complete', 'soon']] },
                  then: { $dayOfMonth: '$updatedAt' }
                }
              ],
              default: { $dayOfMonth: '$createdAt' }
            }
          },
          month: {
            $switch: {
              branches: [
                {
                  case: {
                    $in: [{ $ifNull: ['$status', 'study'] }, ['study', null, '']]
                  },
                  then: { $month: '$createdAt' }
                },
                {
                  case: { $in: ['$status', ['pass', 'complete', 'soon']] },
                  then: { $month: '$updatedAt' }
                }
              ],
              default: { $month: '$createdAt' }
            }
          },
          year: {
            $switch: {
              branches: [
                {
                  case: {
                    $in: [{ $ifNull: ['$status', 'study'] }, ['study', null, '']]
                  },
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
          normalizedStatus: {
            $switch: {
              branches: [
                {
                  case: { $in: [{ $ifNull: ['$status', 'study'] }, ['study', null, '']] },
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
      // Chỉ lấy bản ghi thuộc năm & tháng hiện tại
      {
        $match: { year: currentYear, month: currentMonth }
      },
      {
        $group: {
          _id: {
            day: '$day',
            status: '$normalizedStatus'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ]);

    const studySeries = Array(daysInMonth).fill(0);
    const passSeries = Array(daysInMonth).fill(0);
    const completeOrSoonSeries = Array(daysInMonth).fill(0);

    dailyStatusData.forEach(item => {
      const dayIndex = item._id.day - 1;
      if (item._id.status === 'study') {
        studySeries[dayIndex] = item.count;
      } else if (item._id.status === 'pass') {
        passSeries[dayIndex] = item.count;
      } else if (item._id.status === 'completeOrSoon') {
        completeOrSoonSeries[dayIndex] = item.count;
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
