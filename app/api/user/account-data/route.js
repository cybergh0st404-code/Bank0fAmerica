import { getBankData } from '../../../../lib/db.js';
import { getSessionFromRequest } from '../../../../lib/security.js';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return new Response(JSON.stringify({ message: 'Unauthorized.' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');
    const queryEmail = searchParams.get('email');

    let effectiveId = null;
    let effectiveEmail = null;

    if (session.role === 'admin') {
      effectiveId = queryUserId || session.id;
      effectiveEmail = queryEmail || session.email;
    } else {
      effectiveId = session.id;
      effectiveEmail = session.email;
    }

    const data = await getBankData();
    const user = (data.users || []).find((u) => 
      (effectiveId && u.id === effectiveId) || 
      (effectiveEmail && u.email?.toLowerCase() === effectiveEmail?.toLowerCase())
    );

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found in system.' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }

    // Active session revocation check for non-admin accounts
    if (session.role !== 'admin') {
      if (user.status === 'flagged') {
        return new Response(JSON.stringify({ message: 'Account restricted. Please contact customer service.' }), {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
          },
        });
      }

      const dbVersion = Number(user.tokenVersion) || 1;
      const sessionVersion = Number(session.tokenVersion) || 1;
      if (sessionVersion < dbVersion) {
        return new Response(JSON.stringify({ message: 'Session revoked. Please log in again.' }), {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
          },
        });
      }
    }

    const accounts = (data.accounts || []).filter((a) => a.userId === user.id);
    const transactions = (data.transactions || []).filter((t) => t.userId === user.id);
    const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const primaryAccount = accounts[0] || null;

    let showSpendingOverview = true;
    try {
      const statusFile = path.join(process.cwd(), 'websiteStatus.json');
      const raw = await fs.readFile(statusFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (typeof parsed.showSpendingOverview === 'boolean') {
        showSpendingOverview = parsed.showSpendingOverview;
      }
    } catch (_) {
      if (globalThis.__WEBSITE_STATUS__ && typeof globalThis.__WEBSITE_STATUS__.showSpendingOverview === 'boolean') {
        showSpendingOverview = globalThis.__WEBSITE_STATUS__.showSpendingOverview;
      }
    }

    const effectiveNotice = user.notice && user.notice.enabled !== undefined
      ? user.notice
      : {
          enabled: false,
          message: 'Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.',
          progress: 65,
          progressStatus: '65% • Failed',
          progressLabel: 'Authorization Progress'
        };

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          status: user.status,
          role: user.role,
          allowedPages: user.allowedPages || [],
        },
        allowedPages: user.allowedPages || [],
        primaryAccount,
        accounts,
        totalBalance,
        transactions,
        notice: effectiveNotice,
        showSpendingOverview,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (err) {
    console.error('Error fetching user account data:', err);
    return new Response(JSON.stringify({ message: 'Failed to retrieve account data.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
