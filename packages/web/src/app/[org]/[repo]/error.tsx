'use client'

import { useEffect } from 'react'
import { GitHubError as GitHubErrorComponent } from '@/components/github-error'

import { GitHubError } from '@/lib/github'

function isGitHubError(error: Error): error is GitHubError {
    return error.name === 'GitHubError'
}

export default function RepoError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Repository error:', error)
    }, [error])

    return (
        <GitHubErrorComponent
            message={error.message}
            status={isGitHubError(error) ? error.status : undefined}
            onRetry={() => reset()}
        />
    )
}
