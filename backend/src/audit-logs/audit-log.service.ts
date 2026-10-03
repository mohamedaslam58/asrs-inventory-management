import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface AuditLogRow {
  id: number;
  time: string;
  user: string;
  action: string;
  detail: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(search?: string): Promise<AuditLogRow[]> {
    const filter = search ? search.trim() : null;

    return await this.dataSource.query(
      `
      SELECT 
        a.id,
        TO_CHAR(a."createdAt", 'YYYY-MM-DD HH24:MI') AS "time",
        COALESCE(u.email, 'System') AS "user",
        a.action AS "action",
        a.detail AS "detail"
      FROM "AuditLog" a
      LEFT JOIN "User" u ON u.id = a."userId"
      WHERE 
        ($1::text IS NULL OR 
         u.email ILIKE '%' || $1 || '%' OR 
         a.action ILIKE '%' || $1 || '%' OR 
         a.detail ILIKE '%' || $1 || '%')
      ORDER BY a."createdAt" DESC
      `,
      [filter]
    );
  }

  async log(userId: number | null, action: string, detail: string): Promise<void> {
    await this.dataSource.query(
      `
      INSERT INTO "AuditLog" ("userId", "action", "detail", "createdAt")
      VALUES ($1, $2, $3, NOW())
      `,
      [userId, action, detail]
    );
  }
}