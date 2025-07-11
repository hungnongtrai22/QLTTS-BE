import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from '../../../utils/db';
import Order from '../../../models/order';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    if (req.method !== 'PUT') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    await db.connectDB();

    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ message: 'Missing internId' });
    }

    const result = await Order.updateMany(
      { listIntern: internId },
      { $pull: { listIntern: internId } }
    );

    return res.status(200).json({
      message: `Removed internId ${internId} from ${result.modifiedCount} order(s).`,
    });
  } catch (error) {
    console.error('[Remove Intern from All Orders API]: ', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
