import '@mantine/core/styles.css';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './index.css'
import Home from "./pages/home/Home.tsx";
import MainLayout from "./pages/MainLayout.tsx";
import {ColorSchemeScript, MantineProvider} from "@mantine/core";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <MantineProvider>
          <BrowserRouter>
              <Routes>
                  <Route element={<MainLayout />}>
                      <Route index element={<Home />}/>
                      <Route path={"/:gameCode"} element={<Home />}/>
                  </Route>
              </Routes>
          </BrowserRouter>
      </MantineProvider>
  </StrictMode>,
)


createRoot(document.getElementById('head')!).render(
    <>
        <ColorSchemeScript/>
    </>
)