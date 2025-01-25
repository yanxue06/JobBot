import { useState } from 'react'
import './App.css'
import './components/typewriter.jsx'
import Typewriter from './components/typewriter'
import TextField from '@mui/material/TextField';

function App() {
  
  return (
    <>
    
      <div className = "C1"> 
        <div className="title"> 
          <Typewriter text="Hey! Welcome to JobBot" speed={100} highlightWord='JobBot'/>
        </div> 
        <TextField id="outlined-basic" label="Outlined" variant="outlined" />
        <div className = "R1"> </div> 
        <div className = "R2"> </div> 
        <div className = "R3"> </div> 
      </div>


    </>
  )
}

export default App
