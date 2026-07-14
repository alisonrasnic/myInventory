import { useState } from 'react';

export default function Item(props) {
  const [id, setID] = useState(props.itemid ? props.itemid : -1);
  const [name, setName] = useState(props.name ? props.name : 'Unnamed Item');
  const [date, setDate] = useState(props.date ? props.date : new Date());
  const [useByDate, setUseByDate] = useState(props.useBy ? props.useBy : new Date());
  const [expiresByDate, setExpiresByDate] = useState(props.expiresBy ? props.expiresBy : new Date());
  const [addedDate, setAddedDate] = useState(props.added ? props.added : new Date());
  const [moreInfo, setMoreInfo] = useState(false);
  const [shouldRemove, setShouldRemove] = useState(false);

  const [editMode, setEditMode] = useState(false);
  function editClick() {
    setEditMode(!editMode);
  }

  function showMore() {
    setMoreInfo(!moreInfo);
  }

  function itemNameSet(e) {
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

  function pastUseBy() {
    return Date.now() >= Date.parse(useByDate);
  }

  function remove() {
    setShouldRemove(true);
  }

  const regularClasses = "rounded-xl content-center bg-lavender5 gap-x-4 text-center p-4 text-xl";
  const redClasses = "rounded-xl content-center animate-pulse bg-red-400 gap-x-4 text-center p-4 text-xl";

  return (
    <div className={pastUseBy() ? redClasses : regularClasses}>
      <div>{editMode ? <input className="text-center" id={name+"NameBox"} value={name} onKeyUp={(e)=>itemNameSet(e)} onChange={(e) => itemNameSet(e)}/> : name}</div>
      <div className="text-sm">Use by: { useByDate.toLocaleString() }</div>
     { moreInfo ? <div className="text-sm">Obtained: { addedDate.toLocaleString() } </div> : <></> }
      <div><button className="text-sm" onClick={() => showMore()}>...</button></div>
      <div> <button onClick={() => editClick()}>(Edit)</button></div>
      { pastUseBy() || moreInfo ? <button className="float-right" onClick={() => props.remove(id)}>X</button> : <></>}
    </div>
  );
};
