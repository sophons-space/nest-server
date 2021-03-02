import * as helmet from 'helmet';
import { StoreKeys } from '@common';
import { CoreModule } from '@modules';
import { getConfigs } from '@configs';
import { NestFactory } from '@nestjs/core';
import { getDatabase, getLogger, getRedis } from '@lib';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Pipe, Filter, Interceptor, StoreModule, StoreProvider } from '@sophons/nest-tools';

/**
 * Start and bind the IOC module and the Global Store
 */
export const createServer = async () => {
  /**
   * Initialize server application.
   */
  const app = await NestFactory.create(CoreModule, { cors: true });

  /**
   * `select(StoreModule).get`, just like a query, automatically searches for instances in each registration module.
   *
   * Here, we want to use a more restrictive retrieval mode.
   * so we pass the `{ strict: true }` option object as the second argument to the get() method.
   * You can then select a specific instance from the selected context.
   */
  const libStore: StoreProvider<StoreKeys> = app.select(StoreModule).get(StoreProvider, { strict: true });

  /**
   * Initialize the store.
   */
  const logger = await getLogger();
  const configs = await getConfigs();
  libStore.save('logger', await getLogger());
  libStore.save('configs', await getConfigs());
  libStore.save('redis', await getRedis(configs.redis));
  libStore.save('database', await getDatabase(configs.database));

  /**
   * Initialize the server application middleware and aop handler.
   */
  app.use(helmet());
  app.useGlobalInterceptors(new Interceptor.RequestId(logger));
  app.useGlobalPipes(new Pipe.ValidateDto());
  app.useGlobalFilters(new Filter.RequestError(logger));
  app.useGlobalInterceptors(new Interceptor.RequestLog(logger));
  app.useGlobalInterceptors(new Interceptor.RequestFormat());

  /**
   * Create swagger document.
   */
  const document = new DocumentBuilder().setTitle('server').build();
  SwaggerModule.setup('/doc', app, SwaggerModule.createDocument(app, document));

  await app.listen(configs.port);
  logger.info(`[${configs.appname}]: SERVER START WITH ${configs.env} - ${configs.port}`);
};
