import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import EarthScene from './components/EarthScene';
import { CrisisMarkers } from './components/CrisisMarkers';
import CrisisDashboard from './components/CrisisDashboard';
import UIOverlay from './components/UIOverlay';

function App() {
  const [rotation, setRotation] = useState(0);

  return (
    <div className="relative w-full h-screen bg-crisis-dark selection:bg-crisis-red/30 selection:text-white">
      <CrisisDashboard />
      {/* 2D UI Layer */}
      <UIOverlay />

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
          <color attach="background" args={['#050505']} />

          <ambientLight intensity={1.5} color="#8888ff" />
          <pointLight position={[10, 10, 10]} intensity={4} color="#ffffff" />
          <pointLight position={[-10, -10, -5]} intensity={1} color="#ff0000" /> {/* Red ambient fill for drama */}

          <Suspense fallback={null}>
            <group rotation={[0, 0, 0]}>
              <EarthScene setRotation={setRotation} />
              <CrisisMarkers />
            </group>
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          </Suspense>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            rotateSpeed={0.5}
            zoomSpeed={0.6}
            minDistance={1.5}
            maxDistance={5}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Vignette / Grain Overlay for cinematic feel */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[url('/noise.svg')] opacity-10 brightness-150 contrast-150 mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] opacity-40"></div>
    </div>
  );
}

export default App;
