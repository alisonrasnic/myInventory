import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import ItemList from './itemList';
import { getJWT, getUserId } from './jwt';

function RecordView(props) {
  const [params, setParams] = useSearchParams();
  const [name, setName] = useState('');

  useEffect(() => {
    let jwt = getJWT();
    let userId = getUserId();

    if (jwt === null) throw jwt;
    if (userId === null) throw userId;

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
        for (let i in value) {
          var r = value[i];
          if (r.id == params.get("id")) {
            setName(r.name);
          }
        }
      });
    });

  }, []);

  return (
    <ItemList name={name}/>
  )
}

export { RecordView }
