import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import ItemList from './itemList';
import Item from './item';
import './main.css';

export default function App() {
  return ( 
    <div class="bg-lavender3">
      <ItemList /> 
      <p class="text-center">GPLv3 &#xA9; Alison Rasnic, 2026</p>
    </div>
  );
};

const rootDom = document.getElementById('root');

const root = createRoot(rootDom);
root.render(<App />);
