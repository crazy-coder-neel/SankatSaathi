import React from 'react';
import { Shield, Activity, Globe, Zap, Users, BarChart3, Mail, Phone, MapPin } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur-sm group">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
            <Icon className="text-red-400 group-hover:text-red-300" size={24} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const LandingPage = () => {
    return (
        <div className="w-full text-white">
            {/* Hero Spacer - Allows 3D Earth to be visible and interactable */}
            {/* pointer-events-none allows clicking through to the canvas */}
            <div className="h-screen w-full flex flex-col justify-end pb-32 px-10 pointer-events-none">
                <div className="max-w-4xl z-10">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                        PLANETARY <br /> <span className="text-red-500">RESILIENCE</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-2xl font-light border-l-4 border-red-500 pl-6">
                        Advanced crisis coordination and real-time global monitoring system for the next generation of emergency response.
                    </p>
                </div>
            </div>

            {/* Content Section - Opaque background to cover the fixed 3D scene */}
            <div className="relative z-20 bg-gray-900 border-t border-white/10 shadow-[0_-50px_100px_rgba(0,0,0,1)]">

                {/* Features Grid */}
                <section className="py-20 px-6 md:px-20 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-red-500 trackingwidest uppercase mb-2">System Capabilities</h2>
                        <h3 className="text-4xl font-bold">Integrated Crisis Response</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Globe}
                            title="Global Visualization"
                            desc="Real-time 3D geospatial rendering of incident data, optimizing situational awareness for command centers."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Instant Deployment"
                            desc="Automated resource allocation algorithms reduce response times by up to 45% in critical zones."
                        />
                        <FeatureCard
                            icon={Activity}
                            title="Live Telemetry"
                            desc="Continuous monitoring of vital infrastructure and seismic sensors via low-latency websocket streams."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Secure Coordination"
                            desc="End-to-end encrypted communication channels for agencies, first responders, and affected civilians."
                        />
                        <FeatureCard
                            icon={Users}
                            title="Community Grid"
                            desc="Decentralized volunteer network integration allowing local rapid-response before official units arrive."
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Predictive Analytics"
                            desc="AI-driven severity forecasting helping to prevent cascading failures during major disasters."
                        />
                    </div>
                </section>

                {/* About / Mission */}
                <section className="py-20 bg-black/20">
                    <div className="max-w-7xl mx-auto px-6 md:px-20 flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1">
                            <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 relative group">
                                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition duration-700" alt="Space View" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                                <div className="absolute bottom-6 left-6">
                                    <div className="text-xs text-red-500 font-mono mb-1">LIVE FEED // SAT-4</div>
                                    <div className="font-bold text-xl">Orbital Reconnaissance</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-6">
                            <h2 className="text-4xl font-bold leading-tight">Bridging the Gap Between <span className="text-blue-500">Data</span> and <span className="text-red-500">Rescue</span>.</h2>
                            <p className="text-gray-400 leading-relaxed">
                                SankatSaathi isn't just a dashboard; it's a nervous system for planet Earth. By aggregating data from IoT sensors, social streams, and official channels, we provide a unified operating picture that saves lives.
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="p-4 border border-white/10 rounded-xl">
                                    <div className="text-3xl font-bold text-white mb-1">2.4s</div>
                                    <div className="text-xs text-gray-500 uppercase">Avg. Latency</div>
                                </div>
                                <div className="p-4 border border-white/10 rounded-xl">
                                    <div className="text-3xl font-bold text-white mb-1">100+</div>
                                    <div className="text-xs text-gray-500 uppercase">Agencies Connected</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 bg-black py-12">
                    <div className="max-w-7xl mx-auto px-6 md:px-20 grid grid-cols-1 md:grid-cols-4 gap-10">
                        <div className="col-span-1 md:col-span-2">
                            <h2 className="text-2xl font-bold tracking-wider text-white mb-4">CRISIS<span className="text-crisis-red">NET</span></h2>
                            <p className="text-gray-500 text-sm max-w-sm">
                                Empowering humanity with the tools to predict, prepare for, and persevere through the challenges of tomorrow.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="hover:text-red-400 cursor-pointer">Live Map</li>
                                <li className="hover:text-red-400 cursor-pointer">Analytics</li>
                                <li className="hover:text-red-400 cursor-pointer">API Access</li>
                                <li className="hover:text-red-400 cursor-pointer">System Status</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex items-center gap-2"><Mail size={14} /> emergency@sankat.org</li>
                                <li className="flex items-center gap-2"><Phone size={14} /> +91 1800-CRISIS</li>
                                <li className="flex items-center gap-2"><MapPin size={14} /> New Delhi, HQ</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
                        &copy; 2026 SankatSaathi Global Response Initiative. All Systems Nominal.
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default LandingPage;
