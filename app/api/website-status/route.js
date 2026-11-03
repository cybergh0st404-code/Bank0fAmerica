import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../../lib/security.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WEBSITE_STATUS_FILE = path.join(process.cwd(), 'websiteStatus.json');

if (!globalThis.__WEBSITE_STATUS__) {
  globalThis.__WEBSITE_STATUS__ = { isOpen: true, showSpendingOverview: true, updatedAt: new Date().toISOString() };
}

const initializeStatusFile = async () => {
  try {
    await fs.access(WEBSITE_STATUS_FILE);
    const contents = await fs.readFile(WEBSITE_STATUS_FILE, 'utf8');
    const parsed = JSON.parse(contents || '{}');
    globalThis.__WEBSITE_STATUS__ = {
      isOpen: typeof parsed.isOpen === 'boolean' ? parsed.isOpen : true,
      showSpendingOverview: typeof parsed.showSpendingOverview === 'boolean' ? parsed.showSpendingOverview : true,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(WEBSITE_STATUS_FILE), { recursive: true });
      const initial = { isOpen: true, showSpendingOverview: true, updatedAt: new Date().toISOString() };
      await fs.writeFile(WEBSITE_STATUS_FILE, JSON.stringify(initial, null, 2));
      globalThis.__WEBSITE_STATUS__ = initial;
      console.log('websiteStatus.json initialized.');
    } catch (_) { }
  }
};

initializeStatusFile();

export async function GET() {
  try {
    let status = { isOpen: true, showSpendingOverview: true, updatedAt: new Date().toISOString() };
    try {
      const fileContents = await fs.readFile(WEBSITE_STATUS_FILE, 'utf8');
      const fileStatus = JSON.parse(fileContents || '{}');
      status = {
        isOpen: typeof fileStatus.isOpen === 'boolean' ? fileStatus.isOpen : true,
        showSpendingOverview: typeof fileStatus.showSpendingOverview === 'boolean' ? fileStatus.showSpendingOverview : true,
        updatedAt: fileStatus.updatedAt || new Date().toISOString(),
      };
      globalThis.__WEBSITE_STATUS__ = status;
    } catch (_) {
      if (globalThis.__WEBSITE_STATUS__) {
        status = globalThis.__WEBSITE_STATUS__;
      }
    }

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Set-Cookie': `websiteIsOpen=${status.isOpen ? 'true' : 'false'}; Path=/; SameSite=Lax`,
      },
    });
  } catch (error) {
    console.error('Error reading website status:', error);
    return new Response(JSON.stringify({ message: 'Failed to retrieve website status' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
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
    const current = globalThis.__WEBSITE_STATUS__ || { isOpen: true, showSpendingOverview: true };

    const newIsOpen = typeof body.isOpen === 'boolean' ? body.isOpen : current.isOpen;
    const newShowSpending = typeof body.showSpendingOverview === 'boolean' ? body.showSpendingOverview : (typeof current.showSpendingOverview === 'boolean' ? current.showSpendingOverview : true);

    const newStatus = {
      isOpen: newIsOpen,
      showSpendingOverview: newShowSpending,
      updatedAt: new Date().toISOString(),
    };
    globalThis.__WEBSITE_STATUS__ = newStatus;

    try {
      await fs.writeFile(WEBSITE_STATUS_FILE, JSON.stringify(newStatus, null, 2));
    } catch (fsErr) {
      console.error('Error writing websiteStatus.json:', fsErr);
    }

    revalidatePath('/', 'layout');

    return new Response(JSON.stringify(newStatus), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': `websiteIsOpen=${newStatus.isOpen ? 'true' : 'false'}; Path=/; SameSite=Lax`,
      },
    });
  } catch (error) {
    console.error('Error writing website status:', error);
    return new Response(JSON.stringify({ message: 'Failed to update website status' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
