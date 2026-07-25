import { useEffect } from 'react';
import { deleteJWT, deleteUserId } from './jwt';

function Logout(props) {
  useEffect( () => {
    deleteJWT();
    deleteUserId();
  }, []);
  return (
    <div className="m-2 p-2" id="logout">
      <h1>Signed out!</h1>
    </div>
  )
}

export {Logout};
