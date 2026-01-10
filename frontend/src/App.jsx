import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import EarthScene from './components/EarthScene';
import { CrisisMarkers } from './components/CrisisMarkers';
import CrisisDashboard from './components/CrisisDashboard';
import UIOverlay from './components/UIOverlay';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import * as THREE from 'three';

const CameraIntro = () => {
  const [finished, setFinished] = useState(false);

  useFrame((state) => {
    if (!finished && state.camera.position.z > 2.55) {
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 2.5, 0.02);
      state.camera.updateProjectionMatrix();
    } else if (!finished && state.camera.position.z <= 2.55) {
      setFinished(true); // Stop forcing position to allow orbit controls
    }
  });
  return null;
};

const MainApp = () => {
  const { user, loading, signOut } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [activeSection, setActiveSection] = useState('Overview');

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">Loading System...</div>;
  }

  // Allow bypassing login if keys are missing (demo mode) or if user is set
  // This is a temporary fix while we sort out the .env issue
  const isAuthenticated = user || !import.meta.env.VITE_SUPABASE_URL;

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="relative w-full h-screen bg-crisis-dark selection:bg-crisis-red/30 selection:text-white">
      {/* 2D UI Layer */}
      <UIOverlay
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        signOut={signOut}
      />

      {activeSection === 'Incidents' && (
        <div className="absolute inset-0 z-30 bg-gray-900">
          <CrisisDashboard />
        </div>
      )}

      {/* 3D Scene Layer - Hidden when Incidents or Analytics is active to save resources/focus */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${activeSection !== 'Overview' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}> {/* Start far away for intro */}
          <color attach="background" args={['#000000']} />

          {/* Enhanced Lighting for Brighter Earth */}
          <ambientLight intensity={3.5} color="#bbbbff" /> {/* Significantly boosted ambient */}
          <pointLight position={[10, 10, 10]} intensity={6} color="#ffffff" />
          <pointLight position={[-10, 10, 5]} intensity={2} color="#4444ff" /> {/* Blue rim light */}
          <pointLight position={[0, -10, 0]} intensity={1} color="#220000" /> {/* Subtle bottom fill */}

          <CameraIntro />

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
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] opacity-20"></div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
