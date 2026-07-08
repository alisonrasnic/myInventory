import { useState } from 'react';
export default function Taskbar() {
  return (
    <div class="p-4 bg-lavender1 text-center text-white" id="taskbar">
      <a class="p-1" href="/">Home</a>
      <a class="p-1" href="/options">Options</a>
      <button class="p-4 float-right"><img src="" /></button>
    </div>
  )
}
