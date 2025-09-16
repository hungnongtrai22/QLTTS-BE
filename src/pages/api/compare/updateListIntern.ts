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

    const { _id, listIntern: incomingIds } = req.body;

    if (!_id || !Array.isArray(incomingIds)) {
      return res.status(400).json({ message: 'Missing or invalid compare ID or listIntern' });
    }

    const compare = await Compare.findById(_id);
    if (!compare) {
      return res.status(404).json({ message: 'Compare not found' });
    }

    const existingIds = new Set((compare.listIntern || []).map((id: any) => id.toString()));

    // Loại bỏ ID trùng lặp
    const newUniqueIds = Array.from(new Set(incomingIds))
      .filter((id) => !existingIds.has(id));

    // Gộp lại danh sách
    compare.listIntern = [...compare.listIntern, ...newUniqueIds];

    const updatedCompare = await compare.save();

    return res.status(200).json({ compare: updatedCompare });
  } catch (error) {
    console.error('[Update Intern API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
