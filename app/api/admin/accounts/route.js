import { getBankData, saveBankData } from '../../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getBankData();
    return new Response(JSON.stringify({ accounts: data.accounts || [] }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Error fetching admin accounts:', err);
    return new Response(JSON.stringify({ message: 'Failed to fetch accounts.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, balance, status, type, accountNumber } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: 'Account ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const accIndex = (data.accounts || []).findIndex((a) => a.id === id);
    if (accIndex === -1) {
      return new Response(JSON.stringify({ message: 'Account not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const current = data.accounts[accIndex];
    const updated = {
      ...current,
      balance: balance !== undefined ? parseFloat(balance) : current.balance,
      status: status || current.status,
      type: type || current.type,
      accountNumber: accountNumber || current.accountNumber,
    };
    data.accounts[accIndex] = updated;

    await saveBankData(data);

    return new Response(JSON.stringify({ account: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error updating account:', err);
    return new Response(JSON.stringify({ message: 'Failed to update account.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
