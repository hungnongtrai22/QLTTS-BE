import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const now = new Date();
    const currentDate = now.getDate();

    // Lấy ngày bắt đầu tuần (thứ 2) và ngày kết thúc tuần (chủ nhật)
    const dayOfWeek = now.getDay(); // 0=CN, 1=T2,...,6=T7
    const monday = new Date(now);
    monday.setDate(currentDate - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weeklyStatusData = await Intern.aggregate([
      {
        $project: {
          status: 1,
          createdAt: 1,
          updatedAt: 1,

          // Chọn ngày để tính toán
          dateForCalc: {
            $switch: {
              branches: [
                { case: { $eq: ['$status', 'study'] }, then: '$createdAt' },
                { case: { $in: ['$status', ['pass', 'complete', 'soon']] }, then: '$updatedAt' }
              ],
              default: '$createdAt'
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
      // Lọc theo tuần hiện tại
      {
        $match: {
          dateForCalc: { $gte: monday, $lte: sunday }
        }
      },
      {
        $project: {
          normalizedStatus: 1,
          weekday: { $dayOfWeek: '$dateForCalc' } // 1=CN,2=T2,...,7=T7
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

    const studySeries = Array(7).fill(0); // T2->CN
    const passSeries = Array(7).fill(0);
    const completeOrSoonSeries = Array(7).fill(0);

    weeklyStatusData.forEach(item => {
      const weekday = item._id.weekday; // 1=CN,2=T2,...,7=T7
      // Chuyển về index 0=Thứ 2 ... 6=CN
      const index = (weekday + 5) % 7;
      if (item._id.status === 'study') {
        studySeries[index] = item.count;
      } else if (item._id.status === 'pass') {
        passSeries[index] = item.count;
      } else if (item._id.status === 'completeOrSoon') {
        completeOrSoonSeries[index] = item.count;
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
    console.error('[Count Intern Weekly API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
