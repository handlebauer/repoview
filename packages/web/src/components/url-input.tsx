'use client'

import { useEffect, useRef, useState } from 'react'

import { config } from '@/lib/config'

interface UrlInputProps {
    onValidityChange?: (isValid: boolean) => void
    onLoadingStart?: (org: string, repo: string) => Promise<void>
    onInputChange?: () => void
}

export function UrlInput({
    onValidityChange,
    onLoadingStart,
    onInputChange,
}: UrlInputProps) {
    const [org, setOrg] = useState('')
    const [repo, setRepo] = useState('')
    const orgInputRef = useRef<HTMLInputElement>(null)
    const repoInputRef = useRef<HTMLInputElement>(null)

    const isValid = org.length > 0 && repo.length > 0

    useEffect(() => {
        // Autofocus the org input on mount
        orgInputRef.current?.focus()
    }, [])

    useEffect(() => {
        onValidityChange?.(isValid)
    }, [isValid, onValidityChange])

    const handleSubmit = async () => {
        if (isValid && onLoadingStart) {
            await onLoadingStart(org, repo)
        }
    }

    const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/^\/+/, '')
        setOrg(value)
        onInputChange?.()

        // If user types a slash, move to repo input
        if (value.includes('/')) {
            const [newOrg, newRepo] = value.split('/')
            setOrg(newOrg)
            setRepo(newRepo || '')
            repoInputRef.current?.focus()
        }
    }

    const handleOrgKeyDown = async (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        // If user presses tab or slash, prevent default and move to repo input
        if (e.key === 'Tab' || e.key === '/') {
            e.preventDefault()
            repoInputRef.current?.focus()
        } else if (e.key === 'Enter' && isValid) {
            e.preventDefault()
            await handleSubmit()
        }
    }

    const handleRepoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRepo(e.target.value)
        onInputChange?.()
    }

    const handleRepoKeyDown = async (
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Enter' && isValid) {
            e.preventDefault()
            await handleSubmit()
        }
    }

    return (
        <div className="flex-1 font-mono text-sm sm:text-base flex items-center">
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
    )
}
