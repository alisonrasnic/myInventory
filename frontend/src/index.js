import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  const [records, setRecords] = useState();
  const [addingButton, setAddingButton] = useState(false);

  function goToRecord(e) {
    var senderId = e.target.id;
    navigate("/record?id=" + senderId);
  }

  function removeRecord(e, id) {
    if (!confirm("Delete this record? (Will delete ALL exclusive items)")) {
      return;
    }

    var jwt = getJWT();
    var userId = getUserId();
    e.preventDefault();

    if (jwt === "" || userId == -1) return;

    let fetchPromise = fetch('http://localhost:8080/delete_record', {
      method: 'DELETE', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: "{\"id\": \""+id+"\", \"auth\": { \"jwt\": \""+jwt+"\", \"userId\": \""+ userId +"\" }}"
    });

    fetchPromise
    .then( (res) => {
      if (!res.ok) throw res;

      var localRecords = records;
      setRecords();
    });
  }

  useEffect(() => {
    var jwt = getJWT();
    var userId = getUserId();
    if (jwt === "" || userId == -1) return;

    let fetchPromise = fetch('http://localhost:8080/get_records', {
      method: 'POST', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: "{\"auth\": { \"jwt\": \""+jwt+"\", \"userId\": \""+ userId +"\" }}"
    });

    fetchPromise
    .then( (res) => {
      if (!res.ok) throw res;
      res.json().then( (value) => {
        var localRecords = [];
        for (var i in value) {
          var r = value[i];
          localRecords.push(<div name={r.id} key={r.id} className="m-2 p-2">{r.name} | {r.description} {r.created ? "Created at: {r.created}" : ""} <button name="goToRecord" id={r.id} onClick={goToRecord}>&gt;</button><button className="m-2 text-xl" onClick={(e) => { removeRecord(e, r.id); }}>:</button></div>); 
        }
        setRecords(localRecords);
      });
    });
    
  }, []);

  function addRecordButton(e) {
    setAddingButton(true);
  }

  function postRecord(e) {
    var jwt = getJWT();
    var userId = getUserId();
    var name = document.getElementById("recordNameInput").value;
    var description = document.getElementById("recordDescriptionInput").value;
    var created = new Date();
    created.setMilliseconds(Date.now());

    e.preventDefault();

    if (jwt === "" || userId == -1) return;

    let fetchPromise = fetch('http://localhost:8080/add_record', {
      method: 'POST', 
      mode:   'cors',
      headers: {
        "Content-Type": "application/json",
        "X-PINGOTHER": "pingpong",
      },
      body: "{\"name\": \""+name+"\", \"description\": \""+description+"\", \"auth\": { \"jwt\": \""+jwt+"\", \"userId\": \""+ userId +"\" }}"
    });

    fetchPromise
    .then( (res) => {
      if (!res.ok) throw res;
      res.json().then( (value) => {
        var localRecords = records;
        localRecords.push(<div id={value} key={value} className="m-2 p-2">{name} | {description} {created ? "Created at: {r.created}" : ""} <button id="goToRecord" onClick={goToRecord}>&gt;</button></div>); 
        setRecords(localRecords);
      });
    });
  }

  return ( 
    <div class="bg-lavender3">
      { records }
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
