import {createRoot} from 'react-dom/client';

export default function MyButton() {
  return ( <button>I'm a button!</button> )
};

const rootDom = document.getElementById('root');

const root = createRoot(rootDom);
root.render(<MyButton />);
