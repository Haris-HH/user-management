import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from './hooks/useTheme';
import { Provider } from "react-redux";
import { store } from "./store/store";
import './index.css'
import App from './App.tsx'
import './i18n';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <CssBaseline />
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </ThemeProvider>
)
