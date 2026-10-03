import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Warehouse')
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  city: string;
}