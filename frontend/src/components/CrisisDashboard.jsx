import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { AlertTriangle, Ambulance, Clock, Users, Radio } from 'lucide-react';

// Fix for default icons in Leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const CrisisDashboard = () => {
  const [crisisForm, setCrisisForm] = useState({
    title: '',
    description: '',
    crisis_type: 'medical',
    severity: 'medium',
    latitude: 28.6139,
    longitude: 77.2090,
    contact_number: '',
    reported_by: ''
  });
  
  const [activeCrises, setActiveCrises] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [selectedCrisis, setSelectedCrisis] = useState(null);
  const [socket, setSocket] = useState(null);
  const mapRef = useRef(null);

  // Agency icons
  const agencyIcons = {
    medical: new Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1998/1998678.png', iconSize: [32, 32] }),
    fire: new Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/599/599395.png', iconSize: [32, 32] }),
    police: new Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/4323/4323388.png', iconSize: [32, 32] }),
    rescue: new Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2784/2784449.png', iconSize: [32, 32] })
  };

  // Crisis severity colors
  const severityColors = {
    critical: '#ff0000',
    high: '#ff6b00',
    medium: '#ffc107',
    low: '#28a745'
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket('ws://localhost:8000/ws/dashboard');
    
    ws.onopen = () => {
      console.log('Dashboard WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'INITIAL_STATE':
          setActiveCrises(data.active_crises);
          setAgencies(data.agencies);
          break;
        
        case 'NEW_CRISIS':
          setActiveCrises(prev => [...prev, data.crisis]);
          setSelectedCrisis(data.crisis);
          break;
        
        case 'AGENCY_RESPONSE':
          setActiveCrises(prev => 
            prev.map(crisis => 
              crisis.id === data.crisis_id ? data.crisis : crisis
            )
          );
          break;
        
        case 'LOCATION_UPDATE':
          setActiveCrises(prev =>
            prev.map(crisis => {
              if (crisis.id === data.crisis_id) {
                return {
                  ...crisis,
                  location_updates: [...crisis.location_updates, data.update]
                };
              }
              return crisis;
            })
          );
          break;
      }
    };
    
    setSocket(ws);
    
    // Fetch initial data
    fetchActiveCrises();
    fetchAgencies();
    
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const fetchActiveCrises = async () => {
    try {
      const response = await fetch('http://localhost:8000/crises/active');
      const data = await response.json();
      setActiveCrises(data.crises);
    } catch (error) {
      console.error('Error fetching crises:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const response = await fetch('http://localhost:8000/agencies/nearby?lat=28.6139&lon=77.2090');
      const data = await response.json();
      setAgencies(data.agencies);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleSubmitCrisis = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/crisis/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(crisisForm),
      });
      
      const data = await response.json();
      alert(`Alert created! Crisis ID: ${data.crisis_id}\nNotifying: ${data.agencies_notified.join(', ')}`);
      
      // Reset form
      setCrisisForm({
        title: '',
        description: '',
        crisis_type: 'medical',
        severity: 'medium',
        latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
        contact_number: '',
        reported_by: ''
      });
    } catch (error) {
      console.error('Error submitting crisis:', error);
      alert('Failed to submit crisis alert');
    }
  };

  const simulateAgencyResponse = async (crisisId, agencyId, agencyName) => {
    const response = {
      agency_id: agencyId,
      agency_name: agencyName,
      eta_minutes: Math.floor(Math.random() * 15) + 5,
      capacity: Math.floor(Math.random() * 5) + 1,
      accepts: true
    };
    
    try {
      await fetch(`http://localhost:8000/crisis/${crisisId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });
    } catch (error) {
      console.error('Error simulating response:', error);
    }
  };

  const getCrisisIcon = (severity) => {
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${severityColors[severity]}" width="32" height="32">
          <circle cx="12" cy="12" r="10" fill="${severityColors[severity]}" opacity="0.3"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      `)}`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AlertTriangle size={32} />
            <div>
              <h1 className="text-2xl font-bold">🚨 CrisisNet Dispatch</h1>
              <p className="text-sm opacity-90">Real-time Emergency Response System</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{activeCrises.length} Active Crises</div>
            <div className="text-sm">Live Tracking Enabled</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Crisis Form & List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Crisis Report Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <AlertTriangle className="mr-2" /> Report Emergency
            </h2>
            
            <form onSubmit={handleSubmitCrisis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Emergency Title</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-lg"
                  value={crisisForm.title}
                  onChange={(e) => setCrisisForm({...crisisForm, title: e.target.value})}
                  placeholder="e.g., Car Accident, Fire, Medical Emergency"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  className="w-full p-2 border rounded-lg"
                  rows="3"
                  value={crisisForm.description}
                  onChange={(e) => setCrisisForm({...crisisForm, description: e.target.value})}
                  placeholder="Provide details about the emergency..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={crisisForm.crisis_type}
                    onChange={(e) => setCrisisForm({...crisisForm, crisis_type: e.target.value})}
                  >
                    <option value="medical">Medical</option>
                    <option value="fire">Fire</option>
                    <option value="accident">Accident</option>
                    <option value="crime">Crime</option>
                    <option value="natural_disaster">Natural Disaster</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={crisisForm.severity}
                    onChange={(e) => setCrisisForm({...crisisForm, severity: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    className="w-full p-2 border rounded-lg"
                    value={crisisForm.contact_number}
                    onChange={(e) => setCrisisForm({...crisisForm, contact_number: e.target.value})}
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded-lg"
                    value={crisisForm.reported_by}
                    onChange={(e) => setCrisisForm({...crisisForm, reported_by: e.target.value})}
                    placeholder="Reporter name"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
              >
                <Radio className="mr-2" size={20} />
                SEND EMERGENCY ALERT
              </button>
            </form>
          </div>

          {/* Active Crises List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Active Crises</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeCrises.map((crisis) => (
                <div
                  key={crisis.id}
                  className={`p-3 rounded-lg border-l-4 cursor-pointer transition hover:shadow-md ${
                    selectedCrisis?.id === crisis.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50'
                  }`}
                  style={{ borderLeftColor: severityColors[crisis.severity] }}
                  onClick={() => setSelectedCrisis(crisis)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{crisis.title}</div>
                      <div className="text-sm text-gray-600">{crisis.crisis_type.toUpperCase()}</div>
                    </div>
                    <span
                      className="px-2 py-1 text-xs font-bold rounded-full text-white"
                      style={{ backgroundColor: severityColors[crisis.severity] }}
                    >
                      {crisis.severity}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <Clock size={14} className="mr-1" />
                    <span className="text-gray-600">
                      {new Date(crisis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Users size={14} className="ml-3 mr-1" />
                    <span>{crisis.accepted_agencies?.length || 0}/{crisis.agencies_needed?.total || 1} agencies</span>
                  </div>
                </div>
              ))}
              
              {activeCrises.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="mx-auto mb-2" size={32} />
                  <p>No active crises. Report an emergency to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Map & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Live Response Map</h2>
              <p className="text-sm text-gray-600">Real-time tracking of emergencies and response units</p>
            </div>
            
            <div className="h-[500px] relative">
              <MapContainer
                center={[28.6139, 77.2090]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Plot agencies */}
                {agencies.map((agency) => (
                  <Marker
                    key={agency.id}
                    position={[agency.lat, agency.lon]}
                    icon={agencyIcons[agency.type] || agencyIcons.medical}
                  >
                    <Popup>
                      <div className="font-bold">{agency.name}</div>
                      <div>Type: {agency.type}</div>
                      <div>Capacity: {agency.capacity}</div>
                      <div>Distance: {agency.distance_km} km</div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Plot active crises */}
                {activeCrises.map((crisis) => (
                  <React.Fragment key={crisis.id}>
                    <Marker
                      position={[crisis.latitude, crisis.longitude]}
                      icon={getCrisisIcon(crisis.severity)}
                      eventHandlers={{
                        click: () => setSelectedCrisis(crisis),
                      }}
                    >
                      <Popup>
                        <div>
                          <div className="font-bold text-lg">{crisis.title}</div>
                          <div className="text-sm">{crisis.crisis_type.toUpperCase()} • {crisis.severity.toUpperCase()}</div>
                          <div className="mt-2">{crisis.description}</div>
                          <div className="mt-2 text-sm">
                            Reported by: {crisis.reported_by}<br/>
                            Contact: {crisis.contact_number}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Draw circles for severity */}
                    <Circle
                      center={[crisis.latitude, crisis.longitude]}
                      radius={crisis.severity === 'critical' ? 500 : crisis.severity === 'high' ? 300 : 150}
                      pathOptions={{
                        color: severityColors[crisis.severity],
                        fillColor: severityColors[crisis.severity],
                        fillOpacity: 0.1,
                        weight: 2
                      }}
                    />
                    
                    {/* Draw lines to responding agencies */}
                    {crisis.accepted_agencies?.map((agency) => {
                      const agencyData = agencies.find(a => a.id === agency.agency_id);
                      if (!agencyData) return null;
                      
                      return (
                        <Polyline
                          key={`${crisis.id}-${agency.agency_id}`}
                          positions={[
                            [crisis.latitude, crisis.longitude],
                            [agencyData.lat, agencyData.lon]
                          ]}
                          pathOptions={{
                            color: '#3b82f6',
                            weight: 3,
                            opacity: 0.6,
                            dashArray: '10, 10'
                          }}
                        >
                          <Tooltip permanent>
                            <div className="font-bold">{agency.agency_name}</div>
                            <div>ETA: {agency.eta_minutes} mins</div>
                          </Tooltip>
                        </Polyline>
                      );
                    })}
                  </React.Fragment>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Selected Crisis Details */}
          {selectedCrisis && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedCrisis.title}</h2>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="px-3 py-1 rounded-full text-white font-bold" 
                          style={{backgroundColor: severityColors[selectedCrisis.severity]}}>
                      {selectedCrisis.severity.toUpperCase()}
                    </span>
                    <span className="text-gray-600">{selectedCrisis.crisis_type.toUpperCase()}</span>
                    <span className="text-gray-600">
                      {new Date(selectedCrisis.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedCrisis.accepted_agencies?.length || 0}/{selectedCrisis.agencies_needed?.total || 1}
                  </div>
                  <div className="text-sm text-gray-600">Agencies Responding</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">Emergency Details</h3>
                  <p className="text-gray-700 mb-4">{selectedCrisis.description}</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Reporter:</span> {selectedCrisis.reported_by}</div>
                    <div><span className="font-medium">Contact:</span> {selectedCrisis.contact_number}</div>
                    <div><span className="font-medium">Location:</span> {selectedCrisis.latitude.toFixed(4)}, {selectedCrisis.longitude.toFixed(4)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-3">Response Coordination</h3>
                  
                  {/* Nearby Agencies */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Nearby Agencies</h4>
                      <span className="text-sm text-gray-600">Top {selectedCrisis.nearest_agencies?.length || 0} closest</span>
                    </div>
                    <div className="space-y-2">
                      {selectedCrisis.nearest_agencies?.map((agency, index) => (
                        <div key={agency.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <Ambulance size={16} className="mr-2 text-gray-600" />
                            <div>
                              <div className="font-medium">{agency.name}</div>
                              <div className="text-xs text-gray-600">{agency.type} • {agency.distance_km} km</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{agency.eta_minutes} min</div>
                            <button
                              onClick={() => simulateAgencyResponse(selectedCrisis.id, agency.id, agency.name)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                            >
                              Simulate Accept
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Accepted Agencies */}
                  {selectedCrisis.accepted_agencies && selectedCrisis.accepted_agencies.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Responding Agencies</h4>
                      <div className="space-y-2">
                        {selectedCrisis.accepted_agencies.map((agency) => (
                          <div key={agency.agency_id} className="p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex justify-between">
                              <div className="font-medium">{agency.agency_name}</div>
                              <div className="font-bold text-green-600">ETA: {agency.eta_minutes} min</div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Accepted at: {new Date(agency.accepted_at).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.setView(
                        [selectedCrisis.latitude, selectedCrisis.longitude],
                        16
                      );
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Zoom to Location
                </button>
                <button
                  onClick={() => {
                    selectedCrisis.nearest_agencies?.slice(0, 3).forEach(agency => {
                      simulateAgencyResponse(selectedCrisis.id, agency.id, agency.name);
                    });
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Simulate Multi-Agency Response
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-2 flex justify-between items-center text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>WebSocket: Connected</span>
          </div>
          <div className="hidden md:block">
            {activeCrises.length} active • {agencies.length} agencies online
          </div>
        </div>
        <div className="text-xs opacity-75">
          CrisisNet Dispatch v1.0 • Real-time tracking active
        </div>
      </div>
    </div>
  );
};

export default CrisisDashboard;