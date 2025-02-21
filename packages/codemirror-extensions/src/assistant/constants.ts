import type { Model } from '~/assistant'

export const AVAILABLE_MODELS: Model[] = [
    {
        id: 'gpt-4',
        provider: 'openai',
        name: 'GPT-4o',
        description: "OpenAI's most capable model",
    },
    {
        id: 'gemini-pro',
        provider: 'google',
        name: 'Gemini Pro',
        description: "Google's most capable model for text generation",
    },
    {
        id: 'mistral-large',
        provider: 'mistral',
        name: 'Mistral Large',
        description: "Mistral's largest open model",
    },
]
