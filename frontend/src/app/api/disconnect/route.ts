import { NextResponse } from 'next/server';

export async function POST() {
  try {
    if (global.dbPool) {
      await global.dbPool.end();
      global.dbPool = null;
    }
    return NextResponse.json({ message: 'Disconnected successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to disconnect from database' },
      { status: 500 }
    );
  }
} 