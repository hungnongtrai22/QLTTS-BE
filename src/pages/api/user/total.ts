import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Intern from '../../../models/intern'; // Đảm bảo đường dẫn này đúng

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    // Lấy năm hiện tại (theo múi giờ của server)
    // Chúng ta sẽ dùng nó để so sánh với năm đã được chuẩn hóa múi giờ VN
    const currentYear = new Date().getFullYear();

    // Thực thi cả 2 truy vấn đếm song song
    const [
      totalPassCount,
      passCurrentYearResult,
      totalCompleteCount,
      totalSoonCount,
      totalWaitCount,
      totalStudyCount,
    ] = await Promise.all([
      // 1. Đếm tất cả intern có status === 'pass'
      Intern.countDocuments({ status: 'pass' }),

      // 2. Đếm intern có status === 'pass' VÀ departureDate trong năm hiện tại
      //    (sử dụng aggregation để chuẩn hóa múi giờ)
      Intern.aggregate([
        {
          // Lọc trước các điều kiện cơ bản để tối ưu
          $match: {
            // status: 'pass',
            departureDate: { $exists: true, $ne: null }, // Đảm bảo ngày tồn tại
          },
        },
        {
          // $project để trích xuất 'năm' từ departureDate theo múi giờ VN
          $project: {
            departureYear: {
              $year: {
                date: '$departureDate',
                timezone: 'Asia/Ho_Chi_Minh', // Chuẩn hóa múi giờ
              },
            },
          },
        },
        {
          // Lọc lại theo năm hiện tại
          $match: {
            departureYear: currentYear,
          },
        },
        {
          // Đếm số lượng tài liệu phù hợp
          $count: 'count',
        },
      ]),
      Intern.countDocuments({ status: 'complete' }),
      Intern.countDocuments({ status: 'soon' }),
      Intern.countDocuments({ status: 'wait' }),
      Intern.countDocuments({ status: 'study' }),
    ]);

    // Kết quả từ aggregation là một mảng, ví dụ: [ { count: 123 } ]
    // Nếu không có kết quả, mảng sẽ rỗng.
    const passCurrentYearCount =
      passCurrentYearResult.length > 0 ? passCurrentYearResult[0].count : 0;

    return res.status(200).json({
      pass: totalPassCount,
      passCurrentYear: passCurrentYearCount,
      complete: totalCompleteCount,
      soon: totalSoonCount,
      wait: totalWaitCount,
      study: totalStudyCount
    });
  } catch (error) {
    console.error('[Count Intern API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}
