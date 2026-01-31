import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { Redis } from '@upstash/redis';

const WEBSITE_STATUS_FILE = path.join(process.cwd(), 'websiteStatus.json');

if (!globalThis.__WEBSITE_STATUS__) {
  globalThis.__WEBSITE_STATUS__ = { isOpen: true, updatedAt: new Date().toISOString() };
}

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
let redisClient = null;
if (hasRedis) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (e) {
    redisClient = null;
  }
}

const initializeStatusFile = async () => {
  try {
    await fs.access(WEBSITE_STATUS_FILE);
    const contents = await fs.readFile(WEBSITE_STATUS_FILE, 'utf8');
    const parsed = JSON.parse(contents || '{}');
    if (typeof parsed.isOpen === 'boolean') {
      globalThis.__WEBSITE_STATUS__ = {
        isOpen: parsed.isOpen,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (error) {
    try {
      await fs.mkdir(path.dirname(WEBSITE_STATUS_FILE), { recursive: true });
      const initial = { isOpen: true, updatedAt: new Date().toISOString() };
      await fs.writeFile(WEBSITE_STATUS_FILE, JSON.stringify(initial, null, 2));
      globalThis.__WEBSITE_STATUS__ = initial;
      console.log('websiteStatus.json initialized.');
    } catch (_) {
      
    }
  }
};

initializeStatusFile();

export async function GET() {
  try {
    let status = globalThis.__WEBSITE_STATUS__ || { isOpen: true };
    if (redisClient) {
      try {
        const raw = await redisClient.get('maintenance:status');
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (typeof parsed?.isOpen === 'boolean') {
            status = parsed;
          }
        }
      } catch (_) {
        // fall back to in-memory
      }
    } else {
      try {
        const fileContents = await fs.readFile(WEBSITE_STATUS_FILE, 'utf8');
        const fileStatus = JSON.parse(fileContents || '{}');
        if (typeof fileStatus?.isOpen === 'boolean') {
          status = fileStatus;
          globalThis.__WEBSITE_STATUS__ = status;
        }
      } catch (_) {
        // ignore file read errors
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
  const { isOpen } = await request.json();

  if (typeof isOpen !== 'boolean') {
    return new Response(JSON.stringify({ message: 'Invalid value for isOpen. Must be boolean.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    const newStatus = {
      isOpen,
      updatedAt: new Date().toISOString(),
    };
    globalThis.__WEBSITE_STATUS__ = newStatus;
    if (redisClient) {
      try {
        await redisClient.set('maintenance:status', JSON.stringify(newStatus));
      } catch (_) {
        // ignore redis errors
      }
    }
    try {
      await fs.writeFile(WEBSITE_STATUS_FILE, JSON.stringify(newStatus, null, 2));
    } catch (_) {
      
    }
    console.log(`Website status set to: ${isOpen}`);
    
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
