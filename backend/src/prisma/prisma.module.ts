import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // Making it global allows any module to inject PrismaService without re-importing PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}