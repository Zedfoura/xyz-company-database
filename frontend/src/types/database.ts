import { Pool } from 'mysql2/promise';

declare global {
  var dbPool: Pool | null;
} 