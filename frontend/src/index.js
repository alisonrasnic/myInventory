import {useState} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import {createRoot} from 'react-dom/client';
import ItemList from './itemList';
import Item from './item';
import Taskbar from './taskbar';
import './main.css';

export default function App() {
  return ( 
    <div class="bg-lavender3">
      <ItemList /> 
    </div>
  );
};

const rootDom = document.getElementById('root');

const root = createRoot(rootDom);
root.render(
  <BrowserRouter>
    <Taskbar />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/home" element={<p1>Big chungus</p1>} />
    </Routes>
    <p class="fixed bottom-1 text-center">GPLv3 &#xA9; Alison Rasnic, 2026</p>
  </BrowserRouter>
);
