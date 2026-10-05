// create-asset-assignment.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssetAssignmentDto {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  itemId: number;

  @IsString()
  @IsNotEmpty()
  employee: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  warehouseId: number;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;
}