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
          <Route path="https://hopital-mce-site.onrender.com/api/" element={<Accueil />} />
          <Route path="https://hopital-mce-site.onrender.com/api/espace-patient" element={<EspacePatient />} />
          <Route path="https://hopital-mce-site.onrender.com/api/jobs" element={<Jobs />} />
          <Route path="https://hopital-mce-site.onrender.com/api/espace-medecin" element={<EspaceMedecin />} />
          <Route path="https://hopital-mce-site.onrender.com/admin" element={<AdminDashboard />} />
          <Route path="https://hopital-mce-site.onrender.com/api/contact" element={<Contact />} />
          <Route path="https://hopital-mce-site.onrender.com/api/info-patients" element={<InfoPatients />} />
          <Route path="https://hopital-mce-site.onrender.com/api/trouver-professionnel" element={<TrouverProfessionnel />} />
          <Route path="https://hopital-mce-site.onrender.com/api/messages-patient" element={<MessagesPatient />} />
          <Route path="https://hopital-mce-site.onrender.com/api/nos-specialites" element={<Specialties />} />
          <Route path="https://hopital-mce-site.onrender.com/api/checkup-center" element={<CheckupCenter />} />
          <Route path="https://hopital-mce-site.onrender.com/api/about" element={<About />} />
          <Route path="https://hopital-mce-site.onrender.com/api/support" element={<Support />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App