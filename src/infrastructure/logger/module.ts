import { DynamicModule } from '@nestjs/common';

import { LoggerManager } from './manager';

export class LoggerModule {
  static forRoot(): DynamicModule {
    const manager = new LoggerManager().getFactoryProvider();

    return {
      global: true,
      exports: [manager],
      providers: [manager],
      module: LoggerModule,
    };
  }
}
