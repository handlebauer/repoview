'use client'

import { ClipboardCopy } from 'lucide-react'

import type { Repository } from '@repoview/common'

interface EditorToolbarProps {
    files?: Repository
}

export function EditorToolbar({ files }: EditorToolbarProps) {
    function generateFileTree(files: Record<string, string>): string {
        interface TreeNode {
            [key: string]: TreeNode
        }
        const tree: TreeNode = {}

        // Build tree structure
        Object.keys(files)
            .sort((a, b) => a.localeCompare(b))
            .forEach(path => {
                const parts = path.split('/')
                let current = tree
                parts.forEach(part => {
                    if (!(part in current)) {
                        current[part] = {}
                    }
                    current = current[part]
                })
            })

        // Generate tree visualization
        function renderTree(node: TreeNode, prefix: string = ''): string {
            // Split entries into directories and files, then sort each alphabetically
            const entries = Object.entries(node)
            const dirs = entries
                .filter(([, value]) => Object.keys(value).length > 0)
                .sort(([a], [b]) => a.localeCompare(b))
            const files = entries
                .filter(([, value]) => Object.keys(value).length === 0)
                .sort(([a], [b]) => a.localeCompare(b))

            // Combine directories first, then files
            const sortedEntries = [...dirs, ...files]
            if (sortedEntries.length === 0) return ''

            let result = ''
            sortedEntries.forEach(([name, subNode], index) => {
                const isLastEntry = index === sortedEntries.length - 1
                // For the current item
                const connector = isLastEntry ? '└──' : '├──'
                const line = `${prefix}${connector} ${name}\n`

                // For the next level items
                const nextPrefix = prefix + (isLastEntry ? '    ' : '│   ')

                result += line
                result += renderTree(subNode, nextPrefix)
            })
            return result
        }

        return '<file_map>\n' + renderTree(tree) + '</file_map>\n\n'
    }

    const handleCopyRepository = () => {
        if (!files) return

        // Generate file tree and file contents
        const fileTree = generateFileTree(files.files)
        const fileContents =
            '<file_contents>\n' +
            Object.entries(files.files)
                .map(([filename, content]) => {
                    const ext = getFileExtension(filename)
                    return `File: ${filename}\n\`\`\`${ext}\n${content}\n\`\`\``
                })
                .join('\n\n') +
            '\n</file_contents>'

        navigator.clipboard.writeText(fileTree + fileContents)
    }

    return (
        <div className="h-12 bg-[#1A1B1E] border-b border-white/10 flex items-center px-4">
            <button
                onClick={handleCopyRepository}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                title="Copy repository content"
            >
                <ClipboardCopy className="h-4 w-4" />
                <span>Copy Repository</span>
            </button>
        </div>
    )
}

function getFileExtension(filename: string): string {
    const ext = filename.split('.').pop()
    return ext || ''
}
