import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useEarthTextures } from '../hooks/useEarthTextures';

const EarthScene = ({ setRotation }) => {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const groupRef = useRef();

    // Load textures
    const { colorMap, normalMap, specularMap, cloudsMap, lightsMap } = useEarthTextures();

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();

        // Rotate Earth slowly
        if (earthRef.current) {
            earthRef.current.rotation.y = elapsedTime / 10;
        }

        // Rotate Clouds slightly faster/independently
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsedTime / 8;
        }
    });

    return (
        <group ref={groupRef} rotation={[0, 0, 23.5 * Math.PI / 180]} >
            {/* Atmosphere Glow */}
            <mesh scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial
                    color="#4db5ff"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Clouds Layer */}
            <mesh ref={cloudsRef} scale={[1.005, 1.005, 1.005]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    map={cloudsMap}
                    transparent={true}
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Earth Sphere */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Night Lights (Optional - overlay) */}
            <mesh scale={[1.001, 1.001, 1.001]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial
                    map={lightsMap}
                    transparent={true}
                    opacity={0.5}
                    blending={THREE.AdditiveBlending}
                    color="#ffccaa" // Tint lights slightly
                />
            </mesh>

        </group>
    );
};

export default EarthScene;
