import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {createLogger} from 'redux-logger';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {rootSaga} from '../sagas/rootSaga';
import {rootReducer} from '../reducers/rootReducer';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['gernal', 'prayer'],
};
// creates the store
/* ------------- Redux Configuration ------------- */
const middleware = [];
const enhancers = [];

/* ------------- Saga Middleware ------------- */
const sagaMiddleware = createSagaMiddleware();
middleware.push(sagaMiddleware);

/* ------------- Assemble Middleware ------------- */
enhancers.push(applyMiddleware(...middleware));

const persistedReducer = persistReducer(persistConfig, rootReducer);
const composeEnhancers =
  (typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const store = createStore(
  persistedReducer,
  composeEnhancers(...enhancers),
);
export const persistor = persistStore(store);

// kick off root saga
sagaMiddleware.run(rootSaga);
