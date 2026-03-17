// import { Routes, Route, Link, useNavigate } from 'react-router-dom'
// import FormSelector from './pages/FormSelector'
// import FormBuilder from './pages/FormBuilder'
// import FormFiller from './pages/FormFiller'

// export default function App() {
//   const nav = useNavigate()
//   return (
//     <div className="container">
//       <div className="header">
//         <div className="brand">Field Forms Demo</div>
//         <div className="toolbar">
//           <button className="btn" onClick={()=>nav('/')}>Kérdőív választó</button>
//           <Link to="/builder" className="btn">Új kérdőív létrehozása</Link>
//         </div>
//       </div>
//       <Routes>
//         <Route path="/" element={<FormSelector />} />
//         <Route path="/builder" element={<FormBuilder />} />
//         <Route path="/fill/:id" element={<FormFiller />} />
//       </Routes>
//     </div>
//   )
// }

import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Start from './pages/Start'
import Surveys from './pages/Surveys'
import FormBuilder from './pages/FormBuilder'
import FormFiller from './pages/FormFiller'
import './styles.css'
import { removeLegacySingleTemplate } from './storage/formsLib'

import { useEffect } from 'react'

export default function App() {

  useEffect(() => { removeLegacySingleTemplate() }, [])

  const nav = useNavigate()
  return (
    <div className="container">
      <div className="header">
        <div className="brand" style={{cursor:'pointer'}} onClick={()=>nav('/')}>Felmérések</div>
        <div className="toolbar">
          {/* <Link to="/surveys" className="btn">Munka</Link> */}
          <Link to="/builder" className="btn">Szerkesztő</Link>
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/builder" element={<FormBuilder />} />
        <Route path="/fill/:id" element={<FormFiller />} />
      </Routes>
    </div>
  )
}


