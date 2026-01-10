import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import EarthScene from './components/EarthScene';
import { CrisisMarkers } from './components/CrisisMarkers';
import CrisisDashboard from './components/CrisisDashboard';
import UIOverlay from './components/UIOverlay';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';

const MainApp = () => {
  const { user, loading, signOut } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [activeSection, setActiveSection] = useState('Overview');

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">Loading System...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="relative w-full h-screen bg-crisis-dark selection:bg-crisis-red/30 selection:text-white">
      {/* Global User Header */}
      <div className="absolute top-0 right-0 z-50 p-4 flex items-center gap-4">
        <div className="text-white/80 text-sm font-medium backdrop-blur-md bg-black/30 px-3 py-1 rounded-full border border-white/10">
          {user?.user_metadata?.full_name || 'Responder'}
        </div>
        <button
          onClick={signOut}
          className="bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md transition shadow-lg border border-red-500/50"
        >
          LOGOUT
        </button>
      </div>

      {/* 2D UI Layer */}
      <UIOverlay activeSection={activeSection} setActiveSection={setActiveSection} />

      {activeSection === 'Incidents' && (
        <div className="absolute inset-0 z-30 bg-gray-900">
          <CrisisDashboard />
        </div>
      )}

      {/* 3D Scene Layer - Hidden when Incidents or Analytics is active to save resources/focus */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${activeSection !== 'Overview' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
