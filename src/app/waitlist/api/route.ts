import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple API route to store emails in a JSON file
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create directory to store waitlist emails
    const dataDir = path.join(process.cwd(), 'data');
    const waitlistFile = path.join(dataDir, 'waitlist.json');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Read existing waitlist data or create a new array
    let waitlist: string[] = [];
    if (fs.existsSync(waitlistFile)) {
      const data = fs.readFileSync(waitlistFile, 'utf8');
      waitlist = JSON.parse(data);
    }

    // Add the email if it doesn't already exist
    if (!waitlist.includes(email)) {
      waitlist.push(email);
      fs.writeFileSync(waitlistFile, JSON.stringify(waitlist, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing waitlist email:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
