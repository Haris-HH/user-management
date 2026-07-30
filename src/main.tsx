import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from './hooks/useTheme';
import { NavPositionProvider } from './hooks/useNavPosition';
import { Provider } from "react-redux";
import { store } from "./store/store";
import './index.css'
import App from './App.tsx'
import './i18n';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <NavPositionProvider>
      <CssBaseline />
      <BrowserRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </BrowserRouter>
    </NavPositionProvider>
  </ThemeProvider>
)
