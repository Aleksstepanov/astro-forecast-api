import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 60 * 12,
      max: 1000,
      isGlobal: true,
    }),
  ],
})
export class AppCacheModule {}
