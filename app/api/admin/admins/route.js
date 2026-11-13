import { getBankData, saveBankData, normalizeAdminPermissions } from '../../../../lib/db.js';
import { requireSuperAdmin, hashPassword } from '../../../../lib/security.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Super Admin access required.' }), {
        status: auth.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const allUsers = data.users || [];
    const allAccounts = data.accounts || [];

    const admins = allUsers
      .filter((u) => u.role === 'admin')
      .map((adm) => {
        const onboardedUsers = allUsers
          .filter((u) => u.role !== 'admin' && u.role !== 'superadmin' && u.createdByAdminId === adm.id)
          .map((u) => {
            const uAccounts = allAccounts.filter((a) => a.userId === u.id);
            const uBalance = uAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              status: u.status || 'active',
              createdAt: u.createdAt || '',
              totalBalance: uBalance,
            };
          });

        const totalManagedBalance = onboardedUsers.reduce((sum, u) => sum + u.totalBalance, 0);

        return {
          id: adm.id,
          name: adm.name,
          email: adm.email,
          role: 'admin',
          status: adm.status || 'active',
          createdAt: adm.createdAt || '',
          adminPermissions: normalizeAdminPermissions(adm.adminPermissions),
          usersCount: onboardedUsers.length,
          totalManagedBalance,
          onboardedUsers,
        };
      });

    return new Response(JSON.stringify({ admins }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Error fetching admins:', err);
    return new Response(JSON.stringify({ message: 'Failed to fetch admins.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Super Admin access required.' }), {
        status: auth.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, email, password, status, adminPermissions } = body;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ message: 'Name, email, and password are required to onboard an admin.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (envAdminEmail && normalizedEmail === envAdminEmail) {
      return new Response(JSON.stringify({ message: 'This email is reserved for the Super Administrator.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const existing = (data.users || []).find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (existing) {
      return new Response(JSON.stringify({ message: 'An account with this email already exists.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminId = `admin-${Date.now()}`;
    const hashedPassword = await hashPassword(password.trim());

    const newAdmin = {
      id: adminId,
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      twoFactorCode: '',
      role: 'admin',
      status: status ? String(status).toLowerCase() : 'active',
      phone: '',
      address: '',
      createdAt: new Date().toISOString().split('T')[0],
      tokenVersion: 1,
      createdByAdminId: auth.session.id || 'admin-1',
      createdByAdminName: auth.session.name || 'Super Administrator',
      adminPermissions: normalizeAdminPermissions(adminPermissions),
      allowedPages: [],
      lockedPages: [],
    };

    data.users = [...(data.users || []), newAdmin];
    await saveBankData(data);

    return new Response(
      JSON.stringify({
        admin: {
          id: newAdmin.id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          status: newAdmin.status,
          createdAt: newAdmin.createdAt,
          adminPermissions: newAdmin.adminPermissions,
          usersCount: 0,
          totalManagedBalance: 0,
          onboardedUsers: [],
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error onboarding admin:', err);
    return new Response(JSON.stringify({ message: 'Failed to onboard admin.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Super Admin access required.' }), {
        status: auth.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { id, name, email, password, status, adminPermissions, forceLogout } = body;

    if (!id) {
      return new Response(JSON.stringify({ message: 'Admin ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const adminIndex = (data.users || []).findIndex((u) => u.id === id && u.role === 'admin');
    if (adminIndex === -1) {
      return new Response(JSON.stringify({ message: 'Admin not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const current = data.users[adminIndex];

    if (email && email.trim().toLowerCase() !== current.email.toLowerCase()) {
      const duplicate = (data.users || []).find(
        (u) => u.id !== id && u.email?.toLowerCase() === email.trim().toLowerCase()
      );
      if (duplicate) {
        return new Response(JSON.stringify({ message: 'Another account already uses this email.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    let newPassword = current.password;
    let passwordChanged = false;
    if (password !== undefined && password !== '' && !password.startsWith('pbkdf2:')) {
      newPassword = await hashPassword(password.trim());
      passwordChanged = true;
    }

    const updatedStatus = status !== undefined ? String(status).trim().toLowerCase() : current.status;
    const isRestricting = ['blocked', 'suspended', 'inactive'].includes(updatedStatus);
    const statusChanged = status !== undefined && updatedStatus !== current.status;

    let tokenVersion = Number(current.tokenVersion) || 1;
    if (passwordChanged || forceLogout === true || (statusChanged && isRestricting)) {
      tokenVersion += 1;
    }

    const updatedAdmin = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      email: email !== undefined ? email.trim() : current.email,
      password: newPassword,
      status: updatedStatus,
      adminPermissions:
        adminPermissions !== undefined
          ? normalizeAdminPermissions(adminPermissions)
          : normalizeAdminPermissions(current.adminPermissions),
      tokenVersion,
    };

    data.users[adminIndex] = updatedAdmin;

    // If admin's name changed, update createdByAdminName on all users they onboarded
    if (name !== undefined && name.trim() !== current.name) {
      data.users = data.users.map((u) => {
        if (u.createdByAdminId === id) {
          return { ...u, createdByAdminName: updatedAdmin.name };
        }
        return u;
      });
    }

    await saveBankData(data);

    return new Response(
      JSON.stringify({
        admin: {
          id: updatedAdmin.id,
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          status: updatedAdmin.status,
          createdAt: updatedAdmin.createdAt,
          adminPermissions: updatedAdmin.adminPermissions,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error updating admin:', err);
    return new Response(JSON.stringify({ message: 'Failed to update admin.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Super Admin access required.' }), {
        status: auth.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ message: 'Admin ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const targetAdmin = (data.users || []).find((u) => u.id === id && u.role === 'admin');
    if (!targetAdmin) {
      return new Response(JSON.stringify({ message: 'Admin not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reassign any client users onboarded by this deleted admin to Super Admin
    data.users = (data.users || [])
      .filter((u) => u.id !== id)
      .map((u) => {
        if (u.createdByAdminId === id) {
          return {
            ...u,
            createdByAdminId: 'admin-1',
            createdByAdminName: 'Super Administrator',
          };
        }
        return u;
      });

    await saveBankData(data);

    return new Response(JSON.stringify({ message: 'Admin removed successfully.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error deleting admin:', err);
    return new Response(JSON.stringify({ message: 'Failed to delete admin.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

