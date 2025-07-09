import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import Event from 'src/models/event';
import db from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { internId, itemId } = req.body;

    if (!internId || !itemId) {
      return res.status(400).json({ message: 'Thiếu dữ liệu: internId, itemId' });
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { 'attend._id': itemId },
      { $pull: { attend: { _id: itemId } } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công hoặc attend item' });
    }

    return res.status(200).json({ event: updatedEvent });
  } catch (error) {
    console.error('[Delete Event Item API]: ', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Đã có lỗi xảy ra',
    });
  }
}
