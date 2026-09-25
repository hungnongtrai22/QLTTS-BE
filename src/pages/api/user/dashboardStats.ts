import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
import db from 'src/utils/db';
import { withAuth } from 'src/utils/auth';
// Dùng lại đúng logic của 12 endpoint lẻ — không chép lại pipeline nào.
import { computeCount } from './count';
import { computeCountSource } from './countSource';
import { computeCountByMonth } from './countByMonth';
import { computeCountByWeek } from './countByWeek';
import { computeTopStudy } from './topStudy';
import { computeAvgSource } from './avgSource';
import { computeTotal3Year } from './total3Year';
import { computeTotal } from './total';
import { computeTotal1Year } from './total1Year';
import { computeTotalEngineer } from './totalEngineer';
import { computeTotalTokuteiKS } from './totalTokuteiKS';
import { computeTotalTokutei } from './totalTokutei';

// ----------------------------------------------------------------------
// Gộp toàn bộ số liệu của trang tổng quan vào MỘT lời gọi.
//
// Trước đây giao diện gọi 12 endpoint riêng, mỗi cái là một vòng đi/về tới Atlas
// cộng một pipeline aggregate. Ở đây chạy song song rồi trả về một lần.
//
// Kết quả được cache trong bộ nhớ tiến trình: đây là số liệu tổng hợp, không cần
// chính xác tới từng giây, và trang tổng quan thường được mở lại liên tục.
// ----------------------------------------------------------------------

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 phút

let cache: { at: number; data: Record<string, unknown> } | null = null;

async function buildStats() {
  await db.connectDB();

  const [
    count,
    countSource,
    countByMonth,
    countByWeek,
    topStudy,
    avgSource,
    total3Year,
    total,
    total1Year,
    totalEngineer,
    totalTokuteiKS,
    totalTokutei,
  ] = await Promise.all([
    computeCount(),
    computeCountSource(),
    computeCountByMonth(),
    computeCountByWeek(),
    computeTopStudy(),
    computeAvgSource(),
    computeTotal3Year(),
    computeTotal(),
    computeTotal1Year(),
    computeTotalEngineer(),
    computeTotalTokuteiKS(),
    computeTotalTokutei(),
  ]);

  return {
    count,
    countSource,
    countByMonth,
    countByWeek,
    topStudy,
    avgSource,
    total3Year,
    total,
    total1Year,
    totalEngineer,
    totalTokuteiKS,
    totalTokutei,
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    // ?fresh=1 để bỏ qua cache khi cần kiểm chứng.
    const skipCache = req.query.fresh === '1';

    if (!skipCache && cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return res.status(200).json({ ...cache.data, cached: true });
    }

    const data = await buildStats();
    cache = { at: Date.now(), data };

    return res.status(200).json({ ...data, cached: false });
  } catch (error) {
    console.error('[Dashboard Stats API]: ', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}

export default withAuth(handler);
