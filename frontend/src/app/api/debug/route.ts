import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Declare the global type without affecting existing declarations
// This is just for TypeScript, it won't affect runtime
declare global {
  // Using a var declaration instead of interface augmentation
  namespace NodeJS {
    interface Global {
      dbPool?: mysql.Pool;
    }
  }
}

export async function GET() {
  try {
    // Check if connection pool exists
    const hasPool = !!global.dbPool;
    
    let connectionTest: { success: boolean, error: string | null } = { success: false, error: null };
    let simpleQueryTest: { success: boolean, error: string | null, result: any } = { success: false, error: null, result: null };
    
    if (hasPool && global.dbPool) {
      try {
        // Test getting a connection
        const connection = await global.dbPool.getConnection();
        connectionTest.success = true;
        
        try {
          // Try a simple query
          const [rows] = await connection.query('SELECT 1 AS test');
          simpleQueryTest.success = true;
          simpleQueryTest.result = rows;
        } catch (queryError: any) {
          simpleQueryTest.error = queryError.message;
        } finally {
          connection.release();
        }
      } catch (connError: any) {
        connectionTest.error = connError.message;
      }
    }
    
    return NextResponse.json({
      serverTime: new Date().toISOString(),
      hasPool,
      connectionTest,
      simpleQueryTest,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        message: `Debug error: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 