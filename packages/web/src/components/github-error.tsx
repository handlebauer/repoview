'use client'

import { Button } from '@/components/ui/button'

interface GitHubErrorProps {
    message: string
    status?: number
    onRetry?: () => void
}

export function GitHubError({ message, status, onRetry }: GitHubErrorProps) {
    const isRateLimit =
        status === 403 && message.toLowerCase().includes('rate limit')

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
            <div className="flex flex-col items-center text-center">
                <h2 className="text-2xl font-semibold text-red-500">
                    GitHub Error
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {message}
                </p>
                {isRateLimit && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Please wait a few minutes before trying again
                    </p>
                )}
            </div>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="mt-4">
                    Try Again
                </Button>
            )}
        </div>
    )
}
