import { useState, useEffect } from 'react';
import Item from './item';
import AddItem from './addItem';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('fridge1');
  const [editItems, setEditItems] = useState(false);
  const [addItem, setAddItem] = useState(false);

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

  function newItem(name, description, added, useBy, expiresBy) {
    let fetchPromise = fetch('http://localhost:8080/add_item', {
      method: 'POST', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: "{\"name\": \""+name+"\",\"description\": \""+description+"\",\"added\": \""+added.toJSON()+"\",\"useBy\": \""+useBy+"\",\"expiresBy\": \""+expiresBy+"\", \"recordID\": \""+"1\" }"
    });
    var itemID = -1;
    fetchPromise
    .then( (res) => res.json())
    .then( (data) => {
      itemID = data;
      console.log(itemID);
      var newItems = [...items];
      let item = <li className="m-2"><Item remove={removeItem} key={itemID} itemid={itemID} name={name} description={description} added={added} useBy={useBy} expiresBy={expiresBy}/></li>;
      newItems.push(item);
      setItems(newItems);
      setAddItem(false);
    });
  }

  function removeItem(id) {
    console.log(newItems);
    console.log(items);
    if (id === -1) {
      console.log("id was -1...");
      return; 
    }
    var newItems = [...items];
    newItems.filter(item => {
      console.log(item);
      console.log(item.props.children.key);
      console.log(id);
      return item.props.children.key !== id;
    });

    let fetchPromise = fetch('http://localhost:8080/remove_item', {
      method: 'DELETE', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: id
    });

    fetchPromise.then( () => {
      setItems(newItems);
    });
  }

  useEffect( () => {
    console.log("effect...");
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
      var newItems = [...items];

      for (let i = 0; i < 255; i++) {
        if (data[i] === null) continue;
        let itemd = data[i];
        let item = <li className="m-2"><Item remove={removeItem} key={itemd.id} itemid={itemd.id} name={itemd.name} added={itemd.added} useBy={itemd.useBy} expiresBy={itemd.expiresBy}/></li>;

        newItems.push(item);
      }

      console.log(newItems);
      setItems(newItems);
      console.log(items);
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
      { addItem ? 
        <li>
          <AddItem additem={(n, d, a, u, e) => { newItem(n,d,a,u,e) }} cancel={() => setAddItem(false)}/>
        </li> :
        <button className="text-center text-xl p-4" onClick={() => setAddItem(!addItem)}>Add Item</button>
      }
    </ul>
  )
};
