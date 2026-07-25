import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getJWT, hasJWT, getUserId } from './jwt';
import ItemList from './itemList';
import Item from './item';
import { useState } from 'react';
import Login from './login';
import { Logout } from './logout';
import { LoggedInRoute } from './loggedInRoute';
import { RecordView } from './recordView';
import Taskbar from './taskbar';
import './main.css';

export default function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addingButton, setAddingButton] = useState(false);

  const {
    data: records = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['recordItems'],
    queryFn: async () => {
      const jwt = getJWT();
      const userId = getUserId();
      const res = await fetch('http://localhost:8080/get_records', {
        method: 'POST', 
        mode:   'cors',
        headers: {
          "Content-Type": "application/json",
          "X-PINGOTHER": "pingpong",
        },
        body: "{\"auth\": { \"jwt\": \""+jwt+"\", \"userId\": \""+ userId +"\" }}"
      });

      if (!res.ok) throw "Huh";
      return res.json();
    }
  });

  function mapRecords(r) {
    return r.map(i => (
          <div name={i.id} key={i.id} className="m-2 p-2">{i.name} | {i.description} {i.created ? "Created at: {i.created}" : ""} <button name="goToRecord" id={i.id} onClick={goToRecord}>&gt;</button><button className="m-2 text-xl" onClick={(e) => { removeRecord(e, i.id); }} disabled={deleteMutation.isPending} >{ deleteMutation.isPending ? 'Deleting...' : 'Delete' }</button></div>
    ))
  }

  function goToRecord(e) {
    var senderId = e.target.id;
    navigate("/record?id=" + senderId);
  }

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const jwt = getJWT();
      const userId = getUserId();
      const res = await fetch('http://localhost:8080/delete_record', {
        method: 'DELETE', 
        mode:   'cors',
        headers: {
          "Content-Type": "application/json",
          "X-PINGOTHER": "pingpong",
        },
        body: "{\"id\": \""+id+"\", \"auth\": { \"jwt\": \""+jwt+"\", \"userId\": \""+ userId +"\" }}"
      });

      if (!res.ok) throw "Failed to delete";
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordItems'] });
    }
  });

  function removeRecord(e, id) {
    if (!confirm("Delete this record? (Will delete ALL exclusive items)")) {
      return;
    }

    var jwt = getJWT();
    var userId = getUserId();
    e.preventDefault();

    if (jwt === "" || userId == -1) return;

    deleteMutation.mutate(id);
  }

  function addRecordButton(e) {
    setAddingButton(true);
  }

  const addMutation = useMutation({
    mutationFn: async ({name, description}) => {
      const jwt = getJWT();
      const userId = getUserId();
      console.log(name + " | " + description);
      const res = await fetch('http://localhost:8080/add_record', {
        method: 'POST', 
        mode:   'cors',
        headers: {
          "Content-Type": "application/json",
          "X-PINGOTHER": "pingpong",
        },
        body: "{\"name\": \""+name+"\", \"description\": \"" + description + "\", \"auth\": { \"jwt\": \""+jwt+"\", \"userId\": \""+ userId +"\" }}"
      });

      if (!res.ok) throw "Failed to add";
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordItems'] });
    }
  });

  function postRecord(e) {
    setAddingButton(!addingButton);
    e.preventDefault();
    var jwt = getJWT();
    var userId = getUserId();
    if (!jwt || userId === -1) return;
    
    var name = document.getElementById("recordNameInput").value;
    var description = document.getElementById("recordDescriptionInput").value;

    console.log(name + " | " + description);
    name = name ? name : "...";
    description = description ? description : "...";

    addMutation.mutate({name, description});
  }

  if (isLoading) return <div className="bg-lavender3"><p>Loading records...</p></div>;
  if (isError) return <div className="bg-lavender3"><p>Could not load records: {error.message}. Please refresh or try again later.</p></div>;

  return ( 
    <div className="bg-lavender3">
      { mapRecords(records) }
      { addingButton ? 
          <div id="addButtonDiv">
            <input className="m-2 p-2" id="recordNameInput" placeholder="Record name"/>
            <input className="m-2 p-2" id="recordDescriptionInput" placeholder="Record description"/>
            <button className="text-xl" id="postRecordButton" onClick={postRecord}>+</button>
          </div> : 
          <div className="m-2 p-2 text-xl" id="add_record" ><button onClick={addRecordButton}>+</button></div> }
    </div>
  );
};

const rootDom = document.getElementById('root');

function saveJWT(jwt) {
  document.cookie = "auth="+jwt+";path=/";
}

function saveUserId(id) {
  document.cookie = "userId="+id+";path=/";
}

const queryClient = new QueryClient();

const root = createRoot(rootDom);
root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Taskbar />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/record" element={<RecordView />} />
        <Route element={<LoggedInRoute isLoggedIn={hasJWT} />}>
          <Route path="/login" element={<Login saveUserId={(id) => saveUserId(id)} saveJWT={(jwt) => saveJWT(jwt)}/>}/>
        </Route>
        <Route element={<LoggedInRoute isLoggedIn={() => { return !hasJWT;} } />}>
          <Route path="/logout" element={<Logout/>}/>
        </Route>

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
      <p className="fixed bottom-1 text-center">GPLv3 &#xA9; Alison Rasnic, 2026</p>
    </BrowserRouter>
  </QueryClientProvider>
);
