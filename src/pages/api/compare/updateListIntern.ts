import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Compare from 'src/models/compare';
import db from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { accountId, listIntern: incomingIds } = req.body;

    if (!accountId || !Array.isArray(incomingIds)) {
      return res.status(400).json({ message: 'Missing or invalid accountId or listIntern' });
    }

    let compare = await Compare.findOne({ account: accountId });

    if (!compare) {
      // Nếu chưa có Compare -> tạo mới
      compare = new Compare({
        account: accountId,
        listIntern: Array.from(new Set(incomingIds)), // loại bỏ trùng lặp ngay từ đầu
      });
    } else {
      // Nếu đã có -> thêm mới các intern chưa tồn tại
      const existingIds = new Set((compare.listIntern || []).map((id: any) => id.toString()));

      const newUniqueIds = Array.from(new Set(incomingIds)).filter(
        (id) => !existingIds.has(id)
      );

      compare.listIntern = [...compare.listIntern, ...newUniqueIds];
    }

    const updatedCompare = await compare.save();

    return res.status(200).json({ compare: updatedCompare });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
