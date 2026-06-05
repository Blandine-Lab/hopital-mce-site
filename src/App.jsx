// src/App.jsx
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Accueil from './pages/Accueil'
import AdminDashboard from './pages/AdminDashboard'
import Jobs from './pages/Jobs'
import EspacePatient from './pages/EspacePatient'
import EspaceMedecin from './pages/EspaceMedecin'
import Contact from './pages/Contact'
import TrouverProfessionnel from './pages/TrouverProfessionnel'
import InfoPatients from './pages/InfoPatients'
import MessagesPatient from './pages/MessagesPatient'
import Specialties from './pages/Specialties'
import CheckupCenter from './pages/CheckupCenter'
import About from './pages/About'
import Support from './pages/Support'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Accueil />} />
          <Route path="/espace-patient" element={<EspacePatient />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/espace-medecin" element={<EspaceMedecin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/info-patients" element={<InfoPatients />} />
          <Route path="/trouver-professionnel" element={<TrouverProfessionnel />} />
          <Route path="/messages-patient" element={<MessagesPatient />} />
          <Route path="/nos-specialites" element={<Specialties />} />
          <Route path="/checkup-center" element={<CheckupCenter />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App