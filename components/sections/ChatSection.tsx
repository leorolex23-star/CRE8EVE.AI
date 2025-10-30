
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createChatSession } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import Button from '../common/Button';
import { Chat, GenerateContentStreamResponse } from '@google/genai';

const ChatSection: React.FC = () => {
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useProModel, setUseProModel] = useState(false); // For "network_intelligence"
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const startNewChat = useCallback(() => {
        const newChat = createChatSession(useProModel);
        setChatSession(newChat);
        setHistory(newChat.history || []);
    }, [useProModel]);

    useEffect(() => {
        startNewChat();
    }, [startNewChat]);
    
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSendMessage = useCallback(async () => {
        if (!message.trim() || !chatSession) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setHistory(prev => [...prev, userMessage]);
        setMessage('');
        setIsLoading(true);
        
        try {
            const stream: GenerateContentStreamResponse = await chatSession.sendMessageStream({ message });
            let modelResponseText = '';
            
            // Add a placeholder for the model's response
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponseText += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    const lastMessage = newHistory[newHistory.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.parts[0].text = modelResponseText;
                    }
                    return newHistory;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: `Sorry, I encountered an error. ${error instanceof Error ? error.message : ''}` }] };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [message, chatSession]);

    const handleModelToggle = () => {
        setUseProModel(prev => !prev);
        // This will trigger the useEffect to start a new chat session
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <Button onClick={startNewChat} variant="secondary">New Chat</Button>
                <div className="flex items-center space-x-2">
                    <span className={`text-sm ${!useProModel ? 'text-blue-300' : 'text-gray-400'}`}>Fast (Bolt)</span>
                    <label htmlFor="model-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" id="model-toggle" className="sr-only" checked={useProModel} onChange={handleModelToggle} />
                            <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${useProModel ? 'transform translate-x-full bg-pink-400' : ''}`}></div>
                        </div>
                    </label>
                    <span className={`text-sm ${useProModel ? 'text-pink-300' : 'text-gray-400'}`}>Advanced (Network)</span>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gray-800/50 rounded-lg p-4 space-y-4 mb-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
                           <div className="flex items-center space-x-2">
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                               <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                           </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex space-x-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <Button onClick={handleSendMessage} isLoading={isLoading} disabled={isLoading || !message.trim()}>
                    Send
                </Button>
            </div>
        </div>
    );
};

export default ChatSection;
