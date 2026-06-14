import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store }  from './app/store';
import { router } from './app/router';
import './styles/globals.css';
import { getSessionId } from './lib/session';

// Initialise guest session ID on app start
getSessionId();

// Listen for the custom logout event fired by the Axios interceptor
window.addEventListener('auth:logout', () => {
  store.dispatch({ type: 'auth/clearCredentials' });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
