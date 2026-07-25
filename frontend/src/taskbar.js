import { useState } from 'react';
import { hasJWT } from './jwt';
export default function Taskbar() {
  return (
    <div class="p-4 bg-lavender1 text-center text-white" id="taskbar">
      <a class="p-1" href="/">Home</a>
      <a class="p-1" href="/options">Options</a>
      { hasJWT() ? <a class="p-1" href="/logout">Log-out</a> : <a class="p-1" href="/login">Login</a> }
      <button class="p-4 float-right"><img src="" /></button>
    </div>
  )
}
