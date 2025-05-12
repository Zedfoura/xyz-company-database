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
      // Execute the query to get results
      const [rows] = await connection.query(query);
      
      // Better type checking for different result types
      if (Array.isArray(rows) && rows.length > 0) {
        // For result sets, columns can be determined from the first row
        const columns = Object.keys(rows[0] as Record<string, any>);
        return NextResponse.json({
          columns: columns,
          rows: rows
        });
      } else {
        // If no rows or not an array (like for INSERT), return empty columns and rows
        return NextResponse.json({
          columns: [],
          rows: []
        });
      }
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Query error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
} 