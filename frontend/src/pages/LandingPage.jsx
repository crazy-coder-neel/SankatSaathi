import React, { useState } from 'react';
import { Element, scroller } from 'react-scroll';
import HeroSection from '../components/HeroSection';
import CardSwap, { Card } from '../components/CardSwap';
import { ArrowRight, Lock, Satellite, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = ({ onSystemInitialize }) => {

    const handleInitialize = () => {
        // Trigger system online state
        if (onSystemInitialize) onSystemInitialize();

        // Scroll to capabilities
        scroller.scrollTo('capabilities', {
            smooth: true,
            duration: 800,
        });
    };

    return (
        <div className="w-full relative z-10 scroll-smooth pointer-events-none">

            {/* HERO SECTION */}
            <div className="h-screen w-full relative flex flex-col justify-center px-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <HeroSection onInitialize={handleInitialize} />
                </div>
            </div>

            {/* SECTION 2: CAPABILITIES */}
            <Element name="capabilities" className="min-h-screen w-full bg-black/50 backdrop-blur-sm relative z-20 border-t border-white/5 flex items-center pointer-events-auto">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black z-0"></div>

                <div className="container mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center py-12 lg:py-0">
                    {/* Left: Text */}
                    <div className="order-2 lg:order-1">
                        <div className="flex items-center gap-6 mb-8">
                            <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                                TACTICAL <br /> INTELLIGENCE
                            </h2>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>
                        <p className="text-gray-400 text-lg md:text-2xl leading-relaxed mb-12 max-w-lg">
                            SankatSaathi unifies global data streams into a single command interface.
                            Deploy assets, analyze risks, and coordinate responses with military-grade precision.
                        </p>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-6 p-6 border border-white/5 bg-white/5 rounded-xl group hover:border-crisis-red/30 transition-colors">
                                <Globe className="w-8 h-8 text-crisis-cyan" />
                                <div>
                                    <h4 className="text-white font-bold text-lg">Global Coverage</h4>
                                    <p className="text-gray-500 text-sm">Satellite-linked monitoring spanning 190+ countries.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 p-6 border border-white/5 bg-white/5 rounded-xl group hover:border-crisis-red/30 transition-colors">
                                <Activity className="w-8 h-8 text-crisis-red" />
                                <div>
                                    <h4 className="text-white font-bold text-lg">Live Telemetry</h4>
                                    <p className="text-gray-500 text-sm">Sub-second latency on incident reporting.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Card Swap */}
                    <div className="h-[400px] md:h-[600px] flex items-center justify-center order-1 lg:order-2">
                        <CardSwap delay={4000}>
                            <Card className="bg-[#101018] p-8 border border-white/10 flex flex-col justify-between" key="1">
                                <div>
                                    <div className="text-xs font-mono uppercase text-crisis-cyan mb-4">Module 01</div>
                                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">Real-Time Tracking</h3>
                                    <p className="text-gray-400 text-base md:text-lg">Live monitoring of global incidents with sub-second latency precision worldwide.</p>
                                </div>
                                <Link to="/intelligence" className="text-crisis-red font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">
                                    View Intel <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Card>
                            <Card className="bg-[#101018] p-8 border border-white/10 flex flex-col justify-between" key="2">
                                <div>
                                    <div className="text-xs font-mono uppercase text-crisis-red mb-4">Module 02</div>
                                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">Threat Prediction</h3>
                                    <p className="text-gray-400 text-base md:text-lg">AI-driven algorithms forecast potential crisis escalation before it happens.</p>
                                </div>
                                <Link to="/analytics" className="text-crisis-cyan font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">
                                    Analyze Data <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Card>
                            <Card className="bg-[#101018] p-8 border border-white/10 flex flex-col justify-between" key="3">
                                <div>
                                    <div className="text-xs font-mono uppercase text-green-500 mb-4">Module 03</div>
                                    <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">Resource Allocation</h3>
                                    <p className="text-gray-400 text-base md:text-lg">Autonomous routing of emergency units to high-priority zones instantly.</p>
                                </div>
                                <Link to="/coordination" className="text-green-500 font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">
                                    Deploy Units <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Card>
                        </CardSwap>
                    </div>
                </div>
            </Element>

            {/* SECTION 3: PLATFORM OVERVIEW */}
            <Element name="overview" className="min-h-[80vh] w-full bg-black relative z-20 py-16 md:py-32 flex flex-col items-center justify-center border-t border-white/10 pointer-events-auto">
                <div className="text-center mb-12 md:mb-20 px-6">
                    <span className="text-crisis-red font-mono text-sm tracking-[0.4em] uppercase">Architecture</span>
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white mt-6 mb-6">THE UNIFIED GRID</h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto">Seamless integration between ground units, command centers, and AI infrastructure.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 container mx-auto px-6 md:px-12">
                    {/* Node 1 */}
                    <div className="p-10 border border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-all group">
                        <div className="w-16 h-16 rounded-full bg-crisis-blue/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Satellite className="w-8 h-8 text-crisis-blue" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Detection Layer</h3>
                        <p className="text-base text-gray-500">IoT sensors, satellite imagery, and public reports fuse to identify threats instantly.</p>
                    </div>

                    {/* Node 2 */}
                    <div className="p-10 border border-crisis-red/30 rounded-3xl bg-gradient-to-b from-crisis-red/10 to-transparent relative overflow-hidden group">
                        <div className="absolute inset-0 bg-crisis-red/5 animate-pulse"></div>
                        <div className="w-16 h-16 rounded-full bg-crisis-red/20 flex items-center justify-center mb-8 relative z-10">
                            <Activity className="w-8 h-8 text-crisis-red" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Analysis Engine</h3>
                        <p className="text-base text-gray-400 relative z-10">AI algorithms process severity and recommend optimal response strategies.</p>
                    </div>

                    {/* Node 3 */}
                    <div className="p-10 border border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-all group">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Globe className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Response Grid</h3>
                        <p className="text-base text-gray-500">Autonomous assignment of nearest responders and resource tracking.</p>
                    </div>
                </div>
            </Element>

            {/* SECTION 4: FUTURE */}
            <div className="w-full py-24 bg-[#050505] border-t border-white/5 relative z-20 pointer-events-auto">
                <div className="container mx-auto px-8">
                    <h3 className="text-gray-500 text-sm font-mono uppercase mb-8">System Roadmap // 2026-Q3</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                        <div className="p-6 border border-dashed border-gray-700 rounded-xl flex items-center gap-4">
                            <Lock className="text-gray-600" />
                            <div>
                                <h4 className="text-gray-400 font-bold">Autonomous Drones</h4>
                                <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded uppercase">Locked</span>
                            </div>
                        </div>
                        <div className="p-6 border border-dashed border-gray-700 rounded-xl flex items-center gap-4">
                            <Lock className="text-gray-600" />
                            <div>
                                <h4 className="text-gray-400 font-bold">Predictive Pre-Crime</h4>
                                <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded uppercase">Initializing...</span>
                            </div>
                        </div>
                        <div className="p-6 border border-dashed border-gray-700 rounded-xl flex items-center gap-4">
                            <Lock className="text-gray-600" />
                            <div>
                                <h4 className="text-gray-400 font-bold">Neural Link Interface</h4>
                                <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded uppercase">Research</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="w-full py-12 bg-black border-t border-white/10 relative z-20 pointer-events-auto">
                <div className="container mx-auto px-8 flex justify-between items-end">
                    <div>
                        <div className="text-2xl font-bold tracking-wider text-white mb-2">SANKAT<span className="text-crisis-red">SAATHI</span></div>
                        <div className="text-gray-500 text-xs max-w-xs">
                            Official Crisis Response System authorized by Global Security Council.
                            Restricted access to authorized personnel only.
                        </div>
                    </div>
                    <div className="flex gap-8 text-sm text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">Security Protocol</a>
                        <a href="#" className="hover:text-white transition-colors">System Status</a>
                        <a href="#" className="hover:text-white transition-colors">Command Login</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
