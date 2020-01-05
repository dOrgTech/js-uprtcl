import { interfaces } from 'inversify';
import i18next from 'i18next';

import { MicroModule } from '../../orchestrator/micro.module';

export class i18nextBaseModule extends MicroModule {
  static id = Symbol('i18n-base-module');

  static types = {
    Translate: Symbol('i18n-function'),
    Service: Symbol('i18n-service')
  };

  async onLoad(container: interfaces.Container): Promise<void> {
    const translateFunction = await i18next.init({
      fallbackLng: 'en',
      ns: ['core'],
      defaultNS: 'core'
    });

    container.bind(i18nextBaseModule.types.Service).toConstantValue(i18next);
    container.bind(i18nextBaseModule.types.Translate).toConstantValue(translateFunction);
  }
}
