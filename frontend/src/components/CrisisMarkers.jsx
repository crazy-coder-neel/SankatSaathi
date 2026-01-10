import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

function Marker({ position, type, label }) {
    const ref = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Pulse effect
        if (ref.current) {
            ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.2);
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
    // Example Data: Lat, Lon, Type
    const incidents = [
        { id: 1, lat: 40.7128, lon: -74.0060, type: 'critical', label: 'NYC Flooding' }, // NYC
        { id: 2, lat: 35.6762, lon: 139.6503, type: 'warning', label: 'Tokyo Tremor' }, // Tokyo
        { id: 3, lat: 28.6139, lon: 77.2090, type: 'critical', label: 'Delhi Heatwave' }, // Delhi
        { id: 4, lat: -33.8688, lon: 151.2093, type: 'resolved', label: 'Sydney Fire' }, // Sydney
        { id: 5, lat: 51.5074, lon: -0.1278, type: 'warning', label: 'London Grid' }, // London
    ];

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
