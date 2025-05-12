import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!global.dbPool) {
      return NextResponse.json(
        { message: 'No database connection' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { message: 'No query provided' },
        { status: 400 }
      );
    }

    const connection = await global.dbPool.getConnection();
    try {
      const [rows] = await connection.query(query);
      const [columns] = await connection.query('SHOW COLUMNS FROM ' + query.split('FROM')[1].split(' ')[1]);

      return NextResponse.json({
        columns: (columns as any[]).map(col => col.Field),
        rows: rows
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
} 