
import React, { useState, useCallback } from 'react';
import { generateImage, editImage, scanDocument } from '../../services/geminiService';
import { OutputCardProps } from '../../types';
import Button from '../common/Button';
import OutputCard from '../common/OutputCard';

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const CreateSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'scan'>('generate');
    const [prompt, setPrompt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<OutputCardProps | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            fileToDataUrl(file).then(setPreview);
        }
    };

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        setOutput(null);
        try {
            let result;
            let log;

            switch (activeTab) {
                case 'generate':
                    result = await generateImage(prompt, aspectRatio);
                     log = { tool: 'image', params: { prompt, aspectRatio } };
                    const genImagePart = result.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                    if (genImagePart && genImagePart.inlineData) {
                       setOutput({
                            title: `Generated Image: ${prompt.substring(0, 30)}...`,
                            mediaUrl: `data:${genImagePart.inlineData.mimeType};base64,${genImagePart.inlineData.data}`,
                            mediaType: 'image',
                            changeLog: log,
                            suggestedActions: ['Animate this image', 'Remove background', 'Generate 9:16 Ad'],
                        });
                    }
                    break;
                case 'edit':
                    if (!imageFile) throw new Error("Please upload an image to edit.");
                    result = await editImage(prompt, imageFile);
                    log = { tool: 'image_edit_auto', params: { prompt } };
                    const editImagePart = result.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                     if (editImagePart && editImagePart.inlineData) {
                        setOutput({
                            title: 'Edited Image',
                            mediaUrl: `data:${editImagePart.inlineData.mimeType};base64,${editImagePart.inlineData.data}`,
                            mediaType: 'image',
                            changeLog: log,
                            suggestedActions: ['Refine edit', 'Animate this image'],
                        });
                    }
                    break;
                case 'scan':
                    if (!imageFile) throw new Error("Please upload a document to scan.");
                    result = await scanDocument(imageFile);
                    log = { tool: 'document_scanner', params: {} };
                    setOutput({
                        title: 'Scanned Document Text',
                        text: result.text,
                        changeLog: log,
                        suggestedActions: ['Summarize text', 'Translate to Spanish', 'Generate blog post'],
                    });
                    break;
            }
        } catch (error) {
            console.error(error);
            setOutput({ title: "An error occurred", text: error instanceof Error ? error.message : String(error), changeLog: { tool: 'error', params: {} }, suggestedActions: [] });
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, prompt, aspectRatio, imageFile]);

    const renderTabs = () => (
        <div className="flex space-x-2 mb-4 p-1 bg-gray-800 rounded-lg">
            {(['generate', 'edit', 'scan'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`capitalize w-full py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    {tab}
                </button>
            ))}
        </div>
    );
    
    return (
        <div>
            {renderTabs()}
            <div className="space-y-4">
                {(activeTab === 'edit' || activeTab === 'scan') && (
                     <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30 cursor-pointer" />
                        {preview && <img src={preview} alt="Preview" className="mt-4 mx-auto max-h-40 rounded-md" />}
                    </div>
                )}
                {(activeTab === 'generate' || activeTab === 'edit') && (
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeTab === 'generate' ? "e.g., A cinematic photo of a robot drinking coffee in a Parisian cafe" : "e.g., Add a futuristic helmet to the person"} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                )}
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading}>
                    {activeTab === 'generate' ? 'Generate' : activeTab === 'edit' ? 'Edit Image' : 'Scan Document'}
                </Button>
            </div>
            
            {isLoading && <div className="mt-6 text-center text-gray-400">CRE8EV-ing...</div>}
            {output && <OutputCard {...output} onRegenerate={handleSubmit} />}
        </div>
    );
};

export default CreateSection;
