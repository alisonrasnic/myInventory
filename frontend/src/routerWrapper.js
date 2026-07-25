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
import App from './index';
import './main.css';

function saveJWT(jwt) {
  document.cookie = "auth="+jwt+";path=/";
}

function saveUserId(id) {
  document.cookie = "userId="+id+";path=/";
}

export default function RouterWrapper() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(hasJWT());

  function handleLogin() {
    setLoggedIn(hasJWT());
    navigate("/", true);
  }
  
  function handleLogout() {
    setLoggedIn(false);
  }

  return (<>
      <Taskbar hasJWT={loggedIn}/>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/record" element={<RecordView />} />
        <Route element={<LoggedInRoute isLoggedIn={loggedIn} />}>
          <Route path="/login" element={
            <Login saveUserId={(id) => saveUserId(id)} saveJWT={(jwt) => { 
              saveJWT(jwt);
              handleLogin(); 
            }}>
            </Login>
          }/>
        </Route>
        <Route element={<LoggedInRoute isLoggedIn={!loggedIn} />}>
          <Route path="/logout" element={<Logout logoutCallback={handleLogout}/>}/>
        </Route>

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
      <p className="fixed bottom-1 text-center">GPLv3 &#xA9; Alison Rasnic, 2026</p>
    </>
  )
}
