import { NextResponse } from 'next/server';

// Stable v8.9 logic (438e07c8)
const BITHOMP_KEY = '95b64250-f24f-4654-9b4b-b155a3a6867b';
const XAMAN_KEY = '88e5dad9-2503-455b-8777-628f8007a82c';
const XAMAN_SECRET = 'b09b8426-c2cc-491b-872e-06579b7654a8';

export async function POST(req) {
  try {
    const data = await req.json();
    if (!data) {
      throw new Error('Invalid request body');
    }
    return new Response(JSON.stringify({
      status: 'success',
      version: '8.9',
      logic: '438e07c8',
      keys: {
        bithomp: BITHOMP_KEY,
        xaman: { key: XAMAN_KEY, secret: XAMAN_SECRET }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}