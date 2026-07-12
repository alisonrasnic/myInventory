import { useState, useEffect } from 'react';
import Item from './item';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('fridge1');
  const [editItems, setEditItems] = useState(false);

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

  function removeItem(name) {
    
  }

  useEffect( () => {
    let fetchPromise = fetch('http://localhost:8080/get_items', {
      method: 'POST', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: "{ \"name\": \""+name+"\" }"
    });

    fetchPromise
    .then( (res) => res.json())
    .then( (data) => {
      console.log(data);
      var items = [];

      for (let i = 0; i < 255; i++) {
        if (data[i] === null) continue;
        let itemd = data[i];
        let item = <li className="m-2"><Item remove={removeItem} name={itemd.name} added={itemd.added} useBy={itemd.useBy} expiresBy={itemd.expiresBy}/></li>;

        items.push(item);
      }
      setItems(items);
    })
    .catch( (err) => console.log(err.message));
  }, []);

  return (
    <ul className="bg-lavender4 mx-auto rounded-xl w-1/2 h-1/2 content-center items-center shrink-0 p-6">
      <li className="bg-lavender4 shrink-0 items-center mx-auto text-center text-xl p-4">
        { editItems ? <input className="text-center" value={name} onChange={(e)=>inputName(e)}></input> : name }
        <button className="float-right" onClick={()=>editListName()}>.</button>
      </li>
      { items }
    </ul>
  )
};
