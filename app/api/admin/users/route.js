import { getBankData, saveBankData, DEFAULT_ALLOWED_PAGES, normalizePagesList, resolveAdminContext } from '../../../../lib/db.js';
import { requireAdmin, hashPassword, hashTwoFactorCode } from '../../../../lib/security.js';

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

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allAdminsMap = {};
    (data.users || []).forEach((u) => {
      if (u.role === 'admin' || u.role === 'superadmin') {
        allAdminsMap[u.id] = u.name || u.email;
      }
    });

    const visibleClientUsers = (data.users || []).filter((user) => ctx.canAccessUser(user));

    const usersWithAccounts = visibleClientUsers.map((user) => {
      const userAccounts = (data.accounts || []).filter((a) => a.userId === user.id);
      const totalBalance = userAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
      const userTransactions = (data.transactions || []).filter((t) => t.userId === user.id);
      const initialDepositTx = userTransactions.find(
        (t) => (t.description?.toLowerCase().includes('initial') || t.category === 'Deposit') && t.type === 'credit'
      ) || userTransactions.find((t) => t.type === 'credit');
      const initialDepositDate = initialDepositTx ? initialDepositTx.date : (user.createdAt || new Date().toISOString().split('T')[0]);
      const resolvedAdminName =
        user.createdByAdminName ||
        (user.createdByAdminId && allAdminsMap[user.createdByAdminId]) ||
        'Super Administrator';

      return {
        ...user,
        createdByAdminId: user.createdByAdminId || 'admin-1',
        createdByAdminName: resolvedAdminName,
        accountsCount: userAccounts.length,
        totalBalance,
        primaryAccount: userAccounts[0] || null,
        initialDepositDate,
      };
    });

    return new Response(
      JSON.stringify({
        users: usersWithAccounts,
        adminContext: {
          isSuperAdmin: ctx.isSuperAdmin,
          adminId: ctx.adminId,
          adminName: ctx.adminName,
          permissions: ctx.permissions,
        },
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
    console.error('Error fetching admin users:', err);
    return new Response(JSON.stringify({ message: 'Failed to fetch users.' }), {
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

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.hasPerm('canCreateUsers')) {
      return new Response(
        JSON.stringify({ message: 'Access Denied: Super Admin has not granted you permission to onboard new users.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name, email, password, twoFactorCode, initialBalance, accountType, status } = body;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ message: 'Name, email, and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = (data.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return new Response(JSON.stringify({ message: 'A user with this email already exists.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = `user-${Date.now()}`;
    const hashedPassword = await hashPassword(password.trim());
    const raw2FACode = twoFactorCode ? twoFactorCode.trim() : Math.floor(100000 + Math.random() * 900000).toString();
    const hashed2FACode = await hashTwoFactorCode(raw2FACode);

    let ownerAdminId = ctx.adminId;
    let ownerAdminName = ctx.adminName;
    if (ctx.isSuperAdmin && body.createdByAdminId) {
      ownerAdminId = body.createdByAdminId;
      const targetAdm = (data.users || []).find((u) => u.id === body.createdByAdminId && u.role === 'admin');
      if (targetAdm) {
        ownerAdminName = targetAdm.name;
      }
    }

    const userCreatedAt = body.createdAt && body.createdAt.trim() !== ''
      ? body.createdAt.trim()
      : new Date().toISOString().split('T')[0];

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      twoFactorCode: hashed2FACode,
      role: 'user',
      status: status || 'active',
      phone: body.phone || '+1 (555) 019-2834',
      address: body.address || '100 North Tryon St, Charlotte, NC 28255',
      createdAt: userCreatedAt,
      tokenVersion: 1,
      createdByAdminId: ownerAdminId,
      createdByAdminName: ownerAdminName,
      allowedPages: DEFAULT_ALLOWED_PAGES,
      lockedPages: [],
      adminPermissions: {},
      notice: {
        enabled: false,
        showPopup: true,
        sendAsMessage: false,
        subject: "Official Account & Compliance Notice",
        sender: "Bank of America Executive Compliance",
        category: "Notices",
        sentAt: "",
        message: "Notice: Please note that full and complete payment is required before access and authorization to your online account and credit card can be granted. Kindly ensure all outstanding balances are settled to avoid delays.",
        progress: 65,
        progressStatus: "65% • Action Required",
        progressLabel: "Authorization Progress",
        messages: [],
      },
    };

    const parsedBalance = parseFloat(initialBalance) || 0;
    const accountNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const newAccount = {
      id: `acc-${Date.now()}`,
      userId,
      userName: newUser.name,
      accountNumber: `**** ${accountNum.slice(-4)}`,
      fullAccountNumber: accountNum,
      routingNumber: '026009593',
      type: accountType || 'Advantage Plus Checking',
      balance: parsedBalance,
      status: 'active',
    };

    const initialDate = body.initialDepositDate && body.initialDepositDate.trim() !== ''
      ? body.initialDepositDate.trim()
      : userCreatedAt;

    const initialTx = {
      id: `tx-${Date.now()}`,
      userId,
      userName: newUser.name,
      accountNumber: newAccount.accountNumber,
      type: 'credit',
      description: 'Initial Account Deposit',
      amount: parsedBalance,
      date: initialDate,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      category: 'Deposit',
      status: 'completed',
    };

    data.users = [...(data.users || []), newUser];
    data.accounts = [...(data.accounts || []), newAccount];
    data.transactions = [initialTx, ...(data.transactions || [])];

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
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Unauthorized' }), {
        status: auth.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, name, email, password, twoFactorCode, status, balance, phone, address } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: 'User ID is required.' }), {
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

    const userIndex = (data.users || []).findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return new Response(JSON.stringify({ message: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const current = data.users[userIndex];
    if (!ctx.canAccessUser(current)) {
      return new Response(JSON.stringify({ message: 'Access denied: You can only manage users you onboarded.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check granular permissions for the requested updates
    const isEditingProfile = name !== undefined || email !== undefined || password !== undefined || twoFactorCode !== undefined || phone !== undefined || address !== undefined;
    const isEditingStatusOrLogout = (status !== undefined && status !== current.status) || body.forceLogout === true || body.action === 'logout';
    const isEditingNotices = body.notice !== undefined;
    const isEditingMenus = body.allowedPages !== undefined || body.lockedPages !== undefined;
    const isEditingBalanceOrDates = (balance !== undefined && balance !== '') || body.initialDepositDate !== undefined || body.depositDate !== undefined;

    if (isEditingProfile && !ctx.hasPerm('canEditUsers')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to edit user details.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (isEditingStatusOrLogout && !ctx.hasPerm('canManageStatus')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to change account status or force log out users.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (isEditingNotices && !ctx.hasPerm('canManageNotices')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to manage user notices and restrictions.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (isEditingMenus && !ctx.hasPerm('canManageMenus')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to manage user menu access.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (isEditingBalanceOrDates && !ctx.hasPerm('canManageBalances')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to modify account balances or deposit dates.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    let newPassword = current.password;
    let passwordChanged = false;
    if (password !== undefined && password !== '' && !password.startsWith('pbkdf2:')) {
      newPassword = await hashPassword(password.trim());
      passwordChanged = true;
    }

    let newTwoFactorCode = current.twoFactorCode;
    if (twoFactorCode !== undefined && twoFactorCode !== '' && !twoFactorCode.startsWith('pbkdf2:')) {
      newTwoFactorCode = await hashTwoFactorCode(twoFactorCode.trim());
    }

    let tokenVersion = Number(current.tokenVersion) || 1;
    const statusChanged = status !== undefined && status !== current.status;
    const isRestricting = status === 'blocked' || status === 'suspended' || status === 'flagged';
    const forceLogoutRequested = body.forceLogout === true || body.action === 'logout';
    if (passwordChanged || (statusChanged && isRestricting) || forceLogoutRequested) {
      tokenVersion += 1;
    }

    const newCreatedAt = (body.createdAt || body.openingDate) !== undefined && (body.createdAt || body.openingDate) !== ''
      ? (body.createdAt || body.openingDate).trim()
      : current.createdAt;

    const updatedStatus = status !== undefined ? String(status).trim().toLowerCase() : current.status;

    const updatedUser = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      email: email !== undefined ? email.trim() : current.email,
      password: newPassword,
      twoFactorCode: newTwoFactorCode,
      status: updatedStatus,
      phone: phone !== undefined ? phone : current.phone,
      address: address !== undefined ? address : current.address,
      createdAt: newCreatedAt,
      tokenVersion,
    };

    // Synchronize status and name in user's accounts
    if (status !== undefined || name) {
      data.accounts = (data.accounts || []).map((acc) => {
        if (acc.userId === id) {
          return {
            ...acc,
            userName: name ? updatedUser.name : acc.userName,
            status: status !== undefined ? updatedStatus : acc.status,
          };
        }
        return acc;
      });
    }

    if (name) {
      data.transactions = (data.transactions || []).map((tx) => {
        if (tx.userId === id) {
          return { ...tx, userName: updatedUser.name };
        }
        return tx;
      });
    }

    // If notice settings were provided, update user notice
    if (body.notice !== undefined) {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedDate = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}`;
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      updatedUser.notice = {
        ...(current.notice || {}),
        ...body.notice,
        sentDate: body.notice.sendAsMessage ? (body.notice.sentDate || formattedDate) : (current.notice?.sentDate || formattedDate),
        sentTime: body.notice.sendAsMessage ? (body.notice.sentTime || formattedTime) : (current.notice?.sentTime || formattedTime),
      };
    }

    // If allowedPages settings were provided, update user allowedPages
    if (body.allowedPages !== undefined && Array.isArray(body.allowedPages)) {
      updatedUser.allowedPages = normalizePagesList(body.allowedPages);
    }

    // If lockedPages settings were provided, update user lockedPages
    if (body.lockedPages !== undefined && Array.isArray(body.lockedPages)) {
      updatedUser.lockedPages = normalizePagesList(body.lockedPages);
    }

    // Super Admin can reassign which Admin owns this user
    if (ctx.isSuperAdmin && body.createdByAdminId !== undefined) {
      updatedUser.createdByAdminId = body.createdByAdminId;
      if (body.createdByAdminId === 'admin-1') {
        updatedUser.createdByAdminName = 'Super Administrator';
      } else {
        const assignedAdmin = (data.users || []).find((u) => u.id === body.createdByAdminId);
        updatedUser.createdByAdminName = assignedAdmin ? assignedAdmin.name : (body.createdByAdminName || 'Admin');
      }
    } else {
      updatedUser.createdByAdminId = current.createdByAdminId || (ctx.isSuperAdmin ? 'admin-1' : ctx.adminId);
      updatedUser.createdByAdminName = current.createdByAdminName || (ctx.isSuperAdmin ? 'Super Administrator' : ctx.adminName);
    }

    data.users[userIndex] = updatedUser;

    // If balance was provided, update primary account balance
    let effectiveBalance = null;
    if (balance !== undefined && balance !== '') {
      const newBal = parseFloat(balance);
      if (!isNaN(newBal)) {
        effectiveBalance = newBal;
        const accIdx = (data.accounts || []).findIndex((a) => a.userId === id);
        if (accIdx !== -1) {
          data.accounts[accIdx].balance = newBal;
        }
      }
    }

    // If initialDepositDate was provided, update or create the initial deposit transaction
    const depositDate = body.initialDepositDate || body.depositDate;
    if (depositDate !== undefined && depositDate !== '') {
      const cleanDate = depositDate.trim();
      const userTransactions = data.transactions || [];
      const txIdx = userTransactions.findIndex(
        (t) => t.userId === id && (t.description?.toLowerCase().includes('initial') || t.category === 'Deposit') && t.type === 'credit'
      );

      if (txIdx !== -1) {
        userTransactions[txIdx].date = cleanDate;
        if (effectiveBalance !== null) {
          userTransactions[txIdx].amount = effectiveBalance;
        }
      } else {
        const userAcc = (data.accounts || []).find((a) => a.userId === id);
        const bal = effectiveBalance !== null ? effectiveBalance : (userAcc ? Number(userAcc.balance) || 0 : 0);
        const initTx = {
          id: `tx-${Date.now()}`,
          userId: id,
          userName: updatedUser.name,
          accountNumber: userAcc ? userAcc.accountNumber : '**** 0000',
          type: 'credit',
          description: 'Initial Account Deposit',
          amount: bal,
          date: cleanDate,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          category: 'Deposit',
          status: 'completed',
        };
        data.transactions = [initTx, ...userTransactions];
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
      return new Response(JSON.stringify({ message: 'User ID is required.' }), {
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

    if (!ctx.hasPerm('canDeleteUsers')) {
      return new Response(JSON.stringify({ message: 'You do not have permission to delete users.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUser = (data.users || []).find((u) => u.id === id);
    if (!targetUser) {
      return new Response(JSON.stringify({ message: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ctx.canAccessUser(targetUser)) {
      return new Response(JSON.stringify({ message: 'Access denied: You can only delete users you onboarded.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
