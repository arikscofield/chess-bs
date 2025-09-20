import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Route, Routes} from "react-router";
import './index.css'
import Home from "./pages/home/Home.tsx";
import Play from "./pages/play/Play.tsx";
import MainLayout from "./pages/MainLayout.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
          <Routes>
              <Route element={<MainLayout />}>
                  <Route index element={<Home />}/>
                  <Route path={"play"} element={<Play />}/>
              </Route>
          </Routes>
      </BrowserRouter>
  </StrictMode>,
)
