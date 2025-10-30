
import React from 'react';

export type SectionId = 'create' | 'animate' | 'voice' | 'discover' | 'chat';

export interface Section {
  id: SectionId;
  name: string;
  // Fix: Add import React from 'react' to resolve JSX namespace error.
  icon: JSX.Element;
  description: string;
}

export interface OutputCardProps {
  title: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  text?: string;
  changeLog: { tool: string; params: Record<string, any> };
  suggestedActions: string[];
  citations?: { uri: string; title: string }[];
  onAction?: (action: string) => void;
  onRegenerate?: () => void;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Fix: Centralize global type declarations to avoid conflicts.
declare global {
    interface Window {
        aistudio: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        }
    }
}
