import { useState } from 'react'
import './App.css'
import './components/typewriter.jsx'
import Typewriter from './components/typewriter';
import Input from './components/inputbox.jsx'


function App() {
  
  return (
    <>
    
      <div className = "C1"> 
        <div className="title"> 
          <Typewriter text="JobBot" speed={100} highlightWord='JobBot'/>
        </div> 

        <div className = "R1"> 
          <Input/>
        </div> 

      </div>


    </>
  )
}

export default App
