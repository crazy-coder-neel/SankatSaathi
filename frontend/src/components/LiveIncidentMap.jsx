import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Icon
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
const incidentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const responderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const broadcastingUserIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) map.flyTo([lat, lon], 13);
    }, [lat, lon, map]);
    return null;
};

const LiveIncidentMap = ({ incidents, responders, broadcastingUsers, userLocation }) => {
    // Default center (New Delhi)
    const center = userLocation ? [userLocation.latitude, userLocation.longitude] : [28.6139, 77.2090];

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-600 shadow-lg relative z-10">
            <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location */}
                {userLocation && (
                    <Circle center={[userLocation.latitude, userLocation.longitude]} radius={5000} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
                )}

                {/* Recenter Helper */}
                <RecenterMap lat={center[0]} lon={center[1]} />

                {/* Incidents */}
                {incidents.map(inc => (
                    <Marker
                        key={inc.id}
                        position={[inc.latitude, inc.longitude]}
                        icon={incidentIcon}
                    >
                        <Popup>
                            <div className="text-gray-900">
                                <h3 className="font-bold text-red-600">{inc.title}</h3>
                                <p className="text-sm">{inc.description}</p>
                                <div className="text-xs font-mono mt-1 bg-gray-200 p-1 rounded">
                                    Severity: {inc.severity}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Responders */}
                {responders && responders.map(resp => (
                    <Marker
                        key={resp.id}
                        position={[resp.lat, resp.lon]}
                        icon={responderIcon}
                    >
                        <Popup>
                            <div className="text-gray-900">
                                <h3 className="font-bold text-green-600">{resp.name}</h3>
                                <p className="text-sm uppercase">{resp.type}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Broadcasting Users (SOS) */}
                {broadcastingUsers && broadcastingUsers.map(u => (
                    <Marker
                        key={u.id}
                        position={[u.last_latitude, u.last_longitude]}
                        icon={broadcastingUserIcon}
                    >
                        <Popup>
                            <div className="text-gray-900">
                                <h3 className="font-bold text-yellow-600">🆘 SOS: {u.full_name}</h3>
                                <p className="text-xs">Location shared in real-time</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveIncidentMap;
