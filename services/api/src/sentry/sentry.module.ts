import { Module } from '@nestjs/common';
import { SentryModule as SentryNestModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [SentryNestModule.forRoot()],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class SentryModule {}
