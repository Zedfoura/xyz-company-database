import { NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

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
    const { operation, table, data, where } = body;

    if (!operation || !table) {
      console.error('Missing required parameters');
      return NextResponse.json(
        { message: 'Missing required parameters: operation and table are required' },
        { status: 400 }
      );
    }

    console.log(`Executing ${operation} operation on ${table}`, { data, where });

    const connection = await global.dbPool.getConnection();
    try {
      let query = '';
      let params: any[] = [];
      let result;

      switch (operation.toLowerCase()) {
        case 'create':
          if (!data || Object.keys(data).length === 0) {
            throw new Error('Data is required for create operation');
          }
          
          const columns = Object.keys(data);
          const placeholders = columns.map(() => '?').join(', ');
          query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
          params = Object.values(data);
          
          [result] = await connection.query<ResultSetHeader>(query, params);
          
          // Fetch the newly created record
          if (result.insertId) {
            const [newRecord] = await connection.query<RowDataPacket[]>(
              `SELECT * FROM ${table} WHERE id = ? OR ${table}ID = ?`, 
              [result.insertId, result.insertId]
            );
            return NextResponse.json({
              message: `Record created successfully with ID: ${result.insertId}`,
              operation: 'create',
              table,
              affectedRows: result.affectedRows,
              insertId: result.insertId,
              record: newRecord
            });
          }
          
          return NextResponse.json({
            message: 'Record created successfully',
            operation: 'create',
            table,
            affectedRows: result.affectedRows,
            insertId: result.insertId
          });
          
        case 'read':
          if (!where) {
            // If no where clause, return all records (limited to 100)
            [result] = await connection.query<RowDataPacket[]>(`SELECT * FROM ${table} LIMIT 100`);
          } else {
            const whereConditions = Object.entries(where).map(([key, _]) => `${key} = ?`).join(' AND ');
            query = `SELECT * FROM ${table} WHERE ${whereConditions}`;
            params = Object.values(where);
            [result] = await connection.query<RowDataPacket[]>(query, params);
          }
          
          return NextResponse.json({
            operation: 'read',
            table,
            count: Array.isArray(result) ? result.length : 0,
            records: result
          });
          
        case 'update':
          if (!data || Object.keys(data).length === 0) {
            throw new Error('Data is required for update operation');
          }
          
          if (!where || Object.keys(where).length === 0) {
            throw new Error('Where clause is required for update operation');
          }
          
          const setValues = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const whereConditions = Object.entries(where).map(([key, _]) => `${key} = ?`).join(' AND ');
          
          query = `UPDATE ${table} SET ${setValues} WHERE ${whereConditions}`;
          params = [...Object.values(data), ...Object.values(where)];
          
          [result] = await connection.query<ResultSetHeader>(query, params);
          
          // Fetch the updated records
          const [updatedRecords] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM ${table} WHERE ${whereConditions}`, 
            Object.values(where)
          );
          
          return NextResponse.json({
            message: `${result.affectedRows} record(s) updated successfully`,
            operation: 'update',
            table,
            affectedRows: result.affectedRows,
            records: updatedRecords
          });
          
        case 'delete':
          if (!where || Object.keys(where).length === 0) {
            throw new Error('Where clause is required for delete operation');
          }
          
          // First, select the records that will be deleted
          const whereDeleteConditions = Object.entries(where).map(([key, _]) => `${key} = ?`).join(' AND ');
          const [recordsToDelete] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM ${table} WHERE ${whereDeleteConditions}`, 
            Object.values(where)
          );
          
          // Then perform the delete
          query = `DELETE FROM ${table} WHERE ${whereDeleteConditions}`;
          params = Object.values(where);
          
          [result] = await connection.query<ResultSetHeader>(query, params);
          
          return NextResponse.json({
            message: `${result.affectedRows} record(s) deleted successfully`,
            operation: 'delete',
            table,
            affectedRows: result.affectedRows,
            deletedRecords: recordsToDelete
          });
          
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (innerError: any) {
      console.error('Database operation error:', innerError);
      return NextResponse.json(
        { message: `Database operation error: ${innerError.message}` },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: `API error: ${error.message || 'Failed to execute operation'}` },
      { status: 500 }
    );
  }
} 