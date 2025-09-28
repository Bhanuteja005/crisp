// This file is not needed in a Vite React app - metadata is handled by index.html
// Keeping for reference but exporting a simple interface instead

export interface MetadataProps {
    title?: string;
    description?: string;
    image?: string | null;
    keywords?: string[];
    author?: string;
    twitterHandle?: string;
    type?: "website" | "article" | "profile";
}

export const APP_METADATA = {
    title: `${import.meta.env.VITE_APP_NAME || 'Crisp Interview'} - AI-Powered Interview Assistant`,
    description: "Revolutionary AI-powered interview platform with resume parsing, timed assessments, and intelligent scoring. Perfect for evaluating full-stack React/Node.js developers with real-time chat interface.",
    keywords: [
        "AI interview assistant",
        "interview platform", 
        "resume parsing",
        "developer assessment",
        "AI scoring",
        "coding interview",
        "technical interview"
    ],
    author: import.meta.env.VITE_AUTHOR_NAME || 'Crisp Team',
    twitterHandle: "@crispinterview"
};