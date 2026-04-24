import '@mantine/core/styles.css';

// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './index.css'
import Home from "./pages/Home/Home.tsx";
import MainLayout from "./pages/MainLayout.tsx";
import {ColorSchemeScript, MantineProvider} from "@mantine/core";
import Game from "./pages/Game/Game.tsx";
import SocketProvider from "./components/context/SocketProvider.tsx";
import {AuthProvider} from "./components/context/AuthProvider.tsx";

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
      <MantineProvider>
          <AuthProvider>
              <SocketProvider>
                  <BrowserRouter>
                      <Routes>
                          <Route element={<MainLayout />}>
                              <Route index element={<Home />}/>
                              <Route path={"/:gameId"} element={<Game />}/>
                          </Route>
                      </Routes>
                  </BrowserRouter>
              </SocketProvider>
          </AuthProvider>
      </MantineProvider>
  // </StrictMode>,
)


createRoot(document.getElementById('head')!).render(
    <>
        <ColorSchemeScript/>
    </>
)