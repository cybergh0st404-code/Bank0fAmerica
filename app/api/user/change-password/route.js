import { getBankData, saveBankData } from '../../../../lib/db.js';
import { verifyPassword, hashPassword, createSessionToken } from '../../../../lib/security.js';
import { requireUserWithRevocationCheck } from '../../../../lib/server-auth.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const auth = await requireUserWithRevocationCheck(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ message: auth.error || 'Unauthorized' }), {
        status: auth.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ message: 'Current password and new password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ message: 'New password must be at least 6 characters long.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return new Response(JSON.stringify({ message: 'New passwords do not match.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const userIndex = (data.users || []).findIndex((u) => u.id === auth.session.id);
    if (userIndex === -1) {
      return new Response(JSON.stringify({ message: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dbUser = data.users[userIndex];
    const passwordValid = await verifyPassword(currentPassword, dbUser.password);
    if (!passwordValid) {
      return new Response(JSON.stringify({ message: 'Incorrect current password.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const hashedNewPassword = await hashPassword(newPassword.trim());
    const newTokenVersion = (Number(dbUser.tokenVersion) || 1) + 1;

    data.users[userIndex] = {
      ...dbUser,
      password: hashedNewPassword,
      tokenVersion: newTokenVersion,
    };

    await saveBankData(data);

    // Issue updated session token for the current device so the user stays seamlessly signed in here
    const isProd = process.env.NODE_ENV === 'production';
    const newSessionToken = await createSessionToken({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      tokenVersion: newTokenVersion,
    });

    const cookieHeader = `session_token=${newSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}; ${isProd ? 'Secure;' : ''}`;

    return new Response(
      JSON.stringify({
        message: 'Password changed successfully. All other active sessions have been revoked.',
        tokenVersion: newTokenVersion,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (err) {
    console.error('Error changing user password:', err);
    return new Response(JSON.stringify({ message: 'Failed to update password.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
