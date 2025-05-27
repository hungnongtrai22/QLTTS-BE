import { verify } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import Account from 'src/models/account';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || 'your_jwt_secret_key';

// ----------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    await cors(req, res);

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ message: 'Authorization token missing' });
      
    }

    const accessToken = `${authorization}`.split(' ')[1];

    let decodedToken: any;

    try {
      decodedToken = verify(accessToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = decodedToken?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
      
    }

    await db.connectDB();

    const user = await Account.findById(userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('[Me API Error]:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
  return res.status(200).json({ message: 'OK' });
}
