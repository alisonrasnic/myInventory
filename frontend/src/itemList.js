import { useState } from 'react';
import Item from './item';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('Items');
  const [editItems, setEditItems] = useState(false);
  for (let i = 0; i < 5; i++) {
    var date = new Date("December 31, 2020 12:00:00");
    items[i] = <li class="m-2"><Item name={"Cabbage " + i} useBy={date}/></li>
  }

  function editListName(e) {
    setEditItems(!editItems); 
  }

  function inputName(e) {
    if (!e) return;
    if (e instanceof KeyboardEvent) {
      if (e.key === "Enter" || e.key === "Escape") {
        editClick();
        e.preventDefault();
        return;
      }
    }
    setName(e.target.value);
  }

  return (
    <ul class="bg-lavender4 mx-auto rounded-xl w-1/2 h-1/2 content-center items-center shrink-0 p-6">
      <li class="bg-lavender4 shrink-0 items-center mx-auto text-center text-xl p-4">
        { editItems ? <input class="text-center" value={name} onChange={(e)=>inputName(e)}></input> : name }
        <button class="float-right" onClick={()=>editListName()}>.</button>
      </li>
      { items }
    </ul>
  )
};
