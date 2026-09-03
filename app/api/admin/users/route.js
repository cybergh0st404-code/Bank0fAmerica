import { getBankData, saveBankData, DEFAULT_ALLOWED_PAGES } from '../../../../lib/db';

export async function GET() {
  try {
    const data = await getBankData();
    const usersWithAccounts = (data.users || []).map((user) => {
      const userAccounts = (data.accounts || []).filter((a) => a.userId === user.id);
      const totalBalance = userAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
      return {
        ...user,
        accountsCount: userAccounts.length,
        totalBalance,
        primaryAccount: userAccounts[0] || null,
      };
    });
    return new Response(JSON.stringify({ users: usersWithAccounts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return new Response(JSON.stringify({ message: 'Failed to fetch users.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, twoFactorCode, initialBalance, accountType, status } = body;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ message: 'Name, email, and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const existing = (data.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return new Response(JSON.stringify({ message: 'A user with this email already exists.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = `user-${Date.now()}`;
    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      twoFactorCode: twoFactorCode ? twoFactorCode.trim() : '123456',
      role: 'user',
      status: status || 'active',
      phone: body.phone || '',
      address: body.address || '',
      allowedPages: Array.isArray(body.allowedPages) && body.allowedPages.length > 0 ? body.allowedPages : DEFAULT_ALLOWED_PAGES,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const parsedBalance = parseFloat(initialBalance) || 0;
    const last4 = Math.floor(1000 + Math.random() * 9000);
    const fullAccNum = `026009593${last4}`;
    const newAccount = {
      id: `acc-${Date.now()}`,
      userId: userId,
      userName: newUser.name,
      accountNumber: `**** ${last4}`,
      fullAccountNumber: fullAccNum,
      routingNumber: '026009593',
      type: accountType || 'Checking',
      balance: parsedBalance,
      status: 'active',
    };

    data.users = [...(data.users || []), newUser];
    data.accounts = [...(data.accounts || []), newAccount];

    // If initial balance > 0, create an initial deposit transaction
    if (parsedBalance > 0) {
      const initTx = {
        id: `tx-${Date.now()}`,
        userId: userId,
        userName: newUser.name,
        accountNumber: newAccount.accountNumber,
        type: 'credit',
        description: 'Initial Account Deposit',
        amount: parsedBalance,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        category: 'Deposit',
        status: 'completed',
      };
      data.transactions = [initTx, ...(data.transactions || [])];
    }

    await saveBankData(data);

    return new Response(JSON.stringify({ user: newUser, account: newAccount }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error adding user:', err);
    return new Response(JSON.stringify({ message: 'Failed to create user.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, email, password, twoFactorCode, status, balance, phone, address } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: 'User ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const userIndex = (data.users || []).findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return new Response(JSON.stringify({ message: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const current = data.users[userIndex];
    const updatedUser = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      email: email !== undefined ? email.trim() : current.email,
      password: password !== undefined && password !== '' ? password.trim() : current.password,
      twoFactorCode: twoFactorCode !== undefined && twoFactorCode !== '' ? twoFactorCode.trim() : current.twoFactorCode,
      status: status !== undefined ? status : current.status,
      phone: phone !== undefined ? phone : current.phone,
      address: address !== undefined ? address : current.address,
    };
    data.users[userIndex] = updatedUser;

    // Update name in user's accounts
    if (name) {
      data.accounts = (data.accounts || []).map((acc) => {
        if (acc.userId === id) {
          return { ...acc, userName: updatedUser.name };
        }
        return acc;
      });
      data.transactions = (data.transactions || []).map((tx) => {
        if (tx.userId === id) {
          return { ...tx, userName: updatedUser.name };
        }
        return tx;
      });
    }

    // If notice settings were provided, update user notice
    if (body.notice !== undefined) {
      updatedUser.notice = {
        ...(current.notice || {}),
        ...body.notice,
      };
    }

    // If allowedPages settings were provided, update user allowedPages
    if (body.allowedPages !== undefined && Array.isArray(body.allowedPages)) {
      updatedUser.allowedPages = body.allowedPages;
    }

    // If balance was provided, update primary account balance
    if (balance !== undefined && balance !== '') {
      const newBal = parseFloat(balance);
      if (!isNaN(newBal)) {
        const accIdx = (data.accounts || []).findIndex((a) => a.userId === id);
        if (accIdx !== -1) {
          data.accounts[accIdx].balance = newBal;
        }
      }
    }

    await saveBankData(data);

    return new Response(JSON.stringify({ user: updatedUser }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return new Response(JSON.stringify({ message: 'Failed to update user.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ message: 'User ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    data.users = (data.users || []).filter((u) => u.id !== id);
    data.accounts = (data.accounts || []).filter((a) => a.userId !== id);
    data.transactions = (data.transactions || []).filter((t) => t.userId !== id);

    await saveBankData(data);

    return new Response(JSON.stringify({ message: 'User deleted successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return new Response(JSON.stringify({ message: 'Failed to delete user.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
