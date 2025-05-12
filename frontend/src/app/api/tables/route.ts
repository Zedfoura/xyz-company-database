import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!global.dbPool) {
      return NextResponse.json(
        { message: 'No database connection' },
        { status: 400 }
      );
    }

    const connection = await global.dbPool.getConnection();
    try {
      // Get all tables
      const [tables] = await connection.query('SHOW TABLES');
      const results = [];

      // For each table, get its structure and sample data
      for (const table of tables as any[]) {
        const tableName = Object.values(table)[0];
        
        // Get table structure
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        
        // Get sample data (first 5 rows)
        const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 5`);
        
        results.push({
          table_name: tableName,
          columns: (columns as any[]).map(col => col.Field),
          rows: rows
        });
      }

      return NextResponse.json(results);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
} 