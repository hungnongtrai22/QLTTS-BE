import { NextApiRequest, NextApiResponse } from 'next';
// utils
import cors from 'src/utils/cors';
// _mock
import Intern from 'src/models/intern';
import db from 'src/utils/db';
import TradeUnion from 'src/models/tradeUnion';
import Company from 'src/models/company';
import { withAuth } from 'src/utils/auth';
import { calculateAge } from 'src/utils/age';
import {
  PARTNER_LIST_SELECT,
  REF_NAME_SELECT,
  accountOf,
  internScope,
  isAdmin,
} from 'src/utils/internScope';

// ----------------------------------------------------------------------
// Như listByTradeUnion, cho tài khoản nghiệp đoàn chỉ được xem một số công ty
// (account.companySelect). Tài khoản nghiệp đoàn luôn nhận đúng phạm vi của mình.

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);
    await db.connectDB();

    const account = accountOf(req);
    const admin = isAdmin(account);

    const filter: any = {};

    if (admin) {
      const { tradeUnion, companySelect } = req.body;
      // đảm bảo là array
      const companyList =
        companySelect && !Array.isArray(companySelect) ? [companySelect] : companySelect;

      if (tradeUnion) {
        filter.tradeUnion = tradeUnion;
      }

      if (companyList && companyList.length > 0) {
        filter.companySelect = { $in: companyList };
      }
    }

    const interns = await Intern.find(admin ? filter : internScope(account) || {})
      .select(admin ? '' : PARTNER_LIST_SELECT)
      .populate({ path: 'tradeUnion', model: TradeUnion, select: admin ? '' : REF_NAME_SELECT })
      .populate({ path: 'companySelect', model: Company, select: admin ? '' : REF_NAME_SELECT })
      .lean();

    const internsWithAge = interns.map((intern) => ({
      ...intern,
      age: calculateAge(intern.birthday as Date),
    }));

    res.status(200).json({
      interns: internsWithAge,
    });
  } catch (error) {
    console.error('[Intern API]: ', error);
    res.status(400).json({
      message: error instanceof Error ? error.message : error,
    });
  }
}

export default withAuth(handler, { roles: ['admin', 'tradeunion'] });
