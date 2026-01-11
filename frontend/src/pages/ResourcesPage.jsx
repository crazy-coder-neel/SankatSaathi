import React from 'react';
import { Truck, Users, Box, Battery, Wifi, Shield } from 'lucide-react';

const ResourcesPage = () => {
    return (
        <div className="min-h-screen bg-black pt-24 px-8 pb-12 relative z-20">
            {/* Header */}
            <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2">RESOURCE ALLOCATION</h1>
                    <p className="text-gray-400 font-mono text-sm">Tactical Asset Management // Sector 4</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-3xl font-bold text-crisis-cyan">42</div>
                        <div className="text-[10px] text-gray-500 uppercase">Available Units</div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-crisis-red">08</div>
                        <div className="text-[10px] text-gray-500 uppercase">Deployed</div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-6">
                {/* Unit Cards */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-crisis-cyan/50 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                            <Truck className="text-gray-400 group-hover:text-crisis-cyan transition-colors" />
                            <div className="px-2 py-0.5 rounded bg-green-900/30 text-green-500 text-[10px] font-bold border border-green-500/20">READY</div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Response Unit Alpha-{i + 1}</h3>
                        <p className="text-xs text-gray-500 mb-4">Class-A Medical Transport</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                            <div className="flex items-center gap-2">
                                <Users size={12} />
                                <span>Crew: 3/3</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Battery size={12} className="text-green-500" />
                                <span>Fuel: 92%</span>
                            </div>
                        </div>

                        <button className="w-full py-2 bg-white/5 hover:bg-crisis-cyan hover:text-black text-crisis-cyan border border-crisis-cyan/30 rounded font-bold text-xs uppercase transition-all">
                            Dispatch Unit
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResourcesPage;
