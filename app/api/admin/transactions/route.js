import { getBankData, saveBankData, resolveAdminContext } from '../../../../lib/db.js';
import { requireAdmin } from '../../../../lib/security.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Unauthorized' }), {
        status: auth.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.hasPerm('canViewTransactions')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to view transactions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const accessibleUserIds = new Set(
      (data.users || [])
        .filter((u) => ctx.canAccessUser(u))
        .map((u) => u.id)
    );

    let txs = (data.transactions || []).filter((t) =>
      ctx.isSuperAdmin ? true : accessibleUserIds.has(t.userId)
    );
    if (userId) {
      txs = txs.filter((t) => t.userId === userId);
    }

    return new Response(JSON.stringify({
      transactions: txs,
      adminContext: {
        isSuperAdmin: ctx.isSuperAdmin,
        adminId: ctx.adminId,
        adminName: ctx.adminName,
        permissions: ctx.permissions,
      },
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Error fetching admin transactions:', err);
    return new Response(JSON.stringify({ message: 'Failed to fetch transactions.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Unauthorized' }), {
        status: auth.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, type, description, amount, date, time, category, status, updateAccountBalance } = body;

    if (!userId || !description || amount === undefined) {
      return new Response(JSON.stringify({ message: 'User ID, description, and amount are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.hasPerm('canCreateTransactions')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to create transactions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = (data.users || []).find((u) => u.id === userId);
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.canAccessUser(user)) {
      return new Response(JSON.stringify({ message: 'Access denied: You can only add transactions for users you onboarded.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userAccount = (data.accounts || []).find((a) => a.userId === userId);
    const parsedAmount = parseFloat(amount);
    const normalizedAmount = type === 'debit' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

    const newTx = {
      id: `tx-${Date.now()}`,
      userId,
      userName: user.name,
      accountNumber: userAccount ? userAccount.accountNumber : '**** 0000',
      type: type || (parsedAmount < 0 ? 'debit' : 'credit'),
      description: description.trim(),
      amount: normalizedAmount,
      date: date || new Date().toISOString().split('T')[0],
      time: time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      category: category || 'Transfer',
      status: status || 'completed',
    };

    data.transactions = [newTx, ...(data.transactions || [])];

    if (updateAccountBalance && userAccount) {
      userAccount.balance = Number((userAccount.balance + normalizedAmount).toFixed(2));
    }

    await saveBankData(data);

    return new Response(JSON.stringify({ transaction: newTx }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error adding transaction:', err);
    return new Response(JSON.stringify({ message: 'Failed to add transaction.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Unauthorized' }), {
        status: auth.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, description, amount, type, date, time, category, status } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: 'Transaction ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.hasPerm('canEditTransactions')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to edit transactions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const txIndex = (data.transactions || []).findIndex((t) => t.id === id);
    if (txIndex === -1) {
      return new Response(JSON.stringify({ message: 'Transaction not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const current = data.transactions[txIndex];
    const txUser = (data.users || []).find((u) => u.id === current.userId);
    if (txUser ? !ctx.canAccessUser(txUser) : !ctx.isSuperAdmin) {
      return new Response(JSON.stringify({ message: 'Access denied: You can only edit transactions for users you onboarded.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    let newAmount = current.amount;
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      const chosenType = type || current.type;
      newAmount = chosenType === 'debit' ? -Math.abs(parsed) : Math.abs(parsed);
    }

    const updated = {
      ...current,
      description: description !== undefined ? description.trim() : current.description,
      amount: newAmount,
      type: type || current.type,
      date: date || current.date,
      time: time || current.time,
      category: category || current.category,
      status: status || current.status,
    };

    data.transactions[txIndex] = updated;

    await saveBankData(data);

    return new Response(JSON.stringify({ transaction: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error updating transaction:', err);
    return new Response(JSON.stringify({ message: 'Failed to update transaction.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Unauthorized' }), {
        status: auth.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ message: 'Transaction ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.hasPerm('canEditTransactions')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to delete transactions.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetTx = (data.transactions || []).find((t) => t.id === id);
    if (!targetTx) {
      return new Response(JSON.stringify({ message: 'Transaction not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const txUser = (data.users || []).find((u) => u.id === targetTx.userId);
    if (txUser ? !ctx.canAccessUser(txUser) : !ctx.isSuperAdmin) {
      return new Response(JSON.stringify({ message: 'Access denied: You can only delete transactions for users you onboarded.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    data.transactions = (data.transactions || []).filter((t) => t.id !== id);

    await saveBankData(data);

    return new Response(JSON.stringify({ message: 'Transaction deleted.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return new Response(JSON.stringify({ message: 'Failed to delete transaction.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
