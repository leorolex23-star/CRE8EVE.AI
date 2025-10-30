
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateVideo, getVideoOperationStatus } from '../../services/geminiService';
import { OutputCardProps } from '../../types';
import Button from '../common/Button';
import OutputCard from '../common/OutputCard';
import { VEO_LOADING_MESSAGES } from '../../constants';

// Fix: Removed duplicate global declaration. It is now centralized in types.ts.

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const AnimateSection: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<OutputCardProps | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(VEO_LOADING_MESSAGES[0]);

    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            } else {
                 // Fallback for environments where aistudio is not available
                setApiKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    useEffect(() => {
        if (isLoading) {
            intervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = VEO_LOADING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % VEO_LOADING_MESSAGES.length;
                    return VEO_LOADING_MESSAGES[nextIndex];
                });
            }, 3000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLoading]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            fileToDataUrl(file).then(setPreview);
        }
    };
    
    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        // Assume success and update UI immediately
        setApiKeySelected(true);
    };

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        setOutput(null);
        setLoadingMessage(VEO_LOADING_MESSAGES[0]);

        try {
            let operation = await generateVideo(prompt, imageFile || undefined);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10s
                operation = await getVideoOperationStatus(operation);
            }
            
            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                const videoUri = operation.response.generatedVideos[0].video.uri;
                const downloadLink = `${videoUri}&key=${process.env.API_KEY}`;
                setOutput({
                    title: `Generated Video: ${prompt.substring(0, 30)}...`,
                    mediaUrl: downloadLink,
                    mediaType: 'video',
                    changeLog: { tool: imageFile ? 'movie' : 'video_spark', params: { prompt } },
                    suggestedActions: ['Add voiceover', 'Summarize video', 'Generate vertical ad'],
                });
            } else {
                throw new Error("Video generation failed or returned no URI.");
            }
        } catch (error: any) {
            let errorMessage = error instanceof Error ? error.message : String(error);
             if (errorMessage.includes("Requested entity was not found.")) {
                errorMessage = "API Key not found or invalid. Please select a valid key.";
                setApiKeySelected(false);
            }
            setOutput({ title: "An error occurred", text: errorMessage, changeLog: { tool: 'error', params: {} }, suggestedActions: [] });
        } finally {
            setIsLoading(false);
        }
    }, [prompt, imageFile]);

    if (!apiKeySelected) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">API Key Required for Video Generation</h3>
                <p className="text-gray-400 mb-6">The Veo model requires you to select your own API key. This helps manage your project's billing and usage.</p>
                <Button onClick={handleSelectKey}>Select API Key</Button>
                 <p className="text-xs text-gray-500 mt-4">
                    For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">billing documentation</a>.
                </p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="space-y-4">
                 <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                    <label className="text-sm text-gray-400">Upload an image to animate (optional)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full mt-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30 cursor-pointer" />
                    {preview && <img src={preview} alt="Preview" className="mt-4 mx-auto max-h-40 rounded-md" />}
                </div>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A neon hologram of a cat driving at top speed" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading || !prompt}>
                   {imageFile ? 'Animate Image' : 'Generate Video'}
                </Button>
            </div>
            
            {isLoading && <div className="mt-6 text-center text-gray-400">{loadingMessage}</div>}
            {output && <OutputCard {...output} onRegenerate={handleSubmit} />}
        </div>
    );
};

export default AnimateSection;
