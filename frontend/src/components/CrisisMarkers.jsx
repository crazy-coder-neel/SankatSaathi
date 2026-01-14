import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

function Marker({ position, type, label }) {
    const ref = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Pulse effect
        if (ref.current) {
            ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.2);
        }
    });

    // Color logic
    const color = type === 'critical' ? '#ff2a2a' : (type === 'warning' ? '#ff8800' : '#00ff41');

    return (
        <group position={position}>
            {/* 3D Pulse Circle */}
            <mesh ref={ref}>
                <ringGeometry args={[0.02, 0.03, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
            <mesh>
                <circleGeometry args={[0.015, 32]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Optional HTML Label on hover/always */}
            {/* <Html distanceFactor={10}>
                <div className="text-xs bg-black/50 p-1 rounded text-white whitespace-nowrap backdrop-blur-sm">
                    {label}
                </div>
            </Html> */}
        </group>
    );
}

// Helper to convert Lat/Lon to Vector3
const latLonToVector3 = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return [x, y, z];
}

export const CrisisMarkers = () => {
    const [incidents, setIncidents] = React.useState([]);

    React.useEffect(() => {
        const fetchMarkers = async () => {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            console.log(`Fetching markers from: ${apiUrl}/crisis/active`);

            try {
                const res = await fetch(`${apiUrl}/crisis/active`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();
                const crises = data.crises || [];

                const mapped = crises.map(c => ({
                    id: c.id,
                    lat: c.latitude,
                    lon: c.longitude,
                    type: c.severity,
                    label: c.title
                }));

                if (mapped.length > 0) {
                    setIncidents(mapped);
                } else {
                    console.warn("No active crises found on server.");
                    // Optional: keep empty or set defaults only if truly needed
                }
            } catch (err) {
                console.error("FAILED to fetch markers:", err);
                console.error("Ensure Backend is running on port 8000");
                // Fallback defaults for demo if backend is down
                setIncidents([
                    { id: 'demo-1', lat: 40.7128, lon: -74.0060, type: 'critical', label: 'Backend Offline (Demo)' },
                    { id: 'demo-2', lat: 28.6139, lon: 77.2090, type: 'warning', label: 'Check Console' }
                ]);
            }
        };

        fetchMarkers();
        // Poll every 10 seconds
        const interval = setInterval(fetchMarkers, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <group rotation={[0, 0, 23.5 * Math.PI / 180]}>
            {incidents.map((incident) => (
                <Marker
                    key={incident.id}
                    position={latLonToVector3(incident.lat, incident.lon, 1.01)}
                    type={incident.type}
                    label={incident.label}
                />
            ))}
        </group>
    )
}
