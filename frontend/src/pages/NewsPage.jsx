import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, AlertTriangle, Radio, Activity, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiEndpoint } from '../lib/api';

const NewsPage = () => {
    const { user } = useAuth();
    const [location, setLocation] = useState('India');
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([
        "> Initializing AI protocols...",
        "> Neural net active.",
        "> Waiting for target coordinates..."
    ]);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    const fetchNews = async (searchLocation = location, forceRefresh = false) => {
        setLoading(true);
        setError(null);
        addLog(`> Initiating scan sequence for sector: "${searchLocation.toUpperCase()}"...`);

        try {
            // 1. Trigger Fetch (POST)
            if (forceRefresh) {
                const url = getApiEndpoint('news/fetch-news');
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ location: searchLocation })
                });

                if (!res.ok) throw new Error("Satellite link unstable (API Error)");
                const data = await res.json();
                addLog(`> Scan complete. ${data.new_articles_count} new intel packets acquired.`);
            }

            // 2. Get Data (GET)
            const url = getApiEndpoint(`news?location=${encodeURIComponent(searchLocation)}`);
            console.log('Fetching news from:', url);
            const getRes = await fetch(url);
            if (!getRes.ok) {
                console.error('News fetch failed:', getRes.status, getRes.statusText);
                throw new Error("Data retrieval failed");
            }

            const data = await getRes.json();
            console.log('News data received:', data.length, 'articles');
            setNews(data);
            setLastUpdated(new Date().toLocaleTimeString());
            addLog(`> Visual matrix updated. ${data.length} items loaded.`);

            if (data.length === 0) {
                addLog("> No local anomalies data found.");
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
            addLog(`> CRITICAL FAILURE: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load - Try to get user location
    useEffect(() => {
        const init = async () => {
            addLog("> Requesting operator coordinates...");
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        addLog(`> Coordinates locked: [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);

                        // Reverse Geocode
                        try {
                            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                            const data = await res.json();
                            const city = data.city || data.locality || data.principalSubdivision || "India";
                            setLocation(city);
                            addLog(`> Sector identified: ${city.toUpperCase()}`);
                            fetchNews(city, true); // Auto-fetch on load
                        } catch (e) {
                            addLog("> Geocode uplink failed. Defaulting to sector: INDIA");
                            fetchNews("India", true);
                        }
                    },
                    (err) => {
                        addLog("> Geolocation denied. Defaulting to sector: INDIA");
                        fetchNews("India", true);
                    }
                );
            } else {
                fetchNews("India", true);
            }
        };
        init();
    }, []);

    const handleScan = (e) => {
        e.preventDefault();
        fetchNews(location, true);
    };

    const getBadgeColor = (category) => {
        switch (category?.toLowerCase()) {
            case 'flood': return 'bg-blue-600/80 text-white border-blue-400';
            case 'earthquake': return 'bg-purple-600/80 text-white border-purple-400';
            case 'wildfire':
            case 'fire': return 'bg-orange-600/80 text-white border-orange-400';
            case 'cyclone':
            case 'storm': return 'bg-cyan-600/80 text-white border-cyan-400';
            default: return 'bg-gray-600/80 text-white border-gray-400';
        }
    };

    return (
        <div className="min-h-screen w-full bg-black/40 pt-20 pb-12 px-4 md:px-8">
            <div className="container mx-auto">

                {/* Header */}
                <div className="mb-8 border-b border-white/10 pb-6">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-crisis-cyan to-white mb-2">
                        SANKET.SATHI_AI
                    </h1>
                    <div className="flex items-center gap-4 text-sm font-mono">
                        <span className="text-crisis-cyan flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            SYSTEM ONLINE // MONITORING GLOBAL FEEDS
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT PANEL: CONTROLS */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Control Deck */}
                        <div className="p-6 bg-[#0f172a]/90 backdrop-blur-md border border-crisis-cyan/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            <label className="text-xs font-mono text-crisis-cyan mb-2 block">&gt; DEFINE PROXIMITY PARAMETERS</label>

                            <form onSubmit={handleScan} className="flex gap-0 mb-6 group">
                                <div className="p-3 bg-black/50 border border-crisis-cyan border-r-0 rounded-l-lg text-crisis-cyan">
                                    <Globe size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="flex-1 bg-black/50 border-y border-crisis-cyan text-white px-4 font-mono focus:outline-none focus:bg-black/70 transition-colors uppercase"
                                    placeholder="SECTOR NAME"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 bg-crisis-cyan text-black font-bold font-mono border border-crisis-cyan rounded-r-lg hover:bg-white hover:text-crisis-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Activity className="animate-spin" size={18} /> : 'SCAN'}
                                </button>
                            </form>

                            <label className="text-xs font-mono text-gray-500 mb-2 block flex items-center gap-2">
                                <Terminal size={12} /> AGENT LOGS_
                            </label>
                            <div className="h-48 bg-black/80 border border-dashed border-gray-700 rounded p-3 font-mono text-xs overflow-y-auto custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1 text-green-500/80 break-words leading-tight">
                                        {log}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                                {!loading && <span className="text-green-500 animate-pulse">_</span>}
                            </div>
                        </div>

                        {/* Stats / Info */}
                        <div className="p-6 bg-black/40 border border-white/5 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-sm font-mono">THREAT LEVELS</span>
                                <AlertTriangle className="text-crisis-red" size={16} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>SEISMIC ACTIVITY</span>
                                    <div className="w-24 h-1 bg-gray-800 rounded overflow-hidden">
                                        <div className="h-full bg-yellow-500 w-[30%]"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>FLOOD RISK</span>
                                    <div className="w-24 h-1 bg-gray-800 rounded overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[65%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: NEWS GRID */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-crisis-red font-bold text-lg">/// INTELLIGENCE FEED</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${loading ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-crisis-cyan/10 border-crisis-cyan text-crisis-cyan'}`}>
                                    {loading ? 'SCANNING...' : `SECTOR: ${location.toUpperCase()}`}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                                LAST UPDATED: {lastUpdated || '--:--:--'}
                            </span>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500 text-red-500 rounded-lg mb-6 flex items-center gap-3">
                                <AlertTriangle /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {news.length === 0 && !loading && !error && (
                                <div className="col-span-full py-12 text-center border border-dashed border-gray-700 rounded-xl">
                                    <p className="text-gray-500 font-mono">&gt;&gt; NO THREATS DETECTED IN MONITORING WINDOW</p>
                                </div>
                            )}

                            {news.map((item, idx) => (
                                <div key={idx} className="group relative bg-[#0f172a] border border-gray-800 hover:border-crisis-cyan/50 rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                                    {/* Category Badge */}
                                    <div className={`absolute top-3 right-3 z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getBadgeColor(item.category)}`}>
                                        {item.category}
                                    </div>

                                    {/* Distance Badge */}
                                    {item.distance_km && item.distance_km < 10000 && (
                                        <div className="absolute top-3 left-3 z-10 px-2 py-1 text-[10px] font-bold bg-black/70 text-green-400 border border-green-500/50 rounded backdrop-blur-sm">
                                            {item.distance_km} KM AWAY
                                        </div>
                                    )}

                                    {/* Image */}
                                    <div className="h-48 w-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                                        <img
                                            src={item.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400/000000/FFFFFF?text=IMG_ERR'; }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3 text-[10px] text-gray-500 font-mono border-b border-gray-800 pb-2">
                                            <span>SRC: {item.source_name?.toUpperCase() || 'UNKNOWN'}</span>
                                            <span>{new Date(item.published_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-crisis-cyan transition-colors">
                                            <a href={item.article_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {item.title}
                                            </a>
                                        </h3>
                                        <p className="text-gray-400 text-sm line-clamp-3">
                                            {item.description || 'Data packet received. Access full link for details.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsPage;
