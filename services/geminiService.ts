
import { GoogleGenAI, GenerateContentResponse, Chat, GenerateContentStreamResponse, Modality, Type, LiveSession, LiveServerMessage } from "@google/genai";

// This file is a placeholder for the actual service logic.
// In a real application, you would initialize GoogleGenAI and implement
// the functions to call the Gemini API.

// IMPORTANT: Do not expose your API key in client-side code in a production environment.
// This implementation assumes process.env.API_KEY is available, which is suitable for
// environments like the AI Studio bootstrapper.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });


// Utility to convert a File object to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};


// 🖼️ IMAGE & DESIGN
export const generateImage = async (prompt: string, aspectRatio: string): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    // Using gemini-2.5-flash-image for generation as it's versatile
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });
};

export const editImage = async (prompt: string, imageFile: File): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    const base64Image = await fileToBase64(imageFile);
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: imageFile.type } },
                { text: prompt },
            ],
        },
        config: { responseModalities: [Modality.IMAGE] },
    });
};

export const scanDocument = async (imageFile: File): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    const base64Image = await fileToBase64(imageFile);
    const prompt = "Extract all text from this document. If it's a receipt, structure the data as JSON with items, prices, and total.";
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: imageFile.type } },
                { text: prompt },
            ],
        },
    });
};

// 🎬 VIDEO & ANIMATION
export const generateVideo = async (prompt: string, imageFile?: File) => {
    const ai = getAiClient();
    const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
    };
    
    let payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config,
    };

    if (imageFile) {
        payload.image = {
            imageBytes: await fileToBase64(imageFile),
            mimeType: imageFile.type,
        };
    }
    
    return await ai.models.generateVideos(payload);
};

export const getVideoOperationStatus = async (operation: any) => {
    const ai = getAiClient();
    return await ai.operations.getVideosOperation({ operation: operation });
}


// 🎧 AUDIO & VOICE
export const textToSpeech = async (text: string): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    return await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a friendly and clear tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
};

export const connectLiveChat = async (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => Promise<void>;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}): Promise<LiveSession> => {
    const ai = getAiClient();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are CRE8EVE.AI, a friendly and helpful creative assistant.',
        },
    });
};


// 🧠 CONVERSATIONAL INTELLIGENCE
export const createChatSession = (useProModel: boolean): Chat => {
    const ai = getAiClient();
    return ai.chats.create({
        model: useProModel ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are CRE8EVE.AI, a helpful chatbot inside a creative intelligence platform. Be concise and inspiring.',
        },
    });
};


// 🌍 DATA & CONNECTIVITY
export const groundedSearch = async (query: string, tool: 'google' | 'maps', location?: { latitude: number, longitude: number }): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    const config: any = {
        tools: tool === 'google' ? [{ googleSearch: {} }] : [{ googleMaps: {} }],
    };

    if (tool === 'maps' && location) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            }
        };
    }

    return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config,
    });
};
