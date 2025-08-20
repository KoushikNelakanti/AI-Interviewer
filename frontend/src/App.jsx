import { useContext, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { io } from 'socket.io-client';
import AppRoutes from './routes/AppRoutes.jsx'
import { useEffect } from 'react';
function App() {

  return <>
  <AppRoutes/>
  </>
}

export default App
