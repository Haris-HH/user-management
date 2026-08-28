import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from './hooks/useTheme';
import { NavPositionProvider } from './hooks/useNavPosition';
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store";
import ConfirmationDialog from "./components/confirmation-dialog/ConfirmationDialog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './index.css'
import App from './App.tsx'
import './i18n';

/*
  PersistGate holds the first render until redux-persist has rehydrated the
  authUser slice. Without it the app renders one frame with `user: null`, and
  everything that gates on the permission tree - the dock menu and the route
  guards - would read "no permission" and bounce a legitimate user back to the
  home page on every hard refresh.
*/
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <NavPositionProvider>
      <CssBaseline />
      <BrowserRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <App />
          </PersistGate>
        </Provider>
      </BrowserRouter>
      <ConfirmationDialog />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        closeButton
        newestOnTop
      />
    </NavPositionProvider>
  </ThemeProvider>
)
