import { getBankData, saveBankData, normalizeAdminPermissions, resolveAdminContext } from '../../../../lib/db.js';
import { requireAdmin, hashPassword, verifyPassword, createSessionToken } from '../../../../lib/security.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const { currentPassword, newPassword, dismissOnly } = body || {};

    const data = await getBankData();
    const ctx = resolveAdminContext(auth, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminIndex = (data.users || []).findIndex(
      (u) =>
        (auth.session.id && u.id === auth.session.id) ||
        (auth.session.email && u.email?.toLowerCase() === auth.session.email.toLowerCase())
    );

    if (adminIndex === -1) {
      return new Response(JSON.stringify({ message: 'Administrator account not found in database.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentAdmin = data.users[adminIndex];

    if (dismissOnly === true) {
      const updatedPerms = normalizeAdminPermissions({
        ...(currentAdmin.adminPermissions || {}),
        mustChangePassword: false,
      });
      const updatedAdmin = {
        ...currentAdmin,
        adminPermissions: updatedPerms,
        mustChangePassword: false,
      };
      data.users[adminIndex] = updatedAdmin;
      await saveBankData(data);

      return new Response(
        JSON.stringify({
          message: 'Password prompt dismissed.',
          user: {
            id: updatedAdmin.id,
            name: updatedAdmin.name,
            email: updatedAdmin.email,
            role: updatedAdmin.role,
            adminPermissions: updatedPerms,
            mustChangePassword: false,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return new Response(
        JSON.stringify({ message: 'New password must be at least 6 characters long.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (currentPassword !== undefined && String(currentPassword).trim() !== '') {
      const isCurrentValid = await verifyPassword(String(currentPassword).trim(), currentAdmin.password);
      if (!isCurrentValid) {
        return new Response(
          JSON.stringify({ message: 'Current password is incorrect.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const hashedNewPassword = await hashPassword(String(newPassword).trim());
    const nextTokenVersion = (Number(currentAdmin.tokenVersion) || 1) + 1;
    const updatedPerms = normalizeAdminPermissions({
      ...(currentAdmin.adminPermissions || {}),
      mustChangePassword: false,
    });

    const updatedAdmin = {
      ...currentAdmin,
      password: hashedNewPassword,
      tokenVersion: nextTokenVersion,
      adminPermissions: updatedPerms,
      mustChangePassword: false,
    };

    data.users[adminIndex] = updatedAdmin;
    await saveBankData(data);

    const isProd = process.env.NODE_ENV === 'production';
    const newSessionToken = await createSessionToken({
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      tokenVersion: nextTokenVersion,
    });
    const cookieHeader = `session_token=${newSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}; ${isProd ? 'Secure;' : ''}`;

    return new Response(
      JSON.stringify({
        message: 'Password updated successfully.',
        user: {
          id: updatedAdmin.id,
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          adminPermissions: updatedPerms,
          mustChangePassword: false,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (err) {
    console.error('Error changing admin password:', err);
    return new Response(JSON.stringify({ message: 'Failed to update password.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
