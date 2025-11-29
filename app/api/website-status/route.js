import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const WEBSITE_STATUS_FILE = path.join(process.cwd(), 'websiteStatus.json');

// Initialize website status file if it doesn't exist
const initializeStatusFile = async () => {
  try {
    await fs.access(WEBSITE_STATUS_FILE);
  } catch (error) {
    // File does not exist, create it
    await fs.mkdir(path.dirname(WEBSITE_STATUS_FILE), { recursive: true });
    await fs.writeFile(WEBSITE_STATUS_FILE, JSON.stringify({ isOpen: true }, null, 2));
    console.log('websiteStatus.json initialized.');
  }
};

initializeStatusFile();

export async function GET() {
  try {
    const fileContents = await fs.readFile(WEBSITE_STATUS_FILE, 'utf8');
    const status = JSON.parse(fileContents);
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0', // Prevent caching
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
    await fs.writeFile(WEBSITE_STATUS_FILE, JSON.stringify(newStatus, null, 2));
    console.log(`Website status set to: ${isOpen}`);
    
    revalidatePath('/', 'layout');

    return new Response(JSON.stringify(newStatus), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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
