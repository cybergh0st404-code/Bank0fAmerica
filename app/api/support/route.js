import {
  getBankData,
  resolveAdminContext,
  getSupportChatForUser,
  saveSupportChatForUser,
  DEFAULT_CORPORATE_EMAIL,
  DEFAULT_ADVISOR_NAME,
} from '../../../lib/db.js';
import { getSessionFromRequest, verifyRequestOrigin } from '../../../lib/security.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatTimestampLabel() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const datePart = `${months[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}`;
  const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} • ${timePart}`;
}

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const markRead = searchParams.get('markRead'); // 'user' | 'admin'

    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    let targetUserId = session.id;

    if (isAdmin) {
      if (!requestedUserId) {
        return new Response(JSON.stringify({ message: 'userId is required for admin support lookup.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const data = await getBankData();
      const ctx = resolveAdminContext(session, data);
      if (!ctx.valid) {
        return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
          status: ctx.status || 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const targetUser = (data.users || []).find((u) => u.id === requestedUserId);
      if (!targetUser || !ctx.canAccessUser(targetUser)) {
        return new Response(JSON.stringify({ message: 'Forbidden: You do not have access to this user.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      targetUserId = targetUser.id;
    } else {
      targetUserId = session.id;
    }

    let chat = await getSupportChatForUser(targetUserId);

    if (markRead === 'user' && !isAdmin && chat.unreadByUser > 0) {
      const updatedMessages = chat.messages.map((m) =>
        m.sender === 'admin' ? { ...m, readByUser: true } : m
      );
      chat = await saveSupportChatForUser(targetUserId, { messages: updatedMessages });
    } else if (markRead === 'admin' && isAdmin && chat.unreadByAdmin > 0) {
      const updatedMessages = chat.messages.map((m) =>
        m.sender === 'user' ? { ...m, readByAdmin: true } : m
      );
      chat = await saveSupportChatForUser(targetUserId, { messages: updatedMessages });
    }

    return new Response(JSON.stringify({ supportChat: chat }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Error in GET /api/support:', err);
    return new Response(JSON.stringify({ message: 'Failed to load support chat.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const originCheck = verifyRequestOrigin(request);
    if (!originCheck.valid) {
      return new Response(JSON.stringify({ message: 'Forbidden: Invalid request origin.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, text, corporateEmail, advisorName } = body;

    if (!text || !String(text).trim()) {
      return new Response(JSON.stringify({ message: 'Message text is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    let targetUserId = session.id;
    let senderRole = 'user';
    let senderLabel = session.name || 'Client';

    if (isAdmin) {
      if (!userId) {
        return new Response(JSON.stringify({ message: 'userId is required when replying as admin.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const data = await getBankData();
      const ctx = resolveAdminContext(session, data);
      if (!ctx.valid) {
        return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
          status: ctx.status || 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const targetUser = (data.users || []).find((u) => u.id === userId);
      if (!targetUser || !ctx.canAccessUser(targetUser)) {
        return new Response(JSON.stringify({ message: 'Forbidden: You can only reply to users you onboarded.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      targetUserId = targetUser.id;
      senderRole = 'admin';
      senderLabel = advisorName?.trim() || DEFAULT_ADVISOR_NAME;
    }

    const currentChat = await getSupportChatForUser(targetUserId);
    const effectiveCorporateEmail =
      isAdmin && corporateEmail && String(corporateEmail).trim()
        ? String(corporateEmail).trim()
        : currentChat.corporateEmail || DEFAULT_CORPORATE_EMAIL;
    const effectiveAdvisorName =
      isAdmin && advisorName && String(advisorName).trim()
        ? String(advisorName).trim()
        : currentChat.advisorName || DEFAULT_ADVISOR_NAME;

    // Mark opposite party's messages as read when replying
    const updatedExisting = (currentChat.messages || []).map((m) => {
      if (isAdmin && m.sender === 'user') return { ...m, readByAdmin: true };
      if (!isAdmin && m.sender === 'admin') return { ...m, readByUser: true };
      return m;
    });

    const newMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: senderRole,
      senderName: isAdmin ? effectiveAdvisorName : senderLabel,
      corporateEmail: effectiveCorporateEmail,
      text: String(text).trim(),
      timestamp: formatTimestampLabel(),
      createdAt: Date.now(),
      readByAdmin: isAdmin ? true : false,
      readByUser: isAdmin ? false : true,
    };

    const savedChat = await saveSupportChatForUser(targetUserId, {
      corporateEmail: effectiveCorporateEmail,
      advisorName: effectiveAdvisorName,
      messages: [...updatedExisting, newMessage],
    });

    return new Response(JSON.stringify({ supportChat: savedChat, message: newMessage }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in POST /api/support:', err);
    return new Response(JSON.stringify({ message: 'Failed to send support message.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const originCheck = verifyRequestOrigin(request);
    if (!originCheck.valid) {
      return new Response(JSON.stringify({ message: 'Forbidden: Invalid request origin.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await getSessionFromRequest(request);
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
      return new Response(JSON.stringify({ message: 'Administrative access required.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, corporateEmail, advisorName, clearMessages } = body;

    if (!userId) {
      return new Response(JSON.stringify({ message: 'userId is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await getBankData();
    const ctx = resolveAdminContext(session, data);
    if (!ctx.valid) {
      return new Response(JSON.stringify({ message: ctx.error || 'Unauthorized' }), {
        status: ctx.status || 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetUser = (data.users || []).find((u) => u.id === userId);
    if (!targetUser || !ctx.canAccessUser(targetUser)) {
      return new Response(JSON.stringify({ message: 'Forbidden: You can only manage support settings for users you onboarded.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentChat = await getSupportChatForUser(userId);
    const updatedPayload = {
      corporateEmail:
        corporateEmail !== undefined && String(corporateEmail).trim() !== ''
          ? String(corporateEmail).trim()
          : currentChat.corporateEmail,
      advisorName:
        advisorName !== undefined && String(advisorName).trim() !== ''
          ? String(advisorName).trim()
          : currentChat.advisorName,
      messages: clearMessages ? [] : currentChat.messages,
    };

    const savedChat = await saveSupportChatForUser(userId, updatedPayload);

    return new Response(JSON.stringify({ supportChat: savedChat }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in PUT /api/support:', err);
    return new Response(JSON.stringify({ message: 'Failed to update support configuration.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
