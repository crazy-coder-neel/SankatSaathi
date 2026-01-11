import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

const HeroSection = ({ onInitialize }) => {
    return (
        <div className="relative z-10 flex flex-col justify-center h-full max-w-[55%] pl-24 pointer-events-none">
            <div className="pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <div className="h-[2px] w-16 bg-crisis-red"></div>
                    <span className="text-crisis-red font-mono tracking-[0.3em] text-sm uppercase">Crisis Management Protocol</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-8xl font-display font-bold text-white leading-[0.9] tracking-tighter mb-10"
                >
                    PLANETARY <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">RESILIENCE</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="text-2xl text-gray-400 font-body leading-relaxed max-w-2xl mb-14 border-l-4 border-white/10 pl-8"
                >
                    Advanced crisis coordination and real-time global monitoring system for next-generation emergency response.
                    Deploy resources, track incidents, and save lives with AI-driven precision.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    onClick={onInitialize}
                    className="group relative px-10 py-5 bg-crisis-red/10 border border-crisis-red/50 text-white font-display font-bold text-lg tracking-widest uppercase overflow-hidden hover:bg-crisis-red transition-all duration-300 active:scale-95"
                >
                    <span className="relative z-10 flex items-center gap-4">
                        Initialize System
                        <Zap className="w-6 h-6 group-hover:fill-white transition-colors" />
                    </span>
                    <div className="absolute inset-0 bg-crisis-red opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                </motion.button>

                <div className="mt-20 flex items-center gap-10 opacity-60">
                    <div className="flex flex-col">
                        <span className="text-3xl font-display font-bold text-white">00:03s</span>
                        <span className="text-xs font-mono uppercase text-gray-500">Data Latency</span>
                    </div>
                    <div className="w-[1px] h-10 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-3xl font-display font-bold text-white">100%</span>
                        <span className="text-xs font-mono uppercase text-gray-500">Uptime</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
