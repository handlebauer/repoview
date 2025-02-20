'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorDialog } from '@/components/error-dialog'
import { UrlInput } from '@/components/url-input'
import { Code2, XCircle } from 'lucide-react'

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
    const [isValid, setIsValid] = useState(false)
    const [loadingState, setLoadingState] = useState<LoadingState>({
        type: 'idle',
    })
    const [error, setError] = useState<string | null>(null)
    const [isClearing, setIsClearing] = useState(false)
    const [showErrorDialog, setShowErrorDialog] = useState(false)

    // Simulated loading progress
    useEffect(() => {
        if (loadingState.type !== 'loading') return

        const interval = setInterval(() => {
            setLoadingState(current => {
                if (current.type !== 'loading') return current
                // Slow down progress as it gets closer to 90%
                const increment = Math.max(0.5, (90 - current.progress) / 10)
                const progress = Math.min(90, current.progress + increment)
                return { type: 'loading', progress }
            })
        }, 100)

        return () => clearInterval(interval)
    }, [loadingState.type])

    const handleLoadingStart = async (org: string, repo: string) => {
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
                        <div className="flex items-center gap-2">
                            <Code2 className="h-5 w-5" />
                            <span className="font-atkinson">RepoView</span>
                        </div>
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
                <div className="mx-auto max-w-7xl px-6 pt-16 h-full">
                    {/* Browser Window Mockup */}
                    <div className="relative max-w-4xl mx-auto animate-fade-up h-full">
                        {/* Browser Chrome */}
                        <div className="relative bg-[#1A1B1E] rounded-lg shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] overflow-hidden translate-y-[-2px] h-full">
                            {/* Browser Top Bar */}
                            <div className="bg-[#2A2B2E] p-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
                                </div>
                            </div>

                            {/* Hero Text - Moved inside browser */}
                            <div className="text-center pt-16 pb-12 flex flex-col gap-1 items-center">
                                <h1 className="text-5xl max-w-[800px] font-bold tracking-tight leading-normal bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                                    Guided Repository Exploration
                                </h1>
                            </div>

                            {/* Address Bar - Magnified */}
                            <div className="relative pb-10">
                                <div className="w-fit mx-auto transform transition-all duration-500">
                                    {loadingState.type === 'idle' ? (
                                        <div className="bg-[#2A2B2E] h-[54.72px] rounded-lg flex items-center gap-3 shadow-lg border border-white/10 transition-all duration-500 opacity-100 px-3.5">
                                            {/* Lock Icon */}
                                            <svg
                                                className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                                                onValidityChange={setIsValid}
                                                onLoadingStart={
                                                    handleLoadingStart
                                                }
                                                onInputChange={() => {
                                                    setError(null)
                                                    setShowErrorDialog(false)
                                                }}
                                            />
                                            <div className="absolute right-0 -bottom-6">
                                                <span
                                                    className={`text-[10px] transition-opacity duration-200 ${
                                                        isValid
                                                            ? 'text-gray-400'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    press enter ↵
                                                </span>
                                            </div>
                                            {error && (
                                                <button
                                                    onClick={() =>
                                                        setShowErrorDialog(true)
                                                    }
                                                    className="absolute -right-10 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 transition-colors"
                                                    aria-label="Show error details"
                                                >
                                                    <XCircle className="h-6 w-6" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-[#2A2B2E] h-[54.72px] rounded-lg flex items-center gap-3 shadow-lg border border-white/10 transition-all duration-500 min-w-[400px] px-3.5">
                                            {/* Simple Download Arrow */}
                                            <svg
                                                className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                                                                strokeWidth={2}
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

                            {/* Instruction Text */}
                            <div
                                className={`text-center py-8 px-6 transition-opacity duration-500 ${
                                    loadingState.type !== 'idle'
                                        ? 'opacity-0'
                                        : 'opacity-100'
                                }`}
                            >
                                <p className="text-base text-gray-400 max-w-[340px] mx-auto">
                                    Instantly explore any GitHub repository with
                                    a powerful built-in editor. No cloning
                                    required.
                                </p>
                            </div>

                            {/* Browser Content Preview (cut off) */}
                            <div className="h-[calc(100%-400px)] bg-gradient-to-b from-[#1A1B1E] via-[#1A1B1E] to-[#1A1B1E] relative">
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

                                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-[#1A1B1E] via-[#1A1B1E]/50 to-[#1A1B1E]/0"></div>
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
