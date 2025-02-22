'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ErrorDialog } from '@/components/error-dialog'
import { UrlInput } from '@/components/url-input'
import { Code2 } from 'lucide-react'

import {
    clearAllRepositories,
    loadLocalRepository,
    saveLocalRepository,
} from '@/lib/db'
import { createErrorMessage, parseGitHubError } from '@/lib/errors'
import { fetchRemoteRepository } from '@/lib/github'
import { GitHubIcon } from '@/components/icons/github'

import './animations.css'

type LoadingState =
    | { type: 'idle' }
    | {
          type: 'loading'
          progress: number
      }

export default function Home() {
    const router = useRouter()
    const [loadingState, setLoadingState] = useState<LoadingState>({
        type: 'idle',
    })
    const [error, setError] = useState<string | null>(null)
    const [isClearing, setIsClearing] = useState(false)
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [org, setOrg] = useState('')
    const [repo, setRepo] = useState('')

    // Simulated loading progress
    useEffect(() => {
        if (loadingState.type !== 'loading') return

        const interval = setInterval(() => {
            setLoadingState(current => {
                if (current.type !== 'loading') return current

                // Calculate dynamic increment based on current progress
                let increment
                if (current.progress < 60) {
                    // Move quickly up to 60%
                    increment = Math.max(1, (60 - current.progress) / 8)
                } else if (current.progress < 85) {
                    // Slow down between 60-85%
                    increment = Math.max(0.4, (85 - current.progress) / 15)
                } else if (current.progress < 98) {
                    // Very slow progress from 85-98%
                    increment = Math.max(0.1, (98 - current.progress) / 30)
                } else {
                    // Tiny increments after 98% to maintain motion
                    increment = 0.01
                }

                const progress = Math.min(99.9, current.progress + increment)
                return { type: 'loading', progress }
            })
        }, 100)

        return () => clearInterval(interval)
    }, [loadingState.type])

    const handleLoadingStart = async () => {
        setError(null)
        setLoadingState({ type: 'loading', progress: 0 })

        try {
            const cached = !!(await loadLocalRepository(org, repo))
            console.log('[handleLoadingStart] cached', cached)

            if (!cached) {
                const data = await fetchRemoteRepository(org, repo)
                await saveLocalRepository(org, repo, 'main', data.files)
            }

            // Complete the progress animation quickly
            setLoadingState({ type: 'loading', progress: 100 })

            // Store cache status in localStorage
            localStorage.setItem(`${org}/${repo}/cached`, String(cached))

            // Short delay to show completion before navigation
            setTimeout(() => {
                router.push(`/${org}/${repo}`)
            }, 200)
        } catch (err) {
            console.error('Failed to check repository:', err)
            const errorType = parseGitHubError(err, org, repo)
            setError(createErrorMessage(errorType))
            setLoadingState({ type: 'idle' })
        }
    }

    const handleOrgChange = (value: string) => {
        const cleanValue = value.replace(/^\/+/, '')
        setOrg(cleanValue)
        setError(null)
        setShowErrorDialog(false)

        // If user types a slash, split into org and repo
        if (cleanValue.includes('/')) {
            const [newOrg, newRepo] = cleanValue.split('/')
            setOrg(newOrg)
            setRepo(newRepo || '')
        }
    }

    const handleRepoChange = (value: string) => {
        setRepo(value)
        setError(null)
        setShowErrorDialog(false)
    }

    const isValid = org.length > 0 && repo.length > 0

    const handleSubmit = async () => {
        if (isValid) {
            await handleLoadingStart()
        }
    }

    const handleClearDatabase = async () => {
        try {
            setIsClearing(true)
            await clearAllRepositories()
        } catch (err) {
            console.error('Failed to clear database:', err)
            setError('Failed to clear database. Please try again.')
        } finally {
            setIsClearing(false)
        }
    }

    return (
        <div className="h-screen bg-[#0A0A0B] text-white relative overflow-hidden">
            <ErrorDialog
                error={error}
                onClose={() => {
                    setShowErrorDialog(false)
                    setError(null)
                }}
                open={showErrorDialog}
            />
            {/* Navigation */}
            <nav className="relative z-10">
                <div className="mx-auto max-w-7xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
                        >
                            <Code2 className="h-5 w-5" />
                            <span className="font-atkinson">RepoView</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleClearDatabase}
                                disabled={isClearing}
                                className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isClearing ? 'Clearing...' : 'Clear Cache'}
                            </button>
                            <a
                                href="https://github.com/handlebauer/repoview"
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View on GitHub"
                            >
                                <GitHubIcon className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="h-[calc(100vh-56px)] relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 pt-[15vh] h-full">
                    {/* Browser Window Mockup */}
                    <div className="relative max-w-4xl mx-auto animate-fade-up h-full">
                        {/* Browser Chrome */}
                        <div className="relative bg-[#1A1B1E] rounded-lg shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] overflow-hidden translate-y-[-2px] h-full">
                            {/* Unified Browser Frame */}
                            <div className="bg-[#2A2B2E] p-4">
                                {/* Top Controls and URL Bar Container */}
                                <div className="flex items-center gap-6">
                                    {/* Window Controls */}
                                    <div className="flex gap-2 pl-2">
                                        <div className="w-4 h-4 rounded-full bg-[#FF5F57]"></div>
                                        <div className="w-4 h-4 rounded-full bg-[#FFBD2E]"></div>
                                        <div className="w-4 h-4 rounded-full bg-[#28C840]"></div>
                                    </div>

                                    {/* Integrated URL Bar */}
                                    <div className="flex-1 flex justify-center px-6">
                                        <div className="w-full max-w-3xl transform transition-all duration-500">
                                            {loadingState.type === 'idle' ? (
                                                <div className="bg-[#1A1B1E] h-[44px] rounded-md flex items-center gap-3 shadow-sm border border-white/10 transition-all duration-500 opacity-100 px-4">
                                                    {/* Lock Icon */}
                                                    <svg
                                                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                        />
                                                    </svg>

                                                    <UrlInput
                                                        org={org}
                                                        repo={repo}
                                                        onOrgChange={
                                                            handleOrgChange
                                                        }
                                                        onRepoChange={
                                                            handleRepoChange
                                                        }
                                                        onSubmit={handleSubmit}
                                                        error={error}
                                                        onShowError={() =>
                                                            setShowErrorDialog(
                                                                true,
                                                            )
                                                        }
                                                        isValid={isValid}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-[#1A1B1E] h-[44px] rounded-md flex items-center gap-3 shadow-sm border border-white/10 transition-all duration-500 w-full px-4">
                                                    {/* Simple Download Arrow */}
                                                    <svg
                                                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                        />
                                                    </svg>

                                                    <div className="flex-1 flex items-center">
                                                        {error ? (
                                                            <div className="flex items-center gap-2 text-red-400">
                                                                <svg
                                                                    className="w-4 h-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                                <span className="text-[13px]">
                                                                    {error}
                                                                </span>
                                                            </div>
                                                        ) : loadingState.type ===
                                                          'loading' ? (
                                                            <div className="flex items-center w-full h-full relative">
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-white/20 rounded-full transition-all duration-200 ease-out"
                                                                            style={{
                                                                                width: `${loadingState.progress}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[13px] text-gray-400 whitespace-nowrap">
                                                                        Loading...
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Text */}
                            <div className="text-center pt-12 pb-8 flex flex-col gap-1 items-center">
                                <h1 className="text-5xl max-w-[800px] font-bold tracking-tight leading-normal bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                    Assisted Repository Exploration
                                </h1>
                            </div>

                            {/* Split View Demo */}
                            <div className="max-w-3xl mx-auto px-6 pb-8">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Left: Repository Explorer */}
                                    <div className="bg-[#1A1B1E] rounded-lg border border-white/10 overflow-hidden">
                                        {/* Explorer Header */}
                                        <div className="bg-[#2A2B2E] px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
                                            <svg
                                                className="w-4 h-4 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="2"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 4.5v15m7.5-7.5h-15"
                                                />
                                            </svg>
                                            <span className="text-sm text-gray-300 font-medium">
                                                Project
                                            </span>
                                        </div>
                                        {/* File Tree */}
                                        <div className="p-2 text-sm font-mono">
                                            <div className="hover:bg-white/5 rounded">
                                                <div className="flex items-center gap-1.5 py-1 px-2">
                                                    <svg
                                                        className="w-4 h-4 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        strokeWidth="2"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                                        />
                                                    </svg>
                                                    <span className="text-gray-300">
                                                        src
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="hover:bg-white/5 rounded">
                                                    <div className="flex items-center gap-1.5 py-1 px-2 pl-6">
                                                        <svg
                                                            className="w-4 h-4 text-gray-400"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                                            />
                                                        </svg>
                                                        <span className="text-gray-300">
                                                            components
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="hover:bg-white/5 rounded">
                                                        <div className="flex items-center gap-1.5 py-1 px-2 pl-12">
                                                            <span className="text-blue-400">
                                                                Button.tsx
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="hover:bg-white/5 rounded">
                                                        <div className="flex items-center gap-1.5 py-1 px-2 pl-12">
                                                            <span className="text-blue-400">
                                                                Card.tsx
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="hover:bg-white/5 rounded">
                                                        <div className="flex items-center gap-1.5 py-1 px-2 pl-12">
                                                            <span className="text-blue-400">
                                                                Input.tsx
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="hover:bg-white/5 rounded">
                                                    <div className="flex items-center gap-1.5 py-1 px-2 pl-6">
                                                        <svg
                                                            className="w-4 h-4 text-gray-400"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="2"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                                            />
                                                        </svg>
                                                        <span className="text-gray-300">
                                                            lib
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="hover:bg-white/5 rounded">
                                                        <div className="flex items-center gap-1.5 py-1 px-2 pl-12">
                                                            <span className="text-blue-400">
                                                                api.ts
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="hover:bg-white/5 rounded">
                                                        <div className="flex items-center gap-1.5 py-1 px-2 pl-12">
                                                            <span className="text-blue-400">
                                                                utils.ts
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 rounded">
                                                    <div className="flex items-center gap-1.5 py-1 px-2 pl-6">
                                                        <span className="text-blue-400">
                                                            App.tsx
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="hover:bg-white/5 rounded">
                                                    <div className="flex items-center gap-1.5 py-1 px-2 pl-6">
                                                        <span className="text-blue-400">
                                                            index.ts
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Features Grid */}
                                    <div className="grid grid-rows-3 gap-4">
                                        <div className="bg-[#1A1B1E] rounded-lg border border-white/10 p-4 flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-md bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg
                                                    className="w-4 h-4 text-green-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-200">
                                                    Instant Access
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    No cloning or setup
                                                    required. Start exploring
                                                    code immediately.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-[#1A1B1E] rounded-lg border border-white/10 p-4 flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg
                                                    className="w-4 h-4 text-purple-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-200">
                                                    AI Assistant
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    Get intelligent insights and
                                                    explanations about any piece
                                                    of code.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-[#1A1B1E] rounded-lg border border-white/10 p-4 flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <svg
                                                    className="w-4 h-4 text-orange-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth="2"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-200">
                                                    LLM-Ready Export
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    Copy the entire repository
                                                    in a format optimized for AI
                                                    prompts and analysis.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Browser Content Preview */}
                            <div className="relative">
                                <div className="max-w-3xl mx-auto px-6 py-12 opacity-50">
                                    <div className="flex gap-4">
                                        <div className="w-64 h-32 bg-white/5 rounded-lg"></div>
                                        <div className="flex-1 space-y-4">
                                            <div className="h-6 bg-white/5 rounded w-3/4"></div>
                                            <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                            <div className="h-4 bg-white/5 rounded w-2/3"></div>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6">
                                        <div className="h-20 bg-white/5 rounded-lg"></div>
                                        <div className="flex gap-4">
                                            <div className="w-1/3 h-24 bg-white/5 rounded-lg"></div>
                                            <div className="w-1/3 h-24 bg-white/5 rounded-lg"></div>
                                            <div className="w-1/3 h-24 bg-white/5 rounded-lg"></div>
                                        </div>
                                        <div className="h-16 bg-white/5 rounded-lg"></div>
                                    </div>
                                </div>

                                {/* Fade overlay */}
                                <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none bg-gradient-to-b from-transparent via-[#1A1B1E] to-[#1A1B1E]"></div>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -inset-x-20 top-0 bg-white/5 blur-3xl h-full -z-10 opacity-25"></div>
                    </div>
                </div>
            </main>
        </div>
    )
}
