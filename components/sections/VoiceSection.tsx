
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { textToSpeech, connectLiveChat } from '../../services/geminiService';
import { OutputCardProps } from '../../types';
import Button from '../common/Button';
import OutputCard from '../common/OutputCard';
import { LiveServerMessage, LiveSession, Blob } from '@google/genai';

// Audio decoding/encoding helpers
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const VoiceSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tts' | 'live'>('tts');
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [output, setOutput] = useState<OutputCardProps | null>(null);

    // Live chat state
    const [isLive, setIsLive] = useState(false);
    const [transcription, setTranscription] = useState<{ user: string, model: string }[]>([]);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const handleTtsSubmit = useCallback(async () => {
        if (!text) return;
        setIsLoading(true);
        setOutput(null);
        try {
            const result = await textToSpeech(text);
            const audioPart = result.candidates?.[0]?.content?.parts[0]?.inlineData;
            if (audioPart) {
                setOutput({
                    title: 'Generated Speech',
                    mediaUrl: `data:${audioPart.mimeType};base64,${audioPart.data}`,
                    mediaType: 'audio',
                    changeLog: { tool: 'audio_spark_tts', params: { text: text.substring(0, 30) + '...' } },
                    suggestedActions: ['Use as video voiceover', 'Translate to Spanish'],
                });
            }
        } catch (error) {
            console.error(error);
            setOutput({ title: "An error occurred", text: error instanceof Error ? error.message : String(error), changeLog: { tool: 'error', params: {} }, suggestedActions: [] });
        } finally {
            setIsLoading(false);
        }
    }, [text]);

    const startLiveChat = useCallback(async () => {
        setIsLive(true);
        setIsLoading(true);
        setTranscription([]);

        let currentInput = "";
        let currentOutput = "";
        let nextStartTime = 0;

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);

        sessionPromiseRef.current = connectLiveChat({
            onopen: async () => {
                console.log('Live session opened');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        if (sessionPromiseRef.current) {
                            sessionPromiseRef.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        }
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current.destination); // Connect to destination to start processing
                    setIsLoading(false); // We are now listening
                } catch (err) {
                    console.error("Microphone access denied:", err);
                    setIsLive(false);
                    setIsLoading(false);
                }
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    currentInput += message.serverContent.inputTranscription.text;
                }
                if (message.serverContent?.outputTranscription) {
                    currentOutput += message.serverContent.outputTranscription.text;
                }
                if (message.serverContent?.turnComplete) {
                    const finalInput = currentInput;
                    const finalOutput = currentOutput;
                    setTranscription(prev => [...prev, { user: finalInput, model: finalOutput }]);
                    currentInput = "";
                    currentOutput = "";
                }
                
                const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if(audioData) {
                     nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                     const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                     const source = outputAudioContext.createBufferSource();
                     source.buffer = audioBuffer;
                     source.connect(outputNode);
                     source.start(nextStartTime);
                     nextStartTime += audioBuffer.duration;
                }
            },
            onerror: (e) => {
                console.error("Live session error:", e);
                stopLiveChat();
            },
            onclose: () => {
                console.log("Live session closed");
                stopLiveChat();
            },
        });
    }, []);

    const stopLiveChat = useCallback(() => {
        setIsLive(false);
        setIsLoading(false);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
           if(isLive) stopLiveChat();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLive]);
    
    return (
        <div>
            <div className="flex space-x-2 mb-4 p-1 bg-gray-800 rounded-lg">
                <button onClick={() => setActiveTab('tts')} className={`capitalize w-full py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'tts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Text to Speech</button>
                <button onClick={() => setActiveTab('live')} className={`capitalize w-full py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'live' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Live Conversation</button>
            </div>
            
            {activeTab === 'tts' && (
                <div>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text to convert to speech..." rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    <Button onClick={handleTtsSubmit} isLoading={isLoading} disabled={isLoading || !text} className="mt-4">Generate Audio</Button>
                    {output && <OutputCard {...output} />}
                </div>
            )}
            
            {activeTab === 'live' && (
                <div className="text-center">
                    <Button onClick={isLive ? stopLiveChat : startLiveChat} isLoading={isLoading} className={`w-48 h-12 text-lg ${isLive ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
                        {isLoading ? "Connecting..." : isLive ? "End Conversation" : "Start Conversation"}
                    </Button>
                    {isLive && !isLoading && <p className="text-green-400 mt-4 animate-pulse">Listening...</p>}
                    <div className="mt-6 text-left max-h-96 overflow-y-auto bg-gray-800/50 p-4 rounded-lg space-y-4">
                        {transcription.map((turn, index) => (
                            <div key={index}>
                                <p><span className="font-bold text-blue-300">You:</span> {turn.user}</p>
                                <p><span className="font-bold text-pink-300">AI:</span> {turn.model}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceSection;
