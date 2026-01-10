import React, { useState, useEffect, useRef } from 'react';
import { Radio, AlertTriangle, Shield, Activity, MapPin, Navigation, Phone, Clock, Search, Volume2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = createIcon('red');
const yellowIcon = createIcon('gold');
const blueIcon = createIcon('blue');
const greenIcon = createIcon('green');

// Component to update map center
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14);
        }
    }, [center, map]);
    return null;
};

const CrisisDashboard = () => {
    const { user } = useAuth(); // Get authenticated user
    const [activeCrises, setActiveCrises] = useState([]);
    const [filteredCrises, setFilteredCrises] = useState([]); // Filtered by User ID
    const [agencies, setAgencies] = useState([]);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default Delhi

    // Form State
    const [crisisForm, setCrisisForm] = useState({
        title: '',
        description: '',
        crisis_type: 'medical',
        severity: 'medium',
        latitude: 28.6139,
        longitude: 77.2090,
        contact_number: user?.email || '',
        reported_by: user?.user_metadata?.full_name || 'Anonymous'
    });

    const [imageFile, setImageFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter([latitude, longitude]);
                    setCrisisForm(prev => ({ ...prev, latitude, longitude }));
                },
                (err) => console.error("Location access denied. Using default.")
            );
        }

        fetchActiveCrises();

        const ws = new WebSocket('ws://localhost:8000/crisis/ws/dashboard');
        ws.onopen = () => console.log('Connected to Crisis Dispatch');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'INITIAL_STATE') {
                setActiveCrises(data.active_crises);
                setAgencies(data.agencies);
            } else if (data.type === 'NEW_CRISIS') {
                setActiveCrises(prev => [...prev, data.crisis]);
            } else if (data.type === 'AGENCY_RESPONSE') {
                setActiveCrises(prev => prev.map(c => c.id === data.crisis_id ? data.crisis : c));
            }
        };

        return () => ws.close();
    }, []);

    // Filter Incidents for "My Incidents"
    useEffect(() => {
        if (user && activeCrises.length > 0) {
            const myIncidents = activeCrises.filter(c => c.reporter_id === user.id);
            setFilteredCrises(myIncidents);
        } else {
            setFilteredCrises([]);
        }
    }, [activeCrises, user]);

    const fetchActiveCrises = async () => {
        try {
            const res = await fetch('http://localhost:8000/crisis/active');
            const data = await res.json();
            setActiveCrises(data.crises || []);
        } catch (e) {
            console.error("Failed to fetch crises", e);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
    };

    const toggleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) return alert("Voice input not supported");
        const recognition = new window.webkitSpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setCrisisForm(prev => ({ ...prev, description: (prev.description + ' ' + transcript).trim() }));
        };
        recognition.start();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            Object.keys(crisisForm).forEach(key => formData.append(key, crisisForm[key]));
            if (imageFile) formData.append('image', imageFile);
            formData.append('reporter_id', user.id);

            const res = await fetch('http://localhost:8000/crisis/alert', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            setAiAnalysis(data.ai_analysis);
            alert(`Incident Reported! ID: ${data.crisis_id}`);

            setCrisisForm(prev => ({ ...prev, title: '', description: '', severity: 'medium' }));
            setImageFile(null);
            fetchActiveCrises(); // Refresh list immediately

        } catch (err) {
            alert("Failed to report incident.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full w-full bg-gray-900 pt-[80px] pb-[40px] px-4 overflow-hidden flex flex-col">
            <div className="flex-1 flex gap-6 overflow-hidden">

                {/* LEFT PANEL: MAP (Using Leaflet) */}
                <div className="flex-[2] glass-panel rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapUpdater center={mapCenter} />

                        {/* User Location */}
                        <Marker position={mapCenter} icon={blueIcon}>
                            <Popup>You are Here</Popup>
                        </Marker>

                        {/* My Incidents */}
                        {filteredCrises.map(crisis => (
                            <Marker
                                key={crisis.id}
                                position={[crisis.latitude, crisis.longitude]}
                                icon={crisis.severity === 'critical' ? redIcon : yellowIcon}
                            >
                                <Popup>
                                    <div className="text-black">
                                        <strong>{crisis.title}</strong><br />
                                        {crisis.description}<br />
                                        Status: {crisis.status}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Agencies */}
                        {agencies.map(agency => (
                            <Marker
                                key={agency.id}
                                position={[agency.lat, agency.lon]}
                                icon={greenIcon}
                            >
                                <Popup>
                                    <div className="text-black">
                                        <strong>{agency.name}</strong><br />
                                        Type: {agency.type}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* RIGHT PANEL: REPORT FORM & MY INCIDENTS */}
                <div className="flex-1 flex flex-col gap-4 max-w-md overflow-hidden">

                    {/* Report Form */}
                    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 text-white shadow-xl overflow-y-auto max-h-[60%]">
                        <div className="flex items-center gap-2 mb-4 text-red-400">
                            <AlertTriangle size={20} />
                            <h2 className="text-xl font-bold">Report Incident</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                placeholder="Incident Title"
                                className="w-full p-2 bg-black/40 border border-white/10 rounded"
                                value={crisisForm.title}
                                onChange={e => setCrisisForm({ ...crisisForm, title: e.target.value })}
                                required
                            />
                            <div className="flex gap-2">
                                <textarea
                                    placeholder="Description"
                                    className="w-full p-2 bg-black/40 border border-white/10 rounded"
                                    value={crisisForm.description}
                                    onChange={e => setCrisisForm({ ...crisisForm, description: e.target.value })}
                                    required
                                />
                                <button type="button" onClick={toggleVoiceInput} className={`p-2 rounded ${isListening ? 'bg-red-500' : 'bg-gray-700'}`}>
                                    <Volume2 size={20} />
                                </button>
                            </div>
                            <select
                                className="w-full p-2 bg-black/40 border border-white/10 rounded"
                                value={crisisForm.crisis_type}
                                onChange={e => setCrisisForm({ ...crisisForm, crisis_type: e.target.value })}
                            >
                                <option value="medical">Medical</option>
                                <option value="fire">Fire</option>
                                <option value="accident">Accident</option>
                                <option value="crime">Crime</option>
                            </select>

                            <input type="file" onChange={handleImageChange} className="text-xs text-gray-400" />

                            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 p-2 rounded font-bold hover:bg-red-700">
                                {isSubmitting ? 'Processing...' : 'BROADCAST ALERT'}
                            </button>
                        </form>

                        {aiAnalysis && (
                            <div className="mt-4 p-3 bg-green-900/40 border border-green-500/30 rounded text-xs">
                                <div className="font-bold text-green-400">AI Analysis Active</div>
                                <div className="text-gray-300">{aiAnalysis.recommended_actions?.[0]}</div>
                            </div>
                        )}
                    </div>

                    {/* My Incidents List */}
                    <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 overflow-y-auto">
                        <h3 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
                            <Activity size={18} /> My Reports
                        </h3>
                        {filteredCrises.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center mt-10">No active reports found.</div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCrises.map(c => (
                                    <div key={c.id} className="p-3 bg-black/20 rounded border-l-4 border-l-red-500">
                                        <div className="font-bold text-sm text-white">{c.title}</div>
                                        <div className="text-xs text-gray-400">{c.status?.toUpperCase()}</div>
                                        <div className="flex gap-2 mt-2">
                                            {c.nearest_agencies?.map(a => (
                                                <span key={a.id} className="text-[10px] bg-blue-900/50 px-1 rounded text-blue-200">{a.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrisisDashboard;