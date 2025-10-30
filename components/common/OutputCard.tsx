
import React from 'react';
import { OutputCardProps } from '../../types';
import Button from './Button';

const OutputCard: React.FC<OutputCardProps> = ({ title, mediaUrl, mediaType, text, changeLog, suggestedActions, citations, onAction, onRegenerate }) => {
    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-6 backdrop-blur-sm mt-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            
            {mediaUrl && mediaType === 'image' && <img src={mediaUrl} alt={title} className="rounded-md max-w-full lg:max-w-md h-auto mb-4 border-2 border-gray-700" />}
            {mediaUrl && mediaType === 'video' && <video src={mediaUrl} controls className="rounded-md max-w-full lg:max-w-md h-auto mb-4 border-2 border-gray-700" />}
            {mediaUrl && mediaType === 'audio' && <audio src={mediaUrl} controls className="w-full mb-4" />}

            {text && <div className="bg-gray-900/50 p-4 rounded-md text-gray-300 whitespace-pre-wrap mb-4 text-sm"><p>{text}</p></div>}
            
            {citations && citations.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources:</h4>
                    <ul className="flex flex-wrap gap-2">
                        {citations.map((cite, index) => (
                            <li key={index}>
                                <a href={cite.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-700 text-blue-300 hover:bg-gray-600 px-2 py-1 rounded-full transition-colors">{cite.title}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="border-t border-gray-700/50 pt-4">
                <div className="text-xs text-gray-500 mb-4">
                    <span className="font-bold">Change Log:</span>
                    <span> Tool: <span className="font-mono text-pink-400">{changeLog.tool}</span></span>
                    <span>, Params: <span className="font-mono text-pink-400">{JSON.stringify(changeLog.params)}</span></span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {suggestedActions.map((action, index) => (
                        <Button key={index} variant="secondary" onClick={() => onAction && onAction(action)}>
                           {action}
                        </Button>
                    ))}
                    {onRegenerate && <Button variant="ghost" onClick={onRegenerate}>Regenerate</Button>}
                    {mediaUrl && <a href={mediaUrl} download><Button variant="ghost">Download</Button></a>}
                </div>
            </div>
        </div>
    );
};

export default OutputCard;
