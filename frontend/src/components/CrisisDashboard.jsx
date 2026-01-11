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
        <div className="h-full w-full bg-transparent pt-4 pb-8 px-8 overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex-1 flex gap-8 overflow-hidden">

                {/* LEFT PANEL: MAP (Using Leaflet) */}
                <div className="flex-[2] relative rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 group">
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} className="z-10 bg-[#050505]">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <MapUpdater center={mapCenter} />

                        {/* User Location */}
                        <Marker position={mapCenter} icon={blueIcon}>
                            <Popup className="glass-popup">
                                <div className="text-crisis-blue font-bold font-mono">ALLIED UNIT (YOU)</div>
                                <div className="text-gray-800 text-xs">Status: Online</div>
                            </Popup>
                        </Marker>

                        {/* My Incidents */}
                        {filteredCrises.map(crisis => (
                            <Marker
                                key={crisis.id}
                                position={[crisis.latitude, crisis.longitude]}
                                icon={crisis.severity === 'critical' ? redIcon : yellowIcon}
                            >
                                <Popup className="glass-popup">
                                    <div className="min-w-[150px]">
                                        <div className="text-red-600 font-bold uppercase text-sm border-b border-gray-300 pb-1 mb-1">{crisis.title}</div>
                                        <div className="text-gray-700 text-xs mb-2">{crisis.description}</div>
                                        <div className="inline-block bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded border border-red-200 uppercase font-bold">
                                            {crisis.status}
                                        </div>
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

                    {/* Map Overlay VFX */}
                    <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] rounded-2xl"></div>
                    <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-[10px] text-crisis-cyan font-mono uppercase">
                        Satellite Link: Active
                    </div>
                </div>

                {/* RIGHT PANEL: REPORT FORM & MY INCIDENTS */}
                <div className="flex-1 flex flex-col gap-6 max-w-md overflow-hidden">

                    {/* Report Form */}
                    <div className="bg-surface-glass backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[60%] custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={20} className="text-crisis-red animate-pulse" />
                                <h2 className="text-xl font-display font-bold text-white tracking-wide">NEW INCIDENT</h2>
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase border border-white/10 px-2 py-1 rounded">
                                Form A-7
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-mono text-gray-400 uppercase mb-1 block pl-1">Incident Classification</label>
                                <input
                                    placeholder="e.g. Structural Collapse, Fire..."
                                    className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-crisis-red/50 focus:outline-none transition-colors font-mono text-sm"
                                    value={crisisForm.title}
                                    onChange={e => setCrisisForm({ ...crisisForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-mono text-gray-400 uppercase mb-1 block pl-1">Situation Report</label>
                                <div className="flex gap-2">
                                    <textarea
                                        placeholder="Describe the situation..."
                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-crisis-red/50 focus:outline-none transition-colors text-sm min-h-[80px]"
                                        value={crisisForm.description}
                                        onChange={e => setCrisisForm({ ...crisisForm, description: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleVoiceInput}
                                        className={`px-3 rounded-lg border border-white/10 transition-colors ${isListening ? 'bg-crisis-red text-white animate-pulse' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                                        title="Voice Report"
                                    >
                                        <Volume2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-mono text-gray-400 uppercase mb-1 block pl-1">Type</label>
                                    <select
                                        className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-crisis-red/50 focus:outline-none text-sm appearance-none"
                                        value={crisisForm.crisis_type}
                                        onChange={e => setCrisisForm({ ...crisisForm, crisis_type: e.target.value })}
                                    >
                                        <option value="medical">Medical</option>
                                        <option value="fire">Fire</option>
                                        <option value="accident">Accident</option>
                                        <option value="crime">Crime</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono text-gray-400 uppercase mb-1 block pl-1">Evidence</label>
                                    <label className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-gray-400 hover:text-white text-xs flex items-center justify-center cursor-pointer hover:border-white/30 transition-all">
                                        <span>{imageFile ? imageFile.name.slice(0, 12) + "..." : "Upload Media"}</span>
                                        <input type="file" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-crisis-red/20 border border-crisis-red text-crisis-red hover:bg-crisis-red hover:text-white p-3 rounded-lg font-bold tracking-widest uppercase transition-all duration-300 mt-2 flex items-center justify-center gap-2 group">
                                {isSubmitting ? (
                                    <span className="animate-pulse">TRANSMITTING...</span>
                                ) : (
                                    <>
                                        BROADCAST ALERT
                                        <Activity size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {aiAnalysis && (
                            <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-md">
                                <div className="font-bold text-green-400 text-xs uppercase mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    AI Strategy Analysis
                                </div>
                                <div className="text-gray-300 text-xs leading-relaxed font-mono">{aiAnalysis.recommended_actions?.[0]}</div>
                            </div>
                        )}
                    </div>

                    {/* My Incidents List */}
                    <div className="flex-1 bg-surface-glass backdrop-blur-xl rounded-2xl p-6 border border-white/10 overflow-y-auto custom-scrollbar shadow-2xl">
                        <h3 className="text-sm font-bold mb-4 text-white flex items-center gap-2 uppercase tracking-wider">
                            <Activity size={16} className="text-crisis-cyan" />
                            Active Broadcasts
                        </h3>
                        {filteredCrises.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                                <Activity size={32} className="mb-2 opacity-20" />
                                <div className="text-xs font-mono uppercase">No active signals</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCrises.map(c => (
                                    <div key={c.id} className="p-4 bg-white/5 rounded-lg border-l-2 border-l-crisis-red hover:bg-white/10 transition-colors group cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-bold text-sm text-white group-hover:text-crisis-red transition-colors">{c.title}</div>
                                            <div className="text-[10px] font-mono text-gray-500">{new Date().toLocaleTimeString()}</div>
                                        </div>
                                        <div className="text-xs text-gray-400 mb-2 line-clamp-2">{c.description}</div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                {c.nearest_agencies?.map(a => (
                                                    <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{a.name}</span>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-crisis-red uppercase tracking-wide">{c.status}</span>
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