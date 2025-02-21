'use client'

import { useEffect, useRef } from 'react'
import { XCircle } from 'lucide-react'

import { config } from '@/lib/config'

interface UrlInputProps {
    org: string
    repo: string
    onOrgChange: (value: string) => void
    onRepoChange: (value: string) => void
    onSubmit: () => Promise<void>
    error?: string | null
    onShowError?: () => void
    isValid: boolean
}

export function UrlInput({
    org,
    repo,
    onOrgChange,
    onRepoChange,
    onSubmit,
    error,
    onShowError,
    isValid,
}: UrlInputProps) {
    const orgInputRef = useRef<HTMLInputElement>(null)
    const repoInputRef = useRef<HTMLInputElement>(null)
    const isInitialMount = useRef(true)

    useEffect(() => {
        // Only focus on initial mount
        if (isInitialMount.current) {
            orgInputRef.current?.focus()
            isInitialMount.current = false
        }
    }, [])

    const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onOrgChange(e.target.value)
    }

    const handleOrgKeyDown = async (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        // If user presses tab or slash, prevent default and move to repo input
        if (e.key === 'Tab' || e.key === '/') {
            e.preventDefault()
            // Focus without selecting text
            repoInputRef.current?.focus()
            const length = repoInputRef.current?.value.length || 0
            repoInputRef.current?.setSelectionRange(length, length)
        } else if (e.key === 'Enter' && isValid) {
            e.preventDefault()
            await onSubmit()
        }
    }

    const handleRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onRepoChange(e.target.value)
    }

    const handleRepoKeyDown = async (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            // Focus without selecting text
            orgInputRef.current?.focus()
            const length = orgInputRef.current?.value.length || 0
            orgInputRef.current?.setSelectionRange(length, length)
        } else if (e.key === 'Enter' && isValid) {
            e.preventDefault()
            await onSubmit()
        }
    }

    return (
        <div className="flex-1 font-mono text-sm sm:text-base flex items-center">
            <div className="flex-1 flex items-center">
                <span className="text-gray-400">https://</span>
                <span className="line-through text-red-400">
                    {config.githubHost}
                </span>
                <span className="text-green-400 font-bold">{config.host}</span>
                <span className="text-gray-400">/</span>
                <input
                    ref={orgInputRef}
                    type="text"
                    value={org}
                    onChange={handleOrgChange}
                    onKeyDown={handleOrgKeyDown}
                    spellCheck="false"
                    className="bg-transparent text-gray-300 focus:outline-none border-b border-transparent focus:border-white/20 px-0.5 min-w-[3.5ch] w-[var(--org-width,3.5ch)]"
                    style={
                        {
                            '--org-width': `${Math.max(3.5, org.length + 0.5)}ch`,
                        } as React.CSSProperties
                    }
                    placeholder="org"
                />
                <span className="text-gray-400">/</span>
                <input
                    ref={repoInputRef}
                    type="text"
                    value={repo}
                    onChange={handleRepoChange}
                    onKeyDown={handleRepoKeyDown}
                    spellCheck="false"
                    className="bg-transparent text-gray-300 focus:outline-none focus:border-b focus:border-white/20 px-0.5 min-w-[4.5ch] w-[var(--repo-width,4.5ch)]"
                    style={
                        {
                            '--repo-width': `${Math.max(4.5, repo.length + 0.5)}ch`,
                        } as React.CSSProperties
                    }
                    placeholder="repo"
                />
            </div>
            {error && (
                <button
                    onClick={onShowError}
                    className="text-red-500 hover:text-red-400 transition-colors ml-2"
                    aria-label="Show error details"
                >
                    <XCircle className="h-5 w-5" />
                </button>
            )}
        </div>
    )
}
