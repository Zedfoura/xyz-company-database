import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    if (!global.dbPool) {
      console.error('No database connection established');
      return NextResponse.json(
        { message: 'No database connection' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      console.error('No query provided');
      return NextResponse.json(
        { message: 'No query provided' },
        { status: 400 }
      );
    }

    console.log('Executing query:', query);

    const connection = await global.dbPool.getConnection();
    try {
      // Execute the query to get results
      const [rows] = await connection.query(query);
      
      console.log('Query result type:', typeof rows);
      console.log('Query result is array:', Array.isArray(rows));
      console.log('Query result length:', Array.isArray(rows) ? rows.length : 'N/A');
      
      if (rows && typeof rows === 'object') {
        // Handle INSERT, UPDATE, DELETE result
        if (!Array.isArray(rows) && 'affectedRows' in rows) {
          console.log('Query affected rows:', rows.affectedRows);
          return NextResponse.json({
            message: `Query executed successfully. ${rows.affectedRows} rows affected.`,
            columns: [],
            rows: []
          });
        }
        
        // Handle SELECT result
        if (Array.isArray(rows) && rows.length > 0) {
          // For result sets, columns can be determined from the first row
          const columns = Object.keys(rows[0] as Record<string, any>);
          console.log('Extracted columns:', columns);
          return NextResponse.json({
            columns: columns,
            rows: rows
          });
        }
      }
      
      // Empty result
      console.log('Empty result set');
      return NextResponse.json({
        columns: [],
        rows: []
      });
    } catch (innerError: any) {
      console.error('Database query error:', innerError);
      return NextResponse.json(
        { message: `Database query error: ${innerError.message}` },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: `API error: ${error.message || 'Failed to execute query'}` },
      { status: 500 }
    );
  }
} 