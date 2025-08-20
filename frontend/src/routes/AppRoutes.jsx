import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import InterviewSelection from '../pages/InterviewSelection.jsx'
import Interview from '../pages/Interview.jsx'  
import Score from '../pages/Score.jsx'

const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/interview-selection" element={<InterviewSelection/>} />
        <Route path="/interview/:id" element={<Interview/>} />
        <Route path="/interview/:id/score" element={<Score/>} />
    </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes