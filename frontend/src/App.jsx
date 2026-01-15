import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import * as THREE from 'three';

// Helper for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Components
import EarthScene from './components/EarthScene';
import { CrisisMarkers } from './components/CrisisMarkers';
import CrisisDashboard from './components/CrisisDashboard';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ResourcesPage from './pages/ResourcesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Login from './components/Login';
import IncidentReport from './components/IncidentReport';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

const CameraController = () => {
  const location = useLocation();
  const { camera } = useThree();

  useEffect(() => {
    // Target position based on route
    const targetX = location.pathname === '/landing' ? 2.5 : 5;
    const targetZ = location.pathname === '/landing' ? 5.0 : 8;

    // Animate camera to new position
    let startX = camera.position.x;
    let startZ = camera.position.z;
    let startTime = Date.now();
    let duration = 1500; // 1.5s transition

    const animate = () => {
      let now = Date.now();
      let progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      let ease = 1 - Math.pow(1 - progress, 3);

      camera.position.x = startX + (targetX - startX) * ease;
      camera.position.z = startZ + (targetZ - startZ) * ease;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();

  }, [location, camera]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  // If no user and Supabase is configured, redirect to login
  const isAuthRequired = !!import.meta.env.VITE_SUPABASE_URL;

  if (isAuthRequired && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const MainApp = () => {
  const { user, loading, signOut } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [bootFlash, setBootFlash] = useState(false);
  const location = useLocation();

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

  // --- Push Notification Registration ---
  useEffect(() => {
    const registerPush = async () => {
      if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          const sw = registration || await navigator.serviceWorker.register('/sw.js');

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;

          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const subscription = await sw.pushManager.getSubscription() || await sw.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
            });

            // Sync with backend
            const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            await fetch(`${apiUrl}/api/crisis/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                subscription: subscription
              })
            });
            console.log("Push System: OPERATIONAL");
          } else {
            console.warn("Push System: Permission DENIED");
          }
        } catch (err) {
          console.error("Push registration error:", err);
        }
      } else {
        console.warn("Push System: Browser NOT SUPPORTED / Secure Context Required");
      }
    };
    registerPush();
  }, [user]);

  // --- Global Location Tracking for Notifications ---
  useEffect(() => {
    let watchId = null;
    if (user && navigator.geolocation) {
      console.log("Location System: INITIALIZING");
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const { error } = await supabase
            .from('profiles')
            .update({
              last_latitude: latitude,
              last_longitude: longitude
            })
            .eq('id', user.id);

          if (error) console.error("Location System Error:", error);
          else console.log("Location System: SYNCED", { latitude, longitude });
        },
        (err) => console.error("Location System Denied:", err.message),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-crisis-deep text-crisis-red font-mono animate-pulse">
        INITIALIZING SANKATSAATHI SYSTEM...
      </div>
    );
  }

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="relative w-full h-screen bg-crisis-deep selection:bg-crisis-red/30 selection:text-white overflow-hidden">

      {/* 2D UI Layer - Navbar only shows if NOT on login page */}
      {!isLoginPage && <Navbar user={user} signOut={signOut} isSystemOnline={isSystemOnline} />}

      {/* Content Routes - Scrollable Container for Pages */}
      <div className={`absolute inset-0 ${!isLoginPage ? 'pt-[80px]' : ''} z-20 overflow-y-auto custom-scrollbar pointer-events-none`}>
        <div className="pointer-events-auto min-h-full">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="/landing" element={<LandingPage onSystemInitialize={() => setIsSystemOnline(true)} />} />
            <Route path="/login" element={user ? <Navigate to="/landing" /> : <Login />} />

            {/* Protected Routes */}
            <Route path="/intelligence" element={
              <ProtectedRoute>
                <CrisisDashboard />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <IncidentReport />
              </ProtectedRoute>
            } />
            <Route path="/coordination" element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>

      {/* 3D Scene Layer (Persistent Background) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
          <color attach="background" args={['#000000']} />

          {/* Cinematic Lighting */}
          <ambientLight intensity={1.5} color="#8080ff" />
          <spotLight position={[50, 50, 50]} angle={0.2} penumbra={1} intensity={50} color="#ffffff" />
          <pointLight position={[-20, 0, -20]} intensity={20} color="#ff3b30" />
          <pointLight position={[20, 10, 20]} intensity={10} color="#40c9ff" />

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
            enableRotate={true}
            rotateSpeed={0.5}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* VFX Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-40"></div>
      <div className="absolute inset-0 pointer-events-none z-10 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>

      {/* Boot Flash Effect */}
      <div className={`absolute inset-0 z-50 pointer-events-none bg-green-500/20 mix-blend-screen transition-opacity duration-500 ${bootFlash ? 'opacity-100' : 'opacity-0'}`}></div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
