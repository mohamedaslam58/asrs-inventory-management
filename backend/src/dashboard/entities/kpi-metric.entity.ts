import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity('KpiMetrics')
export class KpiMetric {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ name: 'metric_key' })
  metricKey: string;

  @Column()
  label: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  prefix?: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}