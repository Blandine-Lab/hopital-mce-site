import React from "react";
import { useState, useEffect } from "react";

const API_BASE = "https://hopital-mce-site.onrender.com";

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("rdv");
    const [selectedPage, setSelectedPage] = useState("home");
    
    // États pour les données
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [events, setEvents] = useState([]);
    const [actualites, setActualites] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [etablissement, setEtablissement] = useState([]);
    const [partenaires, setPartenaires] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [calendarData, setCalendarData] = useState([]);
    const [stats, setStats] = useState({ total: { total: 0 }, perDay: [], perDoctor: [] });
    const [tarifs, setTarifs] = useState([]);
    const [paiements, setPaiements] = useState([]);
    const [pendingResults, setPendingResults] = useState([]);
    const [patients, setPatients] = useState([]);
    const [newsletterCount, setNewsletterCount] = useState(0);
    const [siteContent, setSiteContent] = useState({});
    const [footerContent, setFooterContent] = useState({});
    const [paymentConfig, setPaymentConfig] = useState({});
    
    // États pour les formulaires et modales
    const [showJobForm, setShowJobForm] = useState(false);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showSpecialtyForm, setShowSpecialtyForm] = useState(false);
    const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
    const [showPatientForm, setShowPatientForm] = useState(false);
    const [showActuForm, setShowActuForm] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [photoPreview, setPhotoPreview] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    
    // États pour l'édition des patients et médecins
    const [editingPatient, setEditingPatient] = useState(null);
    const [editingDoctor, setEditingDoctor] = useState(null);
    
    // Fonctions utilitaires
    function escapeHtml(str) {
        if (!str) return "";
        return str.replace(/[&<>]/g, m => m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;");
    }
    
    function showSuccess(message) {
        setSuccessMsg(message);
        setTimeout(() => setSuccessMsg(""), 3000);
    }
    
    // ========== CHARGEMENT DES DONNÉES ==========
    const loadAppointments = async () => {
        try {
            const res = await fetch(API_BASE + "/appointments?_=" + Date.now());
            const data = await res.json();
            setAppointments(data);
        } catch (err) { console.error(err); }
    };
    
    const loadDoctors = async () => {
        try {
            const res = await fetch(API_BASE + "/staff");
            const data = await res.json();
            setDoctors(data);
        } catch (err) { console.error(err); }
    };
    
    const loadEvents = async () => {
        try {
            const res = await fetch(API_BASE + "/events");
            const data = await res.json();
            setEvents(data);
        } catch (err) { console.error(err); }
    };
    
    const loadActualites = async () => {
        try {
            const res = await fetch(API_BASE + "/actualites");
            const data = await res.json();
            setActualites(data);
        } catch (err) { console.error(err); }
    };
    
    const loadSpecialties = async () => {
        try {
            const res = await fetch(API_BASE + "/specialties");
            const data = await res.json();
            setSpecialties(data);
        } catch (err) { console.error(err); }
    };
    
    const loadEtablissement = async () => {
        try {
            const res = await fetch(API_BASE + "/etablissement");
            const data = await res.json();
            setEtablissement(data);
        } catch (err) { console.error(err); }
    };
    
    const loadPartenaires = async () => {
        try {
            const res = await fetch(API_BASE + "/partenaires");
            const data = await res.json();
            setPartenaires(data);
        } catch (err) { console.error(err); }
    };
    
    const loadJobs = async () => {
        try {
            const res = await fetch(API_BASE + "/admin/jobs");
            const data = await res.json();
            setJobs(data);
        } catch (err) { console.error(err); }
    };
    
    const loadApplications = async () => {
        try {
            const res = await fetch(API_BASE + "/admin/applications");
            const data = await res.json();
            setApplications(data);
        } catch (err) { console.error(err); }
    };
    
    const loadAvailabilities = async () => {
        try {
            const res = await fetch(API_BASE + "/availabilities/calendar?_=" + Date.now());
            const data = await res.json();
            setAvailabilities(data);
            const grouped = {};
            data.forEach(item => {
                if (!grouped[item.date]) grouped[item.date] = [];
                grouped[item.date].push(item);
            });
            const calArray = Object.keys(grouped).sort().map(date => ({ date, slots: grouped[date] }));
            setCalendarData(calArray);
        } catch (err) { console.error(err); }
    };
    
    const loadTarifs = async () => {
        try {
            const res = await fetch(API_BASE + "/tarifs");
            const data = await res.json();
            setTarifs(data);
        } catch (err) { console.error(err); }
    };
    
    const loadPaiements = async () => {
        try {
            const res = await fetch(API_BASE + "/paiements");
            const data = await res.json();
            setPaiements(data);
        } catch (err) { console.error(err); }
    };
    
    const loadPendingResults = async () => {
        try {
            const res = await fetch(API_BASE + "/admin/results/pending");
            const data = await res.json();
            setPendingResults(data);
        } catch (err) { console.error(err); }
    };
    
    const loadPatients = async () => {
        try {
            const res = await fetch(API_BASE + "/admin/patients");
            const data = await res.json();
            setPatients(data);
        } catch (err) { console.error(err); }
    };
    
    const loadNewsletterStats = async () => {
        try {
            const res = await fetch(API_BASE + "/newsletter/count");
            const data = await res.json();
            setNewsletterCount(data.count || 0);
        } catch (err) { console.error(err); }
    };
    
    const loadStats = async () => {
        try {
            const res = await fetch(API_BASE + "/stats");
            const data = await res.json();
            setStats(data);
        } catch (err) { console.error(err); }
    };
    
    const loadFooterContent = async () => {
        try {
            const res = await fetch(API_BASE + "/site-content/footer");
            const data = await res.json();
            setFooterContent(data);
        } catch (err) { console.error(err); }
    };
    
    const loadPaymentConfig = async () => {
        try {
            const res = await fetch(API_BASE + "/paiement/config");
            const data = await res.json();
            setPaymentConfig(data);
        } catch (err) { console.error(err); }
    };
    
    const loadContent = async (page) => {
        try {
            const res = await fetch(API_BASE + "/site-content/" + page);
            const data = await res.json();
            setSiteContent(data);
        } catch (err) { console.error(err); }
    };
    
    const loadDoctorsForSelect = async () => {
        try {
            const res = await fetch(API_BASE + "/staff");
            const staff = await res.json();
            setDoctors(staff);
        } catch (err) { console.error(err); }
    };
    
    const loadSlots = async (doctorId, date) => {
        if (!doctorId || !date) { setAvailableSlots([]); return; }
        try {
            const res = await fetch(`${API_BASE}/availability/${doctorId}/${date}`);
            const slots = await res.json();
            setAvailableSlots(slots);
        } catch (err) { console.error(err); setAvailableSlots([]); }
    };
    
    // ========== SUPPRESSIONS ==========
    const deleteAppointment = async (id) => {
        if (!confirm("Supprimer ce rendez-vous ?")) return;
        try {
            const res = await fetch(API_BASE + "https://hopital-mce-site.onrender.com/appointments/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Rendez-vous supprimé"); loadAppointments(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteDoctor = async (id) => {
        if (!confirm("Supprimer ce médecin ?")) return;
        try {
            const res = await fetch(API_BASE + "/staff/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Médecin supprimé"); loadDoctors(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteEvent = async (id) => {
        if (!confirm("Supprimer cet événement ?")) return;
        try {
            const res = await fetch(API_BASE + "/events/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Événement supprimé"); loadEvents(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteActualite = async (id) => {
        if (!confirm("Supprimer cette actualité ?")) return;
        try {
            const res = await fetch(API_BASE + "/actualites/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Actualité supprimée"); loadActualites(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteSpecialty = async (id) => {
        if (!confirm("Supprimer cette spécialité ?")) return;
        try {
            const res = await fetch(API_BASE + "/specialties/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Spécialité supprimée"); loadSpecialties(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteJob = async (id) => {
        if (!confirm("Supprimer cette offre ?")) return;
        try {
            const res = await fetch(API_BASE + "/admin/jobs/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Offre supprimée"); loadJobs(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteTarif = async (id) => {
        if (!confirm("Supprimer ce tarif ?")) return;
        try {
            const res = await fetch(API_BASE + "/tarifs/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Tarif supprimé"); loadTarifs(); }
        } catch (err) { console.error(err); }
    };
    
    const deleteAvailability = async (id) => {
        if (!confirm("Supprimer ce créneau ?")) return;
        try {
            const res = await fetch(API_BASE + "/availabilities/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Créneau supprimé"); loadAvailabilities(); }
        } catch (err) { console.error(err); }
    };
    
    const deletePatient = async (id) => {
        if (!confirm("Supprimer ce patient ?")) return;
        try {
            const res = await fetch(API_BASE + "/admin/patients/" + id, { method: "DELETE" });
            if (res.ok) { showSuccess("Patient supprimé"); loadPatients(); }
        } catch (err) { console.error(err); }
    };
    
    // ========== VALIDATION TÉLÉCONSULTATION ==========
    const validateTeleconsultation = async (id) => {
        if (!confirm("Valider cette téléconsultation ? Le patient et le médecin pourront alors rejoindre la visio.")) return;
        try {
            const res = await fetch(API_BASE + "/admin/appointments/" + id + "/validate-teleconsultation", { method: "PUT" });
            if (res.ok) {
                showSuccess("Téléconsultation validée");
                loadAppointments();
            } else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    // ========== AJOUTS / MODIFICATIONS ==========
    const addJob = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            title: formData.get("title"),
            department: formData.get("department"),
            contract_type: formData.get("contract_type"),
            location: formData.get("location"),
            description: formData.get("description"),
            requirements: formData.get("requirements"),
            salary_range: formData.get("salary_range"),
            active: formData.get("active") === "on" ? 1 : 0
        };
        try {
            const res = await fetch(API_BASE + "/admin/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (res.ok) { showSuccess("Offre ajoutée"); loadJobs(); setShowJobForm(false); e.target.reset(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const addEvent = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            title: formData.get("title"),
            description: formData.get("description"),
            active: formData.get("active") === "on" ? 1 : 0
        };
        try {
            const res = await fetch(API_BASE + "/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (res.ok) { showSuccess("Événement ajouté"); loadEvents(); setShowEventForm(false); e.target.reset(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const addSpecialty = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get("name"),
            description: formData.get("description"),
            ordre: parseInt(formData.get("ordre")) || 0,
            active: formData.get("active") === "on" ? 1 : 0
        };
        try {
            const res = await fetch(API_BASE + "/specialties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (res.ok) { showSuccess("Spécialité ajoutée"); loadSpecialties(); setShowSpecialtyForm(false); e.target.reset(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const addPatient = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            password: formData.get("password")
        };
        try {
            const res = await fetch(API_BASE + "/admin/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (res.ok) { showSuccess("Patient ajouté"); loadPatients(); setShowPatientForm(false); e.target.reset(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const addActualite = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const titre = formData.get("titre");
        const description = formData.get("description");
        const ordre = parseInt(formData.get("ordre")) || 0;
        const active = formData.get("active") === "on" ? 1 : 0;
        const imageFile = formData.get("imageFile");
        let image_url = null;
        if (imageFile && imageFile.size > 0) {
            const fd = new FormData();
            fd.append("image", imageFile);
            try {
                const uploadRes = await fetch(API_BASE + "/upload", { method: "POST", body: fd });
                const uploadData = await uploadRes.json();
                if (uploadData.imageUrl) image_url = uploadData.imageUrl;
                else { alert("Erreur upload"); return; }
            } catch (err) { alert("Erreur réseau upload"); return; }
        }
        const payload = { titre, description, image_url, ordre, active };
        try {
            const res = await fetch(API_BASE + "/actualites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (res.ok) { showSuccess("Actualité ajoutée"); loadActualites(); setShowActuForm(false); e.target.reset(); setImagePreview(""); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const addAvailability = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const doctor_id = formData.get("doctor_id");
        const date = formData.get("date");
        const time_slot = formData.get("start_time") + "-" + formData.get("end_time");
        try {
            const res = await fetch(API_BASE + "/availabilities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctor_id, date, time_slot }) });
            if (res.ok) { showSuccess("Créneau ajouté"); loadAvailabilities(); setShowAvailabilityForm(false); e.target.reset(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const addTarif = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            service: formData.get("service"),
            prestation: formData.get("prestation"),
            prix: formData.get("prix"),
            description: formData.get("description"),
            ordre: parseInt(formData.get("ordre")) || 0,
            active: formData.get("active") === "on" ? 1 : 0
        };
        try {
            const res = await fetch(API_BASE + "/tarifs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            if (res.ok) { showSuccess("Tarif ajouté"); loadTarifs(); e.target.reset(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const saveContent = async () => {
        try {
            const res = await fetch(API_BASE + "/site-content/" + selectedPage, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(siteContent) });
            if (res.ok) alert("Contenu mis à jour !");
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const saveFooter = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            etablissement: formData.get("etablissement"),
            adresse: formData.get("adresse"),
            telephone: formData.get("telephone"),
            telephone2: formData.get("telephone2"),
            email: formData.get("email"),
            urgences: formData.get("urgences"),
            liens_aide: formData.get("liens_aide"),
            liens_entreprise: formData.get("liens_entreprise"),
            liens_soignants: formData.get("liens_soignants"),
            liens_specialistes: formData.get("liens_specialistes"),
            liens_recherches: formData.get("liens_recherches"),
            technologies: formData.get("technologies"),
            reseaux: formData.get("reseaux"),
            copyright: formData.get("copyright")
        };
        try {
            const res = await fetch(API_BASE + "/site-content/footer", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
            if (res.ok) { showSuccess("Footer mis à jour !"); loadFooterContent(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const savePaymentConfig = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            iban: formData.get("iban"),
            bic: formData.get("bic"),
            titulaire: formData.get("titulaire"),
            mobile_money_info: formData.get("mobile_money_info"),
            carte_info: formData.get("carte_info")
        };
        try {
            const res = await fetch(API_BASE + "/paiement/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
            if (res.ok) { showSuccess("Configuration mise à jour"); loadPaymentConfig(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const sendNewsletter = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const subject = formData.get("subject");
        const content = formData.get("content");
        try {
            const res = await fetch(API_BASE + "/newsletter/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, content }) });
            const data = await res.json();
            if (res.ok) alert("Envoi terminé : " + data.successCount + " emails réussis.");
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const exportEmails = async () => {
        try {
            const res = await fetch(API_BASE + "/newsletter/export");
            const data = await res.json();
            const blob = new Blob([data.emails.join("\n")], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "abonnes_newsletter.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
    };
    
    const publishResult = async (id) => {
        if (!confirm("Publier ce résultat ?")) return;
        try {
            const res = await fetch(API_BASE + "/admin/results/" + id + "/publish", { method: "PUT" });
            if (res.ok) { showSuccess("Résultat publié"); loadPendingResults(); }
        } catch (err) { console.error(err); }
    };
    
    const addResult = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patient_id = formData.get("patient_id");
        const type = formData.get("type");
        const description = formData.get("description");
        const file_url = formData.get("file_url");
        if (!patient_id || !type) { alert("Veuillez remplir les champs requis"); return; }
        try {
            const res = await fetch(API_BASE + "/admin/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id, type, description, file_url }) });
            if (res.ok) { showSuccess("Résultat ajouté"); e.target.reset(); loadPendingResults(); }
            else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    const markAppointmentAsViewed = async (id) => {
        try {
            const res = await fetch(API_BASE + "/admin/appointments/" + id + "/view", { method: "PUT" });
            if (res.ok) { showSuccess("Rendez-vous marqué comme vu"); loadAppointments(); }
        } catch (err) { console.error(err); }
    };
    
    // ========== ÉDITION PATIENT ==========
    const updatePatient = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            is_active: formData.get("is_active") === "on" ? 1 : 0,
            password: formData.get("password") || undefined
        };
        try {
            const res = await fetch(API_BASE + "/admin/patients/" + editingPatient.id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showSuccess("Patient mis à jour");
                loadPatients();
                setEditingPatient(null);
            } else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    // ========== ÉDITION MÉDECIN ==========
    const updateDoctor = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            full_name: formData.get("full_name"),
            profession: "Médecin",
            specialty: formData.get("specialty"),
            department: formData.get("department"),
            email: formData.get("email"),
            phone: formData.get("phone") || "",
            photo_url: editingDoctor.photo_url || null,
            telegram_chat_id: formData.get("telegram_chat_id") || null,
            is_active: formData.get("is_active") === "on" ? 1 : 0,
            password: formData.get("password") || undefined
        };
        try {
            const res = await fetch(API_BASE + "/staff/" + editingDoctor.id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showSuccess("Médecin mis à jour");
                loadDoctors();
                setEditingDoctor(null);
            } else alert("Erreur");
        } catch (err) { console.error(err); }
    };
    
    // ========== ONGLETS ==========
    const tabs = [
        { id: "rdv", label: "Rendez-vous" },
        { id: "calendar", label: "Calendrier" },
        { id: "applications", label: "Candidatures" },
        { id: "stats", label: "Statistiques" },
        { id: "jobs", label: "Offres d'emploi" },
        { id: "manage", label: "Disponibilités" },
        { id: "doctors", label: "Médecins" },
        { id: "events", label: "Événements" },
        { id: "content", label: "Contenu du site" },
        { id: "actualites", label: "Actualités" },
        { id: "specialties", label: "Spécialités" },
        { id: "etablissement", label: "Établissement" },
        { id: "partenaires", label: "Partenaires" },
        { id: "newsletter", label: "Newsletter" },
        { id: "footer", label: "Footer" },
        { id: "tarifs", label: "Tarifs" },
        { id: "caisse", label: "Caisse" },
        { id: "results", label: "Résultats labo" },
        { id: "patients", label: "Patients" }
    ];
    
    // Chargement initial
    useEffect(() => {
        loadAppointments();
        loadDoctors();
        loadEvents();
        loadActualites();
        loadSpecialties();
        loadEtablissement();
        loadPartenaires();
        loadJobs();
        loadApplications();
        loadAvailabilities();
        loadTarifs();
        loadPaiements();
        loadPatients();
        loadStats();
        loadFooterContent();
        loadPaymentConfig();
        loadNewsletterStats();
        loadPendingResults();
        loadContent("home");
        loadDoctorsForSelect();
    }, []);
    
    // Rechargement lors du changement d'onglet
    useEffect(() => {
        if (activeTab === "manage") { loadAvailabilities(); loadDoctorsForSelect(); }
        if (activeTab === "doctors") loadDoctors();
        if (activeTab === "events") loadEvents();
        if (activeTab === "actualites") loadActualites();
        if (activeTab === "specialties") loadSpecialties();
        if (activeTab === "etablissement") loadEtablissement();
        if (activeTab === "partenaires") loadPartenaires();
        if (activeTab === "footer") loadFooterContent();
        if (activeTab === "newsletter") loadNewsletterStats();
        if (activeTab === "caisse") { loadPaiements(); loadPaymentConfig(); }
        if (activeTab === "results") { loadPendingResults(); loadPatients(); }
        if (activeTab === "patients") loadPatients();
        if (activeTab === "content") loadContent(selectedPage);
        if (activeTab === "jobs") loadJobs();
        if (activeTab === "applications") loadApplications();
        if (activeTab === "stats") loadStats();
        if (activeTab === "calendar") loadAvailabilities();
    }, [activeTab]);
    
    // ========== RENDU JSX (React.createElement) ==========
    return React.createElement("div", { style: { maxWidth: "1400px", margin: "auto", background: "white", borderRadius: "24px", padding: "20px", boxShadow: "0 8px 20px rgba(0,0,0,0.05)" } },
        React.createElement("h1", { style: { color: "#0b6e8f", borderLeft: "5px solid #2ec4b6", paddingLeft: "20px", marginTop: 0 } }, "📋 Administration Medical Center Elizabeth"),
        successMsg && React.createElement("div", { style: { background: "#28a745", color: "white", padding: "10px", borderRadius: "5px", marginBottom: "20px" } }, successMsg),
        React.createElement("div", { style: { display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", flexWrap: "wrap" } }, tabs.map(tab => 
            React.createElement("div", { key: tab.id, onClick: () => setActiveTab(tab.id), style: { padding: "10px 20px", cursor: "pointer", background: activeTab === tab.id ? "#0b6e8f" : "#e9ecef", color: activeTab === tab.id ? "white" : "#666", borderRadius: "8px 8px 0 0" } }, tab.label)
        )),
        
        // Rendez-vous (avec validation téléconsultation)
        activeTab === "rdv" && React.createElement("div", null,
            React.createElement("h2", null, "📋 Rendez-vous"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", { style: { padding: "8px" } }, "ID"),
                            React.createElement("th", null, "Nom"),
                            React.createElement("th", null, "Email"),
                            React.createElement("th", null, "Date"),
                            React.createElement("th", null, "Heure"),
                            React.createElement("th", null, "Téléconsultation"),
                            React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, appointments.map(rdv =>
                        React.createElement("tr", { key: rdv.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, rdv.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(rdv.fullname)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(rdv.email)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, rdv.date),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, rdv.time),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } },
                                rdv.teleconsultation_validated ? 
                                    React.createElement("span", { style: { color: "green" } }, "✅ Validée") :
                                    React.createElement("button", { onClick: () => validateTeleconsultation(rdv.id), style: { background: "#ff9f1c", color: "white", border: "none", padding: "4px 8px", borderRadius: "12px", cursor: "pointer" } }, "Valider")
                            ),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, 
                                React.createElement("button", { onClick: () => deleteAppointment(rdv.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️")
                            )
                        )
                    ))
                )
            )
        ),
        
        // Calendrier
        activeTab === "calendar" && React.createElement("div", null,
            React.createElement("h2", null, "📅 Calendrier des disponibilités"),
            React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px" } },
                calendarData.map(day => 
                    React.createElement("div", { key: day.date, style: { border: "1px solid #ddd", borderRadius: "8px", padding: "10px", background: "#f8f9fa" } },
                        React.createElement("div", { style: { fontWeight: "bold", background: "#0b6e8f", color: "white", padding: "6px", borderRadius: "6px", marginBottom: "10px", textAlign: "center" } }, day.date),
                        day.slots.map(slot => 
                            React.createElement("div", { key: slot.id, style: { fontSize: "0.85rem", margin: "5px 0", display: "flex", justifyContent: "space-between" } },
                                React.createElement("span", null, escapeHtml(slot.doctor_name), " - ", slot.time_slot),
                                React.createElement("span", { style: { color: slot.is_booked ? "red" : "green" } }, slot.is_booked ? "Réservé" : "Libre")
                            )
                        )
                    )
                )
            )
        ),
        
        // Candidatures
        activeTab === "applications" && React.createElement("div", null,
            React.createElement("h2", null, "📋 Candidatures reçues"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Poste"), React.createElement("th", null, "Candidat"),
                            React.createElement("th", null, "Email"), React.createElement("th", null, "Téléphone"), React.createElement("th", null, "Message"),
                            React.createElement("th", null, "CV"), React.createElement("th", null, "Date"), React.createElement("th", null, "Statut")
                        )
                    ),
                    React.createElement("tbody", null, applications.map(app =>
                        React.createElement("tr", { key: app.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, app.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(app.job_title)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(app.full_name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(app.email)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(app.phone || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(app.message || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, app.cv_url ? React.createElement("a", { href: app.cv_url, target: "_blank", style: { color: "#0b6e8f" } }, "📄 CV") : "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, new Date(app.applied_date).toLocaleString()),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, app.status || "pending")
                        )
                    ))
                )
            )
        ),
        
        // Statistiques
        activeTab === "stats" && React.createElement("div", null,
            React.createElement("h2", null, "📊 Statistiques"),
            React.createElement("div", { style: { display: "flex", gap: "20px", flexWrap: "wrap" } },
                React.createElement("div", { style: { background: "#e9ecef", borderRadius: "16px", padding: "16px", textAlign: "center", minWidth: "150px" } },
                    React.createElement("div", { style: { fontSize: "2rem", fontWeight: "bold", color: "#0b6e8f" } }, stats.total.total),
                    React.createElement("div", null, "Total RDV")
                )
            ),
            React.createElement("h3", null, "📅 Par jour"),
            React.createElement("ul", null, stats.perDay.map(d => React.createElement("li", { key: d.date }, `${d.date} : ${d.nb} RDV`))),
            React.createElement("h3", null, "👨‍⚕️ Par médecin"),
            React.createElement("ul", null, stats.perDoctor.map(d => React.createElement("li", { key: d.name }, `${d.name} : ${d.nb} RDV`)))
        ),
        
        // Offres d'emploi
        activeTab === "jobs" && React.createElement("div", null,
            React.createElement("h2", null, "💼 Offres d'emploi"),
            React.createElement("button", { onClick: () => setShowJobForm(!showJobForm), style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer", marginBottom: "20px" } }, showJobForm ? "-" : "+", " Ajouter"),
            showJobForm && React.createElement("form", { onSubmit: addJob, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "title", placeholder: "Titre", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "department", placeholder: "Département", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("select", { name: "contract_type", style: { width: "100%", marginBottom: "8px", padding: "8px" } }, 
                    React.createElement("option", null, "CDI"), React.createElement("option", null, "CDD"), React.createElement("option", null, "Stage")
                ),
                React.createElement("input", { type: "text", name: "location", placeholder: "Localisation", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "3", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "requirements", placeholder: "Prérequis", rows: "3", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "salary_range", placeholder: "Salaire", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Actif"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { marginTop: "10px", background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Titre"), React.createElement("th", null, "Département"),
                            React.createElement("th", null, "Contrat"), React.createElement("th", null, "Localisation"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, jobs.map(job =>
                        React.createElement("tr", { key: job.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, job.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(job.title)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(job.department)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(job.contract_type)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(job.location)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, job.active ? "✅ Oui" : "❌ Non"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: () => deleteJob(job.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Disponibilités
        activeTab === "manage" && React.createElement("div", null,
            React.createElement("h3", null, "Gestion des disponibilités"),
            React.createElement("button", { onClick: () => setShowAvailabilityForm(!showAvailabilityForm), style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer", marginBottom: "20px" } }, showAvailabilityForm ? "-" : "+", " Ajouter créneau"),
            showAvailabilityForm && React.createElement("form", { onSubmit: addAvailability, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("select", { name: "doctor_id", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }, 
                    React.createElement("option", { value: "" }, "Médecin"),
                    doctors.map(d => React.createElement("option", { key: d.id, value: d.id }, escapeHtml(d.full_name)))
                ),
                React.createElement("input", { type: "date", name: "date", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "time", name: "start_time", required: true, style: { width: "48%", padding: "8px" } }),
                React.createElement("input", { type: "time", name: "end_time", required: true, style: { width: "48%", padding: "8px", float: "right" } }),
                React.createElement("div", { style: { clear: "both" } }),
                React.createElement("button", { type: "submit", style: { marginTop: "10px", background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("h3", null, "Liste des créneaux"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "Médecin"), React.createElement("th", null, "Date"), React.createElement("th", null, "Créneau"),
                            React.createElement("th", null, "Statut"), React.createElement("th", null, "Action")
                        )
                    ),
                    React.createElement("tbody", null, availabilities.map(av =>
                        React.createElement("tr", { key: av.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(av.doctor_name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, av.date),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, av.time_slot),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd", color: av.is_booked ? "red" : "green" } }, av.is_booked ? "Réservé" : "Libre"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, !av.is_booked && React.createElement("button", { onClick: () => deleteAvailability(av.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Médecins
        activeTab === "doctors" && React.createElement("div", null,
            React.createElement("h3", null, "➕ Ajouter un médecin"),
            React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const full_name = formData.get("full_name");
                const specialty = formData.get("specialty");
                const department = formData.get("department");
                const email = formData.get("email");
                const telegram_chat_id = formData.get("telegram_chat_id") || null;
                const password = "123";
                const profession = "Médecin";
                const photoFile = formData.get("photo");
                let photo_url = null;
                if (photoFile && photoFile.size) {
                    const fd = new FormData(); fd.append("image", photoFile);
                    const uploadRes = await fetch(API_BASE + "/upload", { method: "POST", body: fd });
                    const uploadData = await uploadRes.json();
                    if (uploadData.imageUrl) photo_url = uploadData.imageUrl;
                    else { alert("Erreur upload photo"); return; }
                }
                const payload = { full_name, profession, specialty, department, email, phone: "", photo_url, password, telegram_chat_id };
                const res = await fetch(API_BASE + "/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (res.ok) { showSuccess("Médecin ajouté"); loadDoctors(); e.target.reset(); }
                else alert("Erreur");
            }, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "full_name", placeholder: "Nom complet", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "specialty", placeholder: "Spécialité", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "department", placeholder: "Service", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "email", name: "email", placeholder: "Email", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "telegram_chat_id", placeholder: "Telegram Chat ID", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "file", name: "photo", accept: "image/*", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("h3", null, "📋 Liste des médecins"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Nom"), React.createElement("th", null, "Spécialité"),
                            React.createElement("th", null, "Photo"), React.createElement("th", null, "Telegram ID"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, doctors.map(d =>
                        React.createElement("tr", { key: d.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, d.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(d.full_name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(d.specialty || d.profession)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, d.photo_url ? React.createElement("img", { src: d.photo_url, style: { width: "40px", height: "40px", borderRadius: "50%" } }) : "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(d.telegram_chat_id || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, d.is_active ? "✅" : "❌"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, 
                                React.createElement("button", { onClick: () => setEditingDoctor(d), style: { color: "#ffc107", background: "none", border: "none", cursor: "pointer" } }, "✏️"),
                                React.createElement("button", { onClick: () => deleteDoctor(d.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️")
                            )
                        )
                    ))
                )
            )
        ),
        
        // Événements
        activeTab === "events" && React.createElement("div", null,
            React.createElement("h3", null, "➕ Ajouter un événement"),
            React.createElement("form", { onSubmit: addEvent, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "title", placeholder: "Titre", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "2", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "date", name: "start_date", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "date", name: "end_date", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Actif"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("h3", null, "📅 Événements"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Titre"), React.createElement("th", null, "Description"),
                            React.createElement("th", null, "Début"), React.createElement("th", null, "Fin"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, events.map(e =>
                        React.createElement("tr", { key: e.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, e.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(e.title)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(e.description || "")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, e.start_date || "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, e.end_date || "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, e.active ? "Oui" : "Non"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: () => deleteEvent(e.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Contenu du site (avec gestion de la page info_patients)
        activeTab === "content" && React.createElement("div", null,
            React.createElement("h2", null, "✏️ Contenu du site"),
            React.createElement("select", { value: selectedPage, onChange: e => { setSelectedPage(e.target.value); loadContent(e.target.value); }, style: { padding: "8px", marginBottom: "20px", borderRadius: "8px" } },
                React.createElement("option", { value: "home" }, "Accueil"),
                React.createElement("option", { value: "about" }, "Nous connaître"),
                React.createElement("option", { value: "support" }, "Nous soutenir"),
                React.createElement("option", { value: "checkup" }, "Check-up Center"),
                React.createElement("option", { value: "specialties" }, "Nos spécialités"),
                React.createElement("option", { value: "info" }, "Infos patients & visiteurs"),
                React.createElement("option", { value: "offre" }, "Notre offre de soins"),
                React.createElement("option", { value: "tarifs" }, "Tarifs hospitaliers"),
                React.createElement("option", { value: "paiement_facture" }, "Paiement des factures")
            ),
            React.createElement("div", { id: "contentEditor", style: { marginBottom: "20px" } },
                selectedPage === "paiement_facture" ?
                    React.createElement("textarea", { "data-key": "contenu", defaultValue: siteContent.contenu || "", placeholder: "Contenu de la page (HTML accepté)", rows: "8", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } })
                : selectedPage === "info" ?
                    [
                        React.createElement("textarea", { key: "horaires", "data-key": "horaires", defaultValue: siteContent.horaires || "", placeholder: "Horaires de visite", rows: "5", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } }),
                        React.createElement("textarea", { key: "repas", "data-key": "repas", defaultValue: siteContent.repas || "", placeholder: "Suggestions de repas (menu type, régimes)", rows: "5", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } }),
                        React.createElement("textarea", { key: "parking", "data-key": "parking", defaultValue: siteContent.parking || "", placeholder: "Accès et parking", rows: "4", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } }),
                        React.createElement("textarea", { key: "regles", "data-key": "regles", defaultValue: siteContent.regles || "", placeholder: "Règles et recommandations", rows: "5", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } }),
                        React.createElement("textarea", { key: "contact", "data-key": "contact", defaultValue: siteContent.contact || "", placeholder: "Contacts utiles (numéros, emails)", rows: "4", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } })
                    ]
                :
                    Object.entries(siteContent).map(([key, val]) =>
                        React.createElement("textarea", { key: key, "data-key": key, defaultValue: val || "", placeholder: key, rows: "4", style: { width: "100%", marginBottom: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" } })
                    )
            ),
            React.createElement("button", { onClick: () => {
                const updates = {};
                document.querySelectorAll("#contentEditor textarea").forEach(ta => updates[ta.getAttribute("data-key")] = ta.value);
                fetch(API_BASE + "/site-content/" + selectedPage, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) })
                    .then(res => res.ok ? alert("✅ Contenu mis à jour !") : alert("❌ Erreur"));
            }, style: { background: "#0b6e8f", color: "white", border: "none", padding: "10px 20px", borderRadius: "25px", cursor: "pointer" } }, "Enregistrer")
        ),
        
        // Actualités
        activeTab === "actualites" && React.createElement("div", null,
            React.createElement("h2", null, "Actualités"),
            React.createElement("button", { onClick: () => setShowActuForm(!showActuForm), style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer", marginBottom: "20px" } }, showActuForm ? "-" : "+", " Ajouter"),
            showActuForm && React.createElement("form", { onSubmit: addActualite, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "titre", placeholder: "Titre", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "3", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "file", name: "imageFile", accept: "image/*", onChange: e => {
                    if (e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = ev => setImagePreview(ev.target.result);
                        reader.readAsDataURL(e.target.files[0]);
                    }
                }, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                imagePreview && React.createElement("img", { src: imagePreview, style: { maxWidth: "100px", borderRadius: "8px", marginBottom: "8px" }, alt: "Preview" }),
                React.createElement("input", { type: "number", name: "ordre", placeholder: "Ordre", defaultValue: "0", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Actif"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { marginTop: "10px", background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Titre"), React.createElement("th", null, "Description"),
                            React.createElement("th", null, "Image"), React.createElement("th", null, "Ordre"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, actualites.map(actu =>
                        React.createElement("tr", { key: actu.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, actu.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(actu.titre)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(actu.description)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, actu.image_url ? React.createElement("img", { src: actu.image_url, style: { width: "40px", height: "40px", borderRadius: "8px" } }) : "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, actu.ordre),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, actu.active ? "✅" : "❌"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: () => deleteActualite(actu.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Spécialités
        activeTab === "specialties" && React.createElement("div", null,
            React.createElement("h2", null, "Spécialités"),
            React.createElement("button", { onClick: () => setShowSpecialtyForm(!showSpecialtyForm), style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer", marginBottom: "20px" } }, showSpecialtyForm ? "-" : "+", " Ajouter"),
            showSpecialtyForm && React.createElement("form", { onSubmit: addSpecialty, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "name", placeholder: "Nom", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "2", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "number", name: "ordre", placeholder: "Ordre", defaultValue: "0", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Active"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { marginTop: "10px", background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Nom"), React.createElement("th", null, "Description"),
                            React.createElement("th", null, "Ordre"), React.createElement("th", null, "Active"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, specialties.map(spec =>
                        React.createElement("tr", { key: spec.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, spec.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(spec.name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(spec.description || "")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, spec.ordre),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, spec.active ? "✅" : "❌"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: () => deleteSpecialty(spec.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Établissement
        activeTab === "etablissement" && React.createElement("div", null,
            React.createElement("h2", null, "🏥 Gestion des photos de l'établissement"),
            React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const titre = fd.get("titre");
                const description = fd.get("description");
                const ordre = parseInt(fd.get("ordre")) || 0;
                const active = fd.get("active") === "on" ? 1 : 0;
                const file = fd.get("imageFile");
                if (!file || file.size === 0) { alert("Image requise"); return; }
                const uploadFd = new FormData(); uploadFd.append("image", file);
                const uploadRes = await fetch(API_BASE + "/upload", { method: "POST", body: uploadFd });
                const uploadData = await uploadRes.json();
                if (!uploadData.imageUrl) { alert("Erreur upload"); return; }
                const payload = { titre, description, image_url: uploadData.imageUrl, ordre, active };
                const res = await fetch(API_BASE + "/etablissement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (res.ok) { showSuccess("Photo ajoutée"); loadEtablissement(); e.target.reset(); }
                else alert("Erreur");
            }, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "titre", placeholder: "Titre", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "2", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "file", name: "imageFile", accept: "image/*", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "number", name: "ordre", placeholder: "Ordre", defaultValue: "0", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Actif"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Titre"), React.createElement("th", null, "Image"), React.createElement("th", null, "Ordre"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, etablissement.map(photo =>
                        React.createElement("tr", { key: photo.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, photo.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(photo.titre)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("img", { src: photo.image_url, style: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" } })),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, photo.ordre),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, photo.active ? "Oui" : "Non"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: async () => {
                                if (confirm("Supprimer ?")) {
                                    const res = await fetch(API_BASE + "/etablissement/" + photo.id, { method: "DELETE" });
                                    if (res.ok) loadEtablissement();
                                }
                            }, style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Partenaires
        activeTab === "partenaires" && React.createElement("div", null,
            React.createElement("h2", null, "🤝 Gestion des partenaires"),
            React.createElement("form", { onSubmit: async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const nom = fd.get("nom");
                const description = fd.get("description");
                const commentaire = fd.get("commentaire");
                const ordre = parseInt(fd.get("ordre")) || 0;
                const active = fd.get("active") === "on" ? 1 : 0;
                const file = fd.get("imageFile");
                if (!file || file.size === 0) { alert("Logo requis"); return; }
                const uploadFd = new FormData(); uploadFd.append("image", file);
                const uploadRes = await fetch(API_BASE + "/upload", { method: "POST", body: uploadFd });
                const uploadData = await uploadRes.json();
                if (!uploadData.imageUrl) { alert("Erreur upload"); return; }
                const payload = { nom, description, image_url: uploadData.imageUrl, commentaire, ordre, active };
                const res = await fetch(API_BASE + "/partenaires", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (res.ok) { showSuccess("Partenaire ajouté"); loadPartenaires(); e.target.reset(); }
                else alert("Erreur");
            }, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "nom", placeholder: "Nom", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "2", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "file", name: "imageFile", accept: "image/*", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "commentaire", placeholder: "Commentaire", rows: "3", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "number", name: "ordre", placeholder: "Ordre", defaultValue: "0", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Actif"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Nom"), React.createElement("th", null, "Image"),
                            React.createElement("th", null, "Commentaire"), React.createElement("th", null, "Ordre"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, partenaires.map(p =>
                        React.createElement("tr", { key: p.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.nom)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("img", { src: p.image_url, style: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" } })),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.commentaire || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.ordre),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.active ? "Oui" : "Non"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: async () => {
                                if (confirm("Supprimer ?")) {
                                    const res = await fetch(API_BASE + "/partenaires/" + p.id, { method: "DELETE" });
                                    if (res.ok) loadPartenaires();
                                }
                            }, style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Newsletter
        activeTab === "newsletter" && React.createElement("div", null,
            React.createElement("h2", null, "📧 Newsletter"),
            React.createElement("p", null, "Total abonnés actifs : ", React.createElement("strong", null, newsletterCount)),
            React.createElement("button", { onClick: exportEmails, style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer", marginBottom: "20px" } }, "📎 Exporter les emails (CSV)"),
            React.createElement("h3", null, "✉️ Envoyer une newsletter"),
            React.createElement("form", { onSubmit: sendNewsletter, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px" } },
                React.createElement("input", { type: "text", name: "subject", placeholder: "Sujet", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "content", placeholder: "Contenu (HTML accepté)", rows: "5", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "📨 Envoyer")
            )
        ),
        
        // Footer enrichi
        activeTab === "footer" && React.createElement("div", null,
            React.createElement("h2", null, "✏️ Gestion du pied de page (multi-colonnes)"),
            React.createElement("form", { onSubmit: saveFooter, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px" } },
                React.createElement("h3", null, "Coordonnées"),
                React.createElement("label", null, "Nom de l'établissement :"),
                React.createElement("input", { type: "text", name: "etablissement", defaultValue: footerContent.etablissement || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Adresse :"),
                React.createElement("input", { type: "text", name: "adresse", defaultValue: footerContent.adresse || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Téléphone principal :"),
                React.createElement("input", { type: "text", name: "telephone", defaultValue: footerContent.telephone || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Téléphone secondaire :"),
                React.createElement("input", { type: "text", name: "telephone2", defaultValue: footerContent.telephone2 || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Email de contact :"),
                React.createElement("input", { type: "email", name: "email", defaultValue: footerContent.email || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Numéro d'urgence :"),
                React.createElement("input", { type: "text", name: "urgences", defaultValue: footerContent.urgences || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Bloc : Aide et information (une ligne par lien, format texte|url)"),
                React.createElement("textarea", { name: "liens_aide", defaultValue: footerContent.liens_aide || "", rows: "6", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Bloc : Notre entreprise"),
                React.createElement("textarea", { name: "liens_entreprise", defaultValue: footerContent.liens_entreprise || "", rows: "6", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Bloc : Pour les soignants"),
                React.createElement("textarea", { name: "liens_soignants", defaultValue: footerContent.liens_soignants || "", rows: "6", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Bloc : Trouvez votre spécialiste"),
                React.createElement("textarea", { name: "liens_specialistes", defaultValue: footerContent.liens_specialistes || "", rows: "8", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Bloc : Recherches fréquentes"),
                React.createElement("textarea", { name: "liens_recherches", defaultValue: footerContent.liens_recherches || "", rows: "6", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Dernières technologies MCE (une par ligne)"),
                React.createElement("textarea", { name: "technologies", defaultValue: footerContent.technologies || "", rows: "4", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Réseaux sociaux (icônes Font Awesome séparées par des virgules)"),
                React.createElement("input", { type: "text", name: "reseaux", defaultValue: footerContent.reseaux || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("h3", null, "Copyright"),
                React.createElement("input", { type: "text", name: "copyright", defaultValue: footerContent.copyright || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Enregistrer le footer")
            )
        ),
        
        // Tarifs
        activeTab === "tarifs" && React.createElement("div", null,
            React.createElement("h2", null, "💰 Gestion des tarifs"),
            React.createElement("form", { onSubmit: addTarif, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "service", placeholder: "Service", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "prestation", placeholder: "Prestation", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "prix", placeholder: "Prix", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "2", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "number", name: "ordre", placeholder: "Ordre", defaultValue: "0", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, React.createElement("input", { type: "checkbox", name: "active", defaultChecked: true }), " Actif"),
                React.createElement("br", null),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Service"), React.createElement("th", null, "Prestation"),
                            React.createElement("th", null, "Prix"), React.createElement("th", null, "Ordre"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, tarifs.map(t =>
                        React.createElement("tr", { key: t.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, t.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(t.service)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(t.prestation)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(t.prix)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, t.ordre),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, t.active ? "Oui" : "Non"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: () => deleteTarif(t.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️"))
                        )
                    ))
                )
            )
        ),
        
        // Caisse (Paiements)
        activeTab === "caisse" && React.createElement("div", null,
            React.createElement("h2", null, "💰 Historique des paiements"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Client"), React.createElement("th", null, "Montant"),
                            React.createElement("th", null, "Méthode"), React.createElement("th", null, "Statut"), React.createElement("th", null, "Code"), React.createElement("th", null, "Date"), React.createElement("th", null, "Facture")
                        )
                    ),
                    React.createElement("tbody", null, paiements.map(p =>
                        React.createElement("tr", { key: p.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.nom_client || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.montant + " €"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.methode === "mobile_money" ? "Mobile Money" : "Carte"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd", color: p.statut === "confirme" ? "green" : "orange" } }, p.statut),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.code_confirmation || "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, new Date(p.date_paiement).toLocaleString()),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.facture_url ? React.createElement("a", { href: p.facture_url, target: "_blank", style: { color: "#0b6e8f" } }, "📄 Facture") : "-")
                        )
                    ))
                )
            ),
            React.createElement("h3", null, "⚙️ Configuration des moyens de paiement"),
            React.createElement("form", { onSubmit: savePaymentConfig, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginTop: "20px" } },
                React.createElement("label", null, "IBAN :"), React.createElement("input", { type: "text", name: "iban", defaultValue: paymentConfig.iban || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "BIC :"), React.createElement("input", { type: "text", name: "bic", defaultValue: paymentConfig.bic || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Titulaire :"), React.createElement("input", { type: "text", name: "titulaire", defaultValue: paymentConfig.titulaire || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Mobile Money :"), React.createElement("input", { type: "text", name: "mobile_money_info", defaultValue: paymentConfig.mobile_money_info || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("label", null, "Carte bancaire :"), React.createElement("input", { type: "text", name: "carte_info", defaultValue: paymentConfig.carte_info || "", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Enregistrer")
            )
        ),
        
        // Résultats labo
        activeTab === "results" && React.createElement("div", null,
            React.createElement("h2", null, "🔬 Résultats en attente de publication"),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Patient"), React.createElement("th", null, "Type"),
                            React.createElement("th", null, "Description"), React.createElement("th", null, "Fichier"), React.createElement("th", null, "Date création"), React.createElement("th", null, "Action")
                        )
                    ),
                    React.createElement("tbody", null, pendingResults.map(r =>
                        React.createElement("tr", { key: r.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, r.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(r.first_name + " " + r.last_name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(r.type)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(r.description || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, r.file_url ? React.createElement("a", { href: r.file_url, target: "_blank", style: { color: "#0b6e8f" } }, "📄 Fichier") : "-"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, new Date(r.created_at).toLocaleString()),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, React.createElement("button", { onClick: () => publishResult(r.id), style: { background: "#28a745", color: "white", border: "none", padding: "4px 12px", borderRadius: "20px", cursor: "pointer" } }, "Publier"))
                        )
                    ))
                )
            ),
            React.createElement("h3", null, "➕ Ajouter un résultat"),
            React.createElement("form", { onSubmit: addResult, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginTop: "20px" } },
                React.createElement("select", { name: "patient_id", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } },
                    React.createElement("option", { value: "" }, "-- Choisir un patient --"),
                    patients.map(p => React.createElement("option", { key: p.id, value: p.id }, escapeHtml(p.first_name + " " + p.last_name) + " (" + p.email + ")"))
                ),
                React.createElement("input", { type: "text", name: "type", placeholder: "Type d'examen", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("textarea", { name: "description", placeholder: "Description", rows: "2", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "file_url", placeholder: "URL du fichier (PDF)", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            )
        ),
        
        // Patients
        activeTab === "patients" && React.createElement("div", null,
            React.createElement("h2", null, "👥 Gestion des patients"),
            React.createElement("button", { onClick: () => setShowPatientForm(!showPatientForm), style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer", marginBottom: "20px" } }, showPatientForm ? "-" : "+", " Ajouter"),
            showPatientForm && React.createElement("form", { onSubmit: addPatient, style: { background: "#f1f9fe", padding: "15px", borderRadius: "12px", marginBottom: "20px" } },
                React.createElement("input", { type: "text", name: "first_name", placeholder: "Prénom", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "text", name: "last_name", placeholder: "Nom", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "email", name: "email", placeholder: "Email", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "tel", name: "phone", placeholder: "Téléphone", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("input", { type: "password", name: "password", placeholder: "Mot de passe", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", border: "none", padding: "8px 16px", borderRadius: "25px", cursor: "pointer" } }, "Ajouter")
            ),
            React.createElement("div", { style: { overflowX: "auto" } },
                React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
                    React.createElement("thead", null,
                        React.createElement("tr", { style: { background: "#0b6e8f", color: "white" } },
                            React.createElement("th", null, "ID"), React.createElement("th", null, "Prénom"), React.createElement("th", null, "Nom"),
                            React.createElement("th", null, "Email"), React.createElement("th", null, "Téléphone"), React.createElement("th", null, "Date d'inscription"), React.createElement("th", null, "Actif"), React.createElement("th", null, "Actions")
                        )
                    ),
                    React.createElement("tbody", null, patients.map(p =>
                        React.createElement("tr", { key: p.id },
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.id),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.first_name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.last_name)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.email)),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, escapeHtml(p.phone || "-")),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, new Date(p.created_at).toLocaleDateString()),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, p.is_active ? "✅" : "❌"),
                            React.createElement("td", { style: { padding: "8px", borderBottom: "1px solid #ddd" } }, 
                                React.createElement("button", { onClick: () => setEditingPatient(p), style: { color: "#ffc107", background: "none", border: "none", cursor: "pointer" } }, "✏️"),
                                React.createElement("button", { onClick: () => deletePatient(p.id), style: { color: "#dc3545", background: "none", border: "none", cursor: "pointer" } }, "🗑️")
                            )
                        )
                    ))
                )
            )
        ),
        
        // Modale d'édition patient
        editingPatient && React.createElement("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 } },
            React.createElement("div", { style: { background: "white", padding: "20px", borderRadius: "16px", maxWidth: "500px", width: "90%" } },
                React.createElement("h3", null, "Modifier le patient"),
                React.createElement("form", { onSubmit: updatePatient },
                    React.createElement("input", { type: "text", name: "first_name", defaultValue: editingPatient.first_name, placeholder: "Prénom", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "text", name: "last_name", defaultValue: editingPatient.last_name, placeholder: "Nom", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "email", name: "email", defaultValue: editingPatient.email, placeholder: "Email", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "tel", name: "phone", defaultValue: editingPatient.phone || "", placeholder: "Téléphone", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "password", name: "password", placeholder: "Nouveau mot de passe (laisser vide pour inchangé)", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("label", { style: { display: "block", marginBottom: "8px" } },
                        React.createElement("input", { type: "checkbox", name: "is_active", defaultChecked: editingPatient.is_active === 1 }),
                        " Compte actif"
                    ),
                    React.createElement("div", { style: { marginTop: "15px", display: "flex", gap: "10px", justifyContent: "flex-end" } },
                        React.createElement("button", { type: "button", onClick: () => setEditingPatient(null), style: { background: "#6c757d", color: "white", padding: "8px 16px", border: "none", borderRadius: "20px" } }, "Annuler"),
                        React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", padding: "8px 16px", border: "none", borderRadius: "20px" } }, "Enregistrer")
                    )
                )
            )
        ),
        
        // Modale d'édition médecin
        editingDoctor && React.createElement("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 } },
            React.createElement("div", { style: { background: "white", padding: "20px", borderRadius: "16px", maxWidth: "500px", width: "90%" } },
                React.createElement("h3", null, "Modifier le médecin"),
                React.createElement("form", { onSubmit: updateDoctor },
                    React.createElement("input", { type: "text", name: "full_name", defaultValue: editingDoctor.full_name, placeholder: "Nom complet", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "text", name: "specialty", defaultValue: editingDoctor.specialty || "", placeholder: "Spécialité", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "text", name: "department", defaultValue: editingDoctor.department || "", placeholder: "Service", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "email", name: "email", defaultValue: editingDoctor.email, placeholder: "Email", required: true, style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "text", name: "telegram_chat_id", defaultValue: editingDoctor.telegram_chat_id || "", placeholder: "Telegram Chat ID", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "tel", name: "phone", defaultValue: editingDoctor.phone || "", placeholder: "Téléphone", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("input", { type: "password", name: "password", placeholder: "Nouveau mot de passe (laisser vide pour inchangé)", style: { width: "100%", marginBottom: "8px", padding: "8px" } }),
                    React.createElement("label", { style: { display: "block", marginBottom: "8px" } },
                        React.createElement("input", { type: "checkbox", name: "is_active", defaultChecked: editingDoctor.is_active === 1 }),
                        " Compte actif"
                    ),
                    React.createElement("div", { style: { marginTop: "15px", display: "flex", gap: "10px", justifyContent: "flex-end" } },
                        React.createElement("button", { type: "button", onClick: () => setEditingDoctor(null), style: { background: "#6c757d", color: "white", padding: "8px 16px", border: "none", borderRadius: "20px" } }, "Annuler"),
                        React.createElement("button", { type: "submit", style: { background: "#0b6e8f", color: "white", padding: "8px 16px", border: "none", borderRadius: "20px" } }, "Enregistrer")
                    )
                )
            )
        ),
        
        React.createElement("div", { className: "footer", style: { marginTop: "20px", textAlign: "center", color: "#6c757d" } }, React.createElement("p", null, "🔒 Accès sécurisé réservé au personnel autorisé"))
    );
}

export default AdminDashboard;