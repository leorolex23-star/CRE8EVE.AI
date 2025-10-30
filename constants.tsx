
import React from 'react';
import { Section, SectionId } from './types';

const CreateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const AnimateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const VoiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
);
const DiscoverIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l.01.01" /></svg>
);
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);

export const SECTIONS: Section[] = [
    { id: 'create', name: 'Create', icon: <CreateIcon />, description: 'Generate and edit images or scan documents.' },
    { id: 'animate', name: 'Animate', icon: <AnimateIcon />, description: 'Animate images or generate videos from text.' },
    { id: 'voice', name: 'Voice', icon: <VoiceIcon />, description: 'Convert text to speech or hold live voice chats.' },
    { id: 'discover', name: 'Discover', icon: <DiscoverIcon />, description: 'Access real-time data from Google Search & Maps.' },
    { id: 'chat', name: 'Chat', icon: <ChatIcon />, description: 'Engage with an intelligent, context-aware chatbot.' },
];

export const VEO_LOADING_MESSAGES = [
    "Warming up the animation engines...",
    "Teaching pixels to dance...",
    "Composing a symphony of motion...",
    "This can take a minute or two, great art needs patience!",
    "Almost there, adding the final touches of magic...",
];
