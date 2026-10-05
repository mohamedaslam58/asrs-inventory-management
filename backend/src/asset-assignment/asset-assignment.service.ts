import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetAssignment } from './entities/asset-assignment.entity.js';
import { CreateAssetAssignmentDto } from './dto/create-asset-assignment.dto.js';

export interface AssetAssignmentRow {
  id: number;
  tag: string;
  asset: string;
  employee: string;
  department: string;
  issued: string;
  status: 'Assigned' | 'Returned';
}

@Injectable()
export class AssetAssignmentService {
  constructor(
    @InjectRepository(AssetAssignment)
    private readonly repo: Repository<AssetAssignment>,
  ) {}

  async findAll(search?: string): Promise<AssetAssignmentRow[]> {
    let query = `
      SELECT 
        a.id,
        a.tag,
        i.name AS asset,
        a.employee,
        a.department,
        TO_CHAR(a."issuedAt", 'YYYY-MM-DD') AS issued,
        CASE 
          WHEN a."returnedAt" IS NOT NULL THEN 'Returned'
          ELSE 'Assigned'
        END AS status
      FROM "AssetAssignment" a
      LEFT JOIN "Item" i ON i.id = a."itemId"
    `;

    const params: any[] = [];
    if (search && search.trim() !== '') {
      query += ` WHERE a.tag ILIKE $1 OR i.name ILIKE $1 OR a.employee ILIKE $1 OR a.department ILIKE $1`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY a."issuedAt" DESC, a.id DESC`;

    return await this.repo.query(query, params);
  }

  async markAsReturned(id: number): Promise<{ success: boolean }> {
    const assignment = await this.repo.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Asset assignment #${id} not found`);
    }
    
    assignment.returnedAt = new Date();
    await this.repo.save(assignment);
    return { success: true };
  }

  async create(dto: CreateAssetAssignmentDto): Promise<AssetAssignment> {
    const itemId = Number(dto.itemId);
    const warehouseId = Number(dto.warehouseId);

    const newAssignment = this.repo.create({
      tag: dto.tag,
      itemId,
      employee: dto.employee,
      department: dto.department,
      warehouseId,
      issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : new Date(),
      returnedAt: null,
    } as Partial<AssetAssignment>);

    const savedAssignment = await this.repo.save(newAssignment);
    return Array.isArray(savedAssignment) ? savedAssignment[0] : savedAssignment;
  }
}