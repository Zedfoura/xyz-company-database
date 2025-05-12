import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, user, password, database } = body;
    
    console.log(`Attempting to connect to MySQL: ${user}@${host}:${port}/${database}`);

    // Create a connection pool
    const pool = mysql.createPool({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    try {
      // Test the connection
      console.log('Getting connection from pool...');
      const connection = await pool.getConnection();
      console.log('Connection successful, releasing connection');
      connection.release();

      // Store the connection pool in a global variable
      console.log('Storing connection pool in global variable');
      global.dbPool = pool;

      return NextResponse.json({ message: 'Connected successfully' });
    } catch (connError: any) {
      console.error('Failed to establish connection:', connError);
      return NextResponse.json(
        { message: `Connection error: ${connError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: `API error: ${error.message || 'Failed to connect to database'}` },
      { status: 500 }
    );
  }
} 