import { applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootSaga } from '../sagas/rootSaga';
import { rootReducer } from '../reducers/rootReducer';
import { configureStore } from '@reduxjs/toolkit';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['general', 'prayer', 'auth'],
};
// creates the store
/* ------------- Redux Configuration ------------- */
const middleware = [];

/* ------------- Saga Middleware ------------- */
const sagaMiddleware = createSagaMiddleware();
middleware.push(sagaMiddleware);

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware,
  devTools: process.env.NODE_ENV !== 'production',
});
export const persistor = persistStore(store);

// kick off root saga
sagaMiddleware.run(rootSaga);
