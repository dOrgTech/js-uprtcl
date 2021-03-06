// Required by inversify
import 'reflect-metadata';

export { MicroOrchestrator } from './orchestrator/micro-orchestrator';
export { ReduxStoreModule } from './modules/redux/redux-store.module';
export { ReduxModule } from './modules/redux/redux.module';
export { MicroModule } from './modules/micro.module';
export { ModuleProvider, moduleProvider } from './orchestrator/module-provider';

export {
  MicroOrchestratorTypes,
  Constructor,
  CustomElement,
  ModuleToLoad,
  ReduxTypes
} from './types';

/** Elements */
export { ModuleContainer, RequestDependencyEvent } from './elements/module-container';
export { moduleConnect, ConnectedElement } from './elements/mixins/module-connect.mixin';
export { reduxConnect, ReduxConnectedElement } from './elements/mixins/redux-connect.mixin';

/** Utils */
export { Logger, LogLevel } from './utils/logger';
