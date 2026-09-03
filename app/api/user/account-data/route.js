import { getBankData } from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    let userCookie = null;
    try {
      userCookie = JSON.parse(request.cookies.get('user')?.value || '{}');
    } catch (_) {
      userCookie = null;
    }

    if (!userCookie || !userCookie.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized.' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }

    const data = await getBankData();
    const user = (data.users || []).find((u) => u.id === userCookie.id || u.email?.toLowerCase() === userCookie.email?.toLowerCase());

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found in system.' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }

    const accounts = (data.accounts || []).filter((a) => a.userId === user.id);
    const transactions = (data.transactions || []).filter((t) => t.userId === user.id);
    const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const primaryAccount = accounts[0] || {
      accountNumber: '**** 4532',
      type: 'Checking',
      balance: totalBalance,
    };

    const effectiveNotice = user.notice && user.notice.enabled !== undefined
      ? user.notice
      : (userCookie && userCookie.notice ? userCookie.notice : {
          enabled: false,
          message: 'Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.',
          progress: 65,
          progressStatus: '65% • Failed',
          progressLabel: 'Authorization Progress'
        });

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
