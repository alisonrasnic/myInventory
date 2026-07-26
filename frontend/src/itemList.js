import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Item from './item';
import AddItem from './addItem';
import { getJWT, getUserId } from './jwt';

export default function ItemList(props) {

  const [searchParams, setSearchParams] = useSearchParams();
  const recordId = searchParams.get("id");

  const queryClient = useQueryClient();
  const {
    data: items = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['itemsList', recordId],
    queryFn: async () => {
      const jwt = getJWT();
      const userId = getUserId();
      const res = await fetch('http://localhost:8080/get_items', {
        method: 'POST', 
        mode:   'cors',
        headers: {
          "Content-Type": "application/json",
          "X-PINGOTHER": "pingpong",
        },
        body: JSON.stringify({ id: recordId, auth: { jwt: jwt, userId: userId }})
      });

      if (!res.ok) throw "Bad request";
      return res.json();
    },
    enabled: !!recordId,
    select: (data) => data.filter(item => item !== null)
  });

  function mapItems(itemsList) {
    console.log(itemsList);
    if (itemsList.length === 0) return <></>;
    return itemsList.map( itemd => (<li className="m-2"><Item remove={removeItem} key={itemd.id} itemid={itemd.id} name={itemd.name} added={itemd.added} useBy={itemd.useBy} expiresBy={itemd.expiresBy}/></li>));
  }
  
  const [name, setName] = useState(props.name ? props.name : 'fridge1');
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

  const addMutation = useMutation({
    mutationFn: async ({name, description, added, useBy, expiresBy}) => {
      const jwt = getJWT();
      const userId = getUserId();
      const res = await fetch('http://localhost:8080/add_item', {
        method: 'POST', 
        mode:   'cors',
        headers: {
          "Content-Type": "application/json",
          "X-PINGOTHER": "pingpong",
        },
        body: JSON.stringify({ name: name, description: description, added: added, useBy: useBy, expiresBy: expiresBy, recordID: recordId, auth: { jwt: jwt, userId: userId } })
      });

      if (!res.ok) throw "Failed to add";
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemsList'] });
    }
  });

  function newItem(name, description, added, useBy, expiresBy) {
    addMutation.mutate({name, description, added, useBy, expiresBy});
  }

  const deleteMutation = useMutation({
    mutationFn: async ({id}) => {
      const jwt = getJWT();
      const userId = getUserId();
      const res = await fetch('http://localhost:8080/delete_item', {
        method: 'DELETE', 
        mode:   'cors',
        headers: {
          "Content-Type": "application/json",
          "X-PINGOTHER": "pingpong",
        },
        body: JSON.stringify({ id: id, auth: { jwt: jwt, userId: userId } })
      });

      if (!res.ok) throw "Failed to delete";
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemsList'] });
    }
  });

  function removeItem(id) {
    if (id === -1) {
      console.log("id was -1...");
      return; 
    }

    deleteMutation.mutate({id});
  }

  if (isLoading) return <p>Loading items...</p>;
  if (isError) return <p>Error loading items. Please refresh and try again.</p>;

  return (
    <div className="flex justify-center items-center" id="itemListDiv">
      <ul className="bg-lavender4 mx-auto rounded-xl w-1/2 h-1/2 content-center items-center shrink-0 p-6">
        <li className="bg-lavender4 shrink-0 items-center mx-auto text-center text-xl p-4">
          { editItems ? <input className="text-center" value={props.name ? props.name : name} onChange={(e)=>inputName(e)}></input> : props.name }
          <button className="float-right" onClick={()=>editListName()}>.</button>
        </li>
        { mapItems(items) }

        { addItem ? 
          <li className="flex items-center justify-center">
            <AddItem additem={(n, d, a, u, e) => { newItem(n,d,a,u,e) }} cancel={() => setAddItem(false)}/>
          </li> :
          <li className="flex items-center justify-center">
            <button className="text-center text-xl p-4" onClick={() => setAddItem(!addItem)}>Add Item</button>
          </li>
        }
      </ul>
    </div>
  )
};
