import '@mantine/core/styles.css';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './index.css'
import Home from "./pages/Home/Home.tsx";
import MainLayout from "./pages/MainLayout.tsx";
import {ColorSchemeScript, MantineProvider} from "@mantine/core";
import Play from "./pages/Play/Play.tsx";
import SocketProvider from "./components/Socket/SocketProvider.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MantineProvider>
          <SocketProvider>
              <BrowserRouter>
                  <Routes>
                      <Route element={<MainLayout />}>
                          <Route index element={<Home />}/>
                          <Route path={"/:gameCode"} element={<Play />}/>
                      </Route>
                  </Routes>
              </BrowserRouter>
          </SocketProvider>
      </MantineProvider>
  </StrictMode>,
)


createRoot(document.getElementById('head')!).render(
    <>
        <ColorSchemeScript/>
    </>
)