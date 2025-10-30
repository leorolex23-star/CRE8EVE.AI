
import React, { useState, useCallback } from 'react';
import { SECTIONS } from './constants';
import { SectionId } from './types';
import CreateSection from './components/sections/CreateSection';
import AnimateSection from './components/sections/AnimateSection';
import VoiceSection from './components/sections/VoiceSection';
import DiscoverSection from './components/sections/DiscoverSection';
import ChatSection from './components/sections/ChatSection';

const Sidebar = ({ activeSection, onSelectSection }: { activeSection: SectionId, onSelectSection: (id: SectionId) => void }) => (
    <aside className="w-64 bg-gray-900/70 backdrop-blur-sm border-r border-gray-700/50 p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-white mb-2">CRE8EVE<span className="text-blue-400">.AI</span></h1>
        <p className="text-sm text-gray-400 mb-10">Creative Intelligence Hub</p>
        <nav className="flex flex-col space-y-2">
            {SECTIONS.map((section) => (
                <button
                    key={section.id}
                    onClick={() => onSelectSection(section.id)}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                            ? 'bg-blue-600/20 text-blue-300'
                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }`}
                >
                    {section.icon}
                    <span className="font-medium">{section.name}</span>
                </button>
            ))}
        </nav>
        <div className="mt-auto text-xs text-gray-500">
            <p>Powered by Google Gemini</p>
            <p>&copy; 2024. All rights reserved.</p>
        </div>
    </aside>
);

const App: React.FC = () => {
    const [activeSection, setActiveSection] = useState<SectionId>('create');

    const handleSelectSection = useCallback((id: SectionId) => {
        setActiveSection(id);
    }, []);

    const renderSection = () => {
        const currentSection = SECTIONS.find(s => s.id === activeSection);
        return (
            <div className="w-full h-full">
                <h2 className="text-3xl font-bold text-white mb-2">{currentSection?.name}</h2>
                <p className="text-gray-400 mb-8">{currentSection?.description}</p>
                
                {activeSection === 'create' && <CreateSection />}
                {activeSection === 'animate' && <AnimateSection />}
                {activeSection === 'voice' && <VoiceSection />}
                {activeSection === 'discover' && <DiscoverSection />}
                {activeSection === 'chat' && <ChatSection />}
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            <Sidebar activeSection={activeSection} onSelectSection={handleSelectSection} />
            <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
                {renderSection()}
            </main>
        </div>
    );
};

export default App;
