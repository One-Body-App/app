import { configureStore } from '@reduxjs/toolkit';
const createSagaMiddleware = require('redux-saga').default;
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootSaga } from '../sagas/rootSaga';
import { rootReducer } from '../reducers/rootReducer';

// Configuration for Redux Persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // These slices of your state will not be persisted
  blacklist: ['general', 'prayer', 'auth'],
};

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Create a persisted reducer by wrapping your rootReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the Redux store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Redux-persist dispatches actions that are not serializable,
      // so we ignore them to prevent console warnings.
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }).concat(sagaMiddleware), // Add sagaMiddleware to the default middleware
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Create the persistor for Redux Persist
export const persistor = persistStore(store);

// Run the root saga after the store has been created
sagaMiddleware.run(rootSaga);
