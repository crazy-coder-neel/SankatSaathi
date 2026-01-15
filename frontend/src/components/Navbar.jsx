import React from 'react';
import { clsx } from 'clsx';
import { ShieldAlert, Activity, Users, ChevronDown, UserCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const Navbar = ({ isSystemOnline, onTestPush }) => {
    const { user, profile, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-auto lg:h-[80px] bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex flex-col">
            {/* Top Status Bar - Hidden on Mobile */}
            <div className="hidden lg:flex w-full h-[40px] border-b border-white/10 bg-glass-bg backdrop-blur-md pointer-events-auto items-center justify-between px-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full border border-crisis-red/50 shadow-[0_0_10px_#FF3B30]" />
                        <span className="text-sm font-display font-bold tracking-wider text-white px-2">SANKAT<span className="text-crisis-red">SAATHI</span></span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-[0.2em] uppercase">Global Response System v2.0</span>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={onTestPush}
                        className="text-[10px] font-mono text-crisis-cyan border border-crisis-cyan/30 px-2 py-0.5 hover:bg-crisis-cyan/10 transition-colors uppercase"
                    >
                        Test Push
                    </button>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSystemOnline ? 'bg-green-500 animate-none' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className={`text-[10px] font-mono ${isSystemOnline ? 'text-green-500' : 'text-red-500'}`}>
                            SYSTEM: {isSystemOnline ? 'ONLINE' : 'OFFLINE MODE'}
                        </span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 flex gap-2">
                        <span>UTC</span>
                        <span className="text-white">{new Date().toISOString().slice(11, 19)}</span>
                    </div>
                </div>
            </div>

            {/* Main Nav Container */}
            <div className="flex-1 px-4 lg:px-8 flex items-center justify-between pointer-events-auto backdrop-blur-sm bg-black/80 lg:bg-black/20 py-3 lg:py-0 border-b border-white/10 lg:border-none">

                {/* Mobile: Logo (Visible only on mobile/tablet where top bar is hidden) */}
                <div className="flex lg:hidden items-center gap-2">
                    <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full border border-crisis-red/30" />
                    <span className="font-bold text-white tracking-wider">SANKAT<span className="text-crisis-red">SAATHI</span></span>
                </div>

                {/* Desktop: Navigation Links */}
                <div className="hidden lg:flex items-center">
                    <Link
                        to="/"
                        className={clsx(
                            "relative h-10 px-6 text-sm font-medium transition-all duration-300 uppercase tracking-widest clip-path-slant flex items-center",
                            location.pathname === '/' ? "text-white" : "text-gray-500 hover:text-white"
                        )}
                    >
                        Overview
                        {location.pathname === '/' && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-crisis-red shadow-[0_0_10px_#FF3B30]"></span>
                        )}
                    </Link>
                    <Link
                        to="/intelligence"
                        className={clsx(
                            "relative h-10 px-6 text-sm font-medium transition-all duration-300 uppercase tracking-widest clip-path-slant flex items-center",
                            location.pathname === '/intelligence' ? "text-white" : "text-gray-500 hover:text-white"
                        )}
                    >
                        Incidents
                        {location.pathname === '/intelligence' && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-crisis-red shadow-[0_0_10px_#FF3B30]"></span>
                        )}
                    </Link>
                    <Link
                        to="/coordination"
                        className={clsx(
                            "relative h-10 px-6 text-sm font-medium transition-all duration-300 uppercase tracking-widest clip-path-slant flex items-center",
                            location.pathname === '/coordination' ? "text-white" : "text-gray-500 hover:text-white"
                        )}
                    >
                        Coordination
                        {location.pathname === '/coordination' && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-crisis-red shadow-[0_0_10px_#FF3B30]"></span>
                        )}
                    </Link>
                    <Link
                        to="/analytics"
                        className={clsx(
                            "relative h-10 px-6 text-sm font-medium transition-all duration-300 uppercase tracking-widest clip-path-slant flex items-center",
                            location.pathname === '/analytics' ? "text-white" : "text-gray-500 hover:text-white"
                        )}
                    >
                        Analytics
                        {location.pathname === '/analytics' && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-crisis-red shadow-[0_0_10px_#FF3B30]"></span>
                        )}
                    </Link>
                </div>

                {/* Desktop: Widgets & Profile */}
                <div className="hidden lg:flex items-center gap-4">
                    {/* Widget 1 */}
                    <div className="flex flex-col items-end border-r border-white/10 pr-4">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">Active Units</span>
                        <span className="text-lg font-mono font-bold text-crisis-cyan leading-none">2,405</span>
                    </div>

                    {/* Widget 2 */}
                    <div className="flex flex-col items-end border-r border-white/10 pr-4">
                        <span className="text-[10px] text-gray-500 font-mono uppercase">Critical</span>
                        <span className="text-lg font-mono font-bold text-crisis-red animate-pulse leading-none">12</span>
                    </div>

                    {/* Profile */}
                    <div className="flex items-center gap-3 pl-2 group cursor-pointer">
                        <div className="text-right">
                            <div className="text-xs font-bold text-white group-hover:text-crisis-red transition-colors uppercase">
                                {profile?.full_name || user?.user_metadata?.full_name || 'Agni'}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">ID: {user?.id?.slice(0, 6) || 'UNKNOWN'}</div>
                        </div>
                        <div className="relative">
                            <UserCircle className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="ml-4 px-3 py-1 border border-crisis-red/30 bg-crisis-red/10 text-crisis-red text-[10px] font-bold uppercase hover:bg-crisis-red hover:text-white transition-all duration-300 rounded-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile: Hamburger Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden text-white p-2"
                >
                    <div className="space-y-1.5">
                        <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                        <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </div>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 pointer-events-auto">
                    <div className="flex flex-col p-4 space-y-4">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-display text-gray-300 hover:text-white">OVERVIEW</Link>
                        <Link to="/intelligence" onClick={() => setIsMenuOpen(false)} className="text-lg font-display text-gray-300 hover:text-white">INCIDENTS</Link>
                        <Link to="/coordination" onClick={() => setIsMenuOpen(false)} className="text-lg font-display text-gray-300 hover:text-white">COORDINATION</Link>
                        <Link to="/analytics" onClick={() => setIsMenuOpen(false)} className="text-lg font-display text-gray-300 hover:text-white">ANALYTICS</Link>
                        <div className="h-[1px] bg-white/10 my-2"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">User: {profile?.full_name || 'Agni'}</span>
                            <button onClick={handleLogout} className="text-red-500 text-sm font-bold uppercase">Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
