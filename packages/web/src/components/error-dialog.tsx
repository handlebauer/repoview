import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, X } from 'lucide-react'

import { ErrorType, parseError } from '@/lib/errors'

interface ErrorDialogProps {
    error: string | null
    onClose: () => void
    open: boolean
}

function ErrorContent({ error }: { error: ErrorType }) {
    switch (error.type) {
        case 'rate_limit':
            return (
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <Dialog.Title className="text-lg font-semibold text-white">
                            Rate Limit Exceeded
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-gray-300 text-sm leading-relaxed animate-fade-in">
                            You&apos;ve reached GitHub&apos;s API rate limit for
                            IP:{' '}
                            <code className="mt-4 inline-block px-1.5 py-0.5 bg-white/[0.08] rounded text-gray-300 text-xs">
                                {error.ip.slice(0, -1)}
                            </code>
                            <div className="mt-4">
                                Sign in with your GitHub account or use a
                                personal access token to increase your rate
                                limit from 60 to 5,000 requests per hour.
                            </div>
                        </Dialog.Description>
                    </div>
                </div>
            )

        case 'not_found':
            return (
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <Dialog.Title className="text-lg font-semibold text-white">
                            Repository Not Found
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-gray-300 text-sm leading-relaxed animate-fade-in">
                            The repository{' '}
                            <code className="px-1.5 py-0.5 bg-white/[0.08] rounded text-gray-300 text-xs">
                                {error.org}/{error.repo}
                            </code>{' '}
                            could not be found. Please check if:
                            <ul className="mt-3 space-y-2">
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-gray-500" />
                                    <span>
                                        The repository name is spelled correctly
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-gray-500" />
                                    <span>The repository is public</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-gray-500" />
                                    <span>
                                        You have access to this repository
                                    </span>
                                </li>
                            </ul>
                        </Dialog.Description>
                    </div>
                </div>
            )

        case 'unknown':
            return (
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <Dialog.Title className="text-lg font-semibold text-white">
                            Error Details
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-gray-300 text-sm leading-relaxed animate-fade-in">
                            {error.message}
                        </Dialog.Description>
                    </div>
                </div>
            )
    }
}

export function ErrorDialog({ error, onClose, open }: ErrorDialogProps) {
    if (!error) return null

    const parsedError = parseError(error)

    return (
        <Dialog.Root open={open} onOpenChange={() => onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2A2B2E] p-8 rounded-xl shadow-2xl w-full max-w-md animate-slide-up border border-white/[0.08]">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <ErrorContent error={parsedError} />
                        </div>
                        <Dialog.Close className="text-gray-500 hover:text-gray-300 transition-colors rounded-lg p-2 hover:bg-white/[0.08]">
                            <X className="h-4 w-4" />
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
