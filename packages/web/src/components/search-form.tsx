'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitFork, Search } from 'lucide-react'

export function SearchForm() {
    const router = useRouter()
    const [org, setOrg] = useState('')
    const [repo, setRepo] = useState('')
    const orgInputRef = useRef<HTMLInputElement>(null)
    const repoInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                orgInputRef.current?.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (org && repo) {
            router.push(`/${org}/${repo}`)
        }
    }

    const handleOrgInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setOrg(value)
        if (value.includes('/')) {
            const [newOrg, newRepo] = value.split('/')
            setOrg(newOrg)
            setRepo(newRepo || '')
            repoInputRef.current?.focus()
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-2xl mx-auto group"
        >
            <div className="relative">
                {/* Main container */}
                <div className="relative rounded-[20px] bg-gradient-to-b from-[#27272A] to-[#1F1F23] p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                    {/* Input segments container */}
                    <div className="flex items-stretch gap-3">
                        {/* Organization input */}
                        <div className="flex-1">
                            <div className="relative flex h-full items-center rounded-2xl bg-[#09090B] ring-1 ring-white/[0.15] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)] focus-within:ring-[#2563eb] focus-within:ring-offset-1 focus-within:ring-offset-[#1F1F23] focus-within:shadow-[0_0_0_1px_rgba(37,99,235,0.2)]">
                                <GitFork className="absolute left-3.5 h-[18px] w-[18px] text-gray-400" />
                                <input
                                    ref={orgInputRef}
                                    type="text"
                                    value={org}
                                    onChange={handleOrgInput}
                                    placeholder="organization"
                                    className="h-full w-full bg-transparent px-10 py-3.5 text-[15px] font-normal text-white placeholder:text-gray-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center text-[15px] text-gray-400 font-mono">
                            /
                        </div>

                        {/* Repository input */}
                        <div className="flex-1">
                            <div className="relative flex h-full items-center rounded-2xl bg-[#09090B] ring-1 ring-white/[0.15] shadow-[inset_0_1px_1px_rgba(0,0,0,0.3)] focus-within:ring-[#2563eb] focus-within:ring-offset-1 focus-within:ring-offset-[#1F1F23] focus-within:shadow-[0_0_0_1px_rgba(37,99,235,0.2)]">
                                <Search className="absolute left-3.5 h-[18px] w-[18px] text-gray-400" />
                                <input
                                    ref={repoInputRef}
                                    type="text"
                                    value={repo}
                                    onChange={e => setRepo(e.target.value)}
                                    placeholder="repository"
                                    className="h-full w-full bg-transparent px-10 py-3.5 text-[15px] font-normal text-white placeholder:text-gray-400 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* View button */}
                        <button
                            type="submit"
                            className="rounded-2xl bg-[#2563eb] px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:bg-[#1d4ed8] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_1px_3px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:hover:bg-[#2563eb] disabled:hover:shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                            disabled={!org || !repo}
                        >
                            View
                        </button>
                    </div>
                </div>
            </div>

            {/* Submit button - hidden but enables form submission */}
            <button type="submit" className="sr-only">
                Search
            </button>
        </form>
    )
}
