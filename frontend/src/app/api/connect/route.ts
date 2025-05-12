import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, user, password, database } = body;

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

    // Test the connection
    const connection = await pool.getConnection();
    connection.release();

    // Store the connection pool in a global variable or use a proper state management solution
    // For this example, we'll use a simple in-memory storage
    global.dbPool = pool;

    return NextResponse.json({ message: 'Connected successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to connect to database' },
      { status: 500 }
    );
  }
} 