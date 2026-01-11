import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import * as THREE from 'three';

// Components
import EarthScene from './components/EarthScene';
import { CrisisMarkers } from './components/CrisisMarkers';
import CrisisDashboard from './components/CrisisDashboard';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ResourcesPage from './pages/ResourcesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Login from './components/Login';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

const CameraController = () => {
  const location = useLocation();

  useFrame((state) => {
    // Smoothly move camera based on route to frame the earth appropriately
    // Landing Page: Earth on Right (x: 2)
    // Internal Pages: Earth in background/center but zoomed out or shifted

    const targetX = location.pathname === '/' ? 2 : 5; // Push further right on internal pages or keep centered background
    const targetZ = location.pathname === '/' ? 6.5 : 8; // Zoom out on internal pages

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.02);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.02);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

const MainApp = () => {
  const { user, loading, signOut } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [bootFlash, setBootFlash] = useState(false);

  useEffect(() => {
    if (isSystemOnline) {
      // 1. Trigger Visual Flash
      setBootFlash(true);
      setTimeout(() => setBootFlash(false), 500);

      // 2. Play Audio Cue (Futuristic Chirp)
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch (e) {
        console.error("Audio play failed", e);
      }
    }
  }, [isSystemOnline]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-crisis-deep text-crisis-red font-mono animate-pulse">
        INITIALIZING SANKATSAATHI SYSTEM...
      </div>
    );
  }

  // Allow bypassing login if keys are missing (demo mode) or if user is set
  const isAuthenticated = user || !import.meta.env.VITE_SUPABASE_URL;

  if (!isAuthenticated) return <Login />;

  return (
    <BrowserRouter>
      <div className="relative w-full h-screen bg-crisis-deep selection:bg-crisis-red/30 selection:text-white overflow-hidden">

        {/* 2D UI Layer */}
        <Navbar user={user} signOut={signOut} isSystemOnline={isSystemOnline} />

        {/* Content Routes - Scrollable Container for Pages */}
        <div className="absolute inset-0 pt-[80px] z-20 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<LandingPage onSystemInitialize={() => setIsSystemOnline(true)} />} />
            <Route path="/intelligence" element={<CrisisDashboard />} />
            <Route path="/coordination" element={<ResourcesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </div>

        {/* 3D Scene Layer (Persistent Background) */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
            <color attach="background" args={['#000000']} />

            {/* Cinematic Lighting - High Visibility */}
            <ambientLight intensity={1.5} color="#8080ff" />
            <spotLight position={[50, 50, 50]} angle={0.2} penumbra={1} intensity={50} color="#ffffff" />
            <pointLight position={[-20, 0, -20]} intensity={20} color="#ff3b30" /> {/* Red Rim */}
            <pointLight position={[20, 10, 20]} intensity={10} color="#40c9ff" /> {/* Cyan Fill */}

            <CameraController />

            <Suspense fallback={null}>
              <group rotation={[0, 0, 0]}>
                <EarthScene setRotation={setRotation} />
                <CrisisMarkers />
              </group>

              <Stars radius={200} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.3}
              target={[0, 0, 0]}
              minPolarAngle={Math.PI / 2 - 0.5}
              maxPolarAngle={Math.PI / 2 + 0.5}
            />
          </Canvas>
        </div>

        {/* VFX Overlays */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-40"></div>
        <div className="absolute inset-0 pointer-events-none z-10 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>

        {/* Boot Flash Effect */}
        <div className={`absolute inset-0 z-50 pointer-events-none bg-green-500/20 mix-blend-screen transition-opacity duration-500 ${bootFlash ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>
    </BrowserRouter>
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
