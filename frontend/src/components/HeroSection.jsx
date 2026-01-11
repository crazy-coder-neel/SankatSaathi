import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

const HeroSection = ({ onInitialize }) => {
    return (
        <div className="relative z-10 flex flex-col justify-start lg:justify-center h-full w-full lg:max-w-[60%] pointer-events-none pt-32 lg:pt-0 px-6 lg:pl-24">
            <div className="pointer-events-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-8"
                >
                    <div className="h-[2px] w-8 lg:w-16 bg-crisis-red shadow-[0_0_10px_#FF3B30]"></div>
                    <span className="text-crisis-red font-mono tracking-[0.2em] text-xs lg:text-sm font-bold uppercase drop-shadow-md">Crisis Management Protocol</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-6xl lg:text-8xl font-display font-bold text-white leading-[0.95] tracking-tight mb-6 lg:mb-10 drop-shadow-2xl"
                >
                    PLANETARY <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">RESILIENCE</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="text-lg md:text-xl lg:text-2xl text-gray-300 font-body leading-relaxed max-w-xl mb-10 border-l-2 border-crisis-red/50 pl-6 drop-shadow-md"
                >
                    Advanced crisis coordination and real-time global monitoring system for next-generation emergency response.
                    Deploy resources, track incidents, and save lives with AI-driven precision.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    onClick={onInitialize}
                    className="group relative w-full lg:w-auto px-8 py-5 bg-crisis-red text-white font-display font-bold text-lg tracking-widest uppercase overflow-hidden hover:bg-red-600 transition-all duration-300 shadow-[0_0_20px_rgba(255,59,48,0.4)] hover:shadow-[0_0_40px_rgba(255,59,48,0.7)]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        Initialize System
                        <Zap className="w-5 h-5 group-hover:fill-white transition-colors" />
                    </span>
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-[-100%] transition-transform duration-500 ease-in-out"></div>
                </motion.button>

                <div className="mt-16 lg:mt-24 flex items-center gap-8 lg:gap-12 opacity-80 lg:opacity-60">
                    <div className="flex flex-col">
                        <span className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow-lg">00:03s</span>
                        <span className="text-[10px] lg:text-xs font-mono uppercase text-crisis-cyan tracking-wider">Data Latency</span>
                    </div>
                    <div className="w-[1px] h-8 lg:h-10 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow-lg">100%</span>
                        <span className="text-[10px] lg:text-xs font-mono uppercase text-green-500 tracking-wider">Uptime</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
