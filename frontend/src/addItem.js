import { useState } from 'react';

const AddItem = (props) => {
  const [moreOptions, setMoreOptions] = useState(false);

  function submit() {
    var name = document.getElementById('nameInput').value;
    var description = document.getElementById('descriptionInput').value;
    var useBy = document.getElementById('useByDateInput').value;
    var expiresBy = moreOptions ? document.getElementById('expiresByDateInput').value : useBy;

    var now = new Date();
    now.setMilliseconds(Date.now());
    props.additem(name, description, now, useBy, expiresBy);
  }

  return (
    <div className="rounded-xl content-center bg-lavender5 gap-x-4 text-center p-4 text-xl">
      <h1>
        <input className="text-center m-2"id="nameInput" placeholder="New Item" type="input"/><br/>
      </h1>
      <input id="descriptionInput" className="text-center m-2" placeholder="Description" type="input"/><br/>
      <label for="useByDateInput">Use-By:</label>
      <input id="useByDateInput" className="text-center m-2" type="datetime-local"/>

        {
          moreOptions ?
            <>
              <label for="expiresByDateInput">Expires By:</label>
              <input id="expiresByDateInput" className="text-center m-2" type="datetime-local"/>
            </> :
          <></>
        }

      <button className="p-2 m-2 text-sm" onClick={() => setMoreOptions(!moreOptions)}>More options...</button><br/>
      <button className="text-md p-2 m-2" onClick={submit}>Add</button>
      <button className="text-md p-2 m-2" onClick={props.cancel}>Cancel</button>
    </div>
  );
};
export default AddItem;
