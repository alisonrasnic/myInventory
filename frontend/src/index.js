import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import './main.css';

export default function MyButton() {
  const [num, setNum] = useState(0);

  return ( <button class="flex shrink-0 p-4 gap-x-4 font-medium max-w-sm mx-auto rounded-xl text-xl outline outline-black/5" onClick={() => setNum(num+1)}>I'm a button! {num}</button> )
};

const rootDom = document.getElementById('root');

const root = createRoot(rootDom);
root.render(<MyButton />);
