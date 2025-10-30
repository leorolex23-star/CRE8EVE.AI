
import React, { useState, useCallback, useEffect } from 'react';
import { groundedSearch } from '../../services/geminiService';
import { OutputCardProps } from '../../types';
import Button from '../common/Button';
import OutputCard from '../common/OutputCard';

const DiscoverSection: React.FC = () => {
    const [query, setQuery] = useState('');
    const [tool, setTool] = useState<'google' | 'maps'>('google');
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<OutputCardProps | null>(null);
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        if (tool === 'maps' && !location) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setLocationError(null);
                },
                (error) => {
                    setLocationError(`Geolocation error: ${error.message}. Please enable location services.`);
                }
            );
        }
    }, [tool, location]);

    const handleSubmit = useCallback(async () => {
        if (!query) return;
        if (tool === 'maps' && !location) {
             setOutput({ title: "Location Required", text: locationError || "Could not get your location for Maps search.", changeLog: { tool: 'error', params: {} }, suggestedActions: [] });
            return;
        }
        setIsLoading(true);
        setOutput(null);
        try {
            const result = await groundedSearch(query, tool, location || undefined);
            const citations = result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
                uri: chunk.web?.uri || chunk.maps?.uri,
                title: chunk.web?.title || chunk.maps?.title,
            })).filter(c => c.uri && c.title) || [];
            
            setOutput({
                title: `Discovery: ${query.substring(0, 40)}...`,
                text: result.text,
                citations,
                changeLog: { tool: tool === 'google' ? 'google' : 'maps', params: { query } },
                suggestedActions: ['Summarize findings', 'Find related topics'],
            });
        } catch (error) {
            console.error(error);
            setOutput({ title: "An error occurred", text: error instanceof Error ? error.message : String(error), changeLog: { tool: 'error', params: {} }, suggestedActions: [] });
        } finally {
            setIsLoading(false);
        }
    }, [query, tool, location, locationError]);

    return (
        <div>
            <div className="flex space-x-2 mb-4 p-1 bg-gray-800 rounded-lg">
                <button onClick={() => setTool('google')} className={`capitalize w-full py-2 text-sm font-medium rounded-md transition-colors ${tool === 'google' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Google Search</button>
                <button onClick={() => setTool('maps')} className={`capitalize w-full py-2 text-sm font-medium rounded-md transition-colors ${tool === 'maps' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Google Maps</button>
            </div>
            {tool === 'maps' && locationError && <p className="text-red-400 text-sm mb-4">{locationError}</p>}
            <div className="space-y-4">
                <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tool === 'google' ? "e.g., What are the latest trends in AI marketing?" : "e.g., Cafes near me with good reviews"} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading || !query}>
                    Discover
                </Button>
            </div>
            
            {isLoading && <div className="mt-6 text-center text-gray-400">Searching the digital universe...</div>}
            {output && <OutputCard {...output} onRegenerate={handleSubmit} />}
        </div>
    );
};

export default DiscoverSection;
