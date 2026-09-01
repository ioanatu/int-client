import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { suppliersApi } from '../api/suppliersApi'
import { uiSlice } from '../features/ui/uiSlice'

/**
 * Builds a fresh store. Tests call this per test case so cached API data never leaks
 * between them; the app creates exactly one at startup (see `store` below).
 */
export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [suppliersApi.reducerPath]: suppliersApi.reducer,
      [uiSlice.reducerPath]: uiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(suppliersApi.middleware),
  })

  // Enables the `refetchOnReconnect` behaviour configured on the API slice.
  setupListeners(store.dispatch)

  return store
}

export const store = makeStore()

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
