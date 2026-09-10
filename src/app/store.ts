import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { createReduxEnhancer } from '@sentry/react';
import { suppliersApi } from '../api/suppliersApi';
import { uiSlice } from '../features/ui/uiSlice';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [suppliersApi.reducerPath]: suppliersApi.reducer,
      [uiSlice.reducerPath]: uiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(suppliersApi.middleware),
    enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(createReduxEnhancer()),
  });

  setupListeners(store.dispatch);

  return store;
};

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
