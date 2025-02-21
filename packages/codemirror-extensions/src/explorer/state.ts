import { StateField, StateEffect, Compartment } from '@codemirror/state'
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { markdown } from '@codemirror/lang-markdown'
import { json } from '@codemirror/lang-json'
import crelt from 'crelt'
import { styles } from './styles'
import logger from '../utils/logger'

// Add debug logging helper
const debug = (...args: unknown[]) =>
    logger.debug({ module: 'Explorer' }, args.join(' '))

// Public types and effects
export interface File {
    name: string
    content: string
}

// Internal implementation details below
// Not exported to userland through index.ts

// Define the File Explorer State
interface FileExplorerState {
    files: File[]
    selectedFile: string | null
    expandedDirs: Set<string>
    projectName?: string
}

// Create a compartment for language support
export const languageCompartment = new Compartment()

// Language detection based on file extension
function getLanguageExtension(filename: string) {
    const ext = filename.toLowerCase().split('.').pop()
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
            return javascript({ typescript: ext.startsWith('ts') })
        case 'py':
            return python()
        case 'md':
        case 'markdown':
            return markdown()
        case 'json':
            return json()
        default:
            return null
    }
}

// Define state effects
export const selectFileEffect = StateEffect.define<string>()
export const updateFilesEffect = StateEffect.define<File[]>()
export const toggleDirEffect = StateEffect.define<string>()
export const setProjectNameEffect = StateEffect.define<string>()

// Create the state field
export const fileExplorerState = StateField.define<FileExplorerState>({
    create() {
        return {
            files: [],
            selectedFile: null,
            expandedDirs: new Set(),
            projectName: undefined,
        }
    },
    update(value, transaction) {
        for (const effect of transaction.effects) {
            if (effect.is(selectFileEffect)) {
                debug('File selected:', effect.value)
                return { ...value, selectedFile: effect.value }
            } else if (effect.is(updateFilesEffect)) {
                debug('Files updated:', effect.value.length, 'files')
                return {
                    ...value,
                    files: effect.value,
                    selectedFile: null,
                }
            } else if (effect.is(toggleDirEffect)) {
                const newExpandedDirs = new Set(value.expandedDirs)
                if (newExpandedDirs.has(effect.value)) {
                    newExpandedDirs.delete(effect.value)
                } else {
                    newExpandedDirs.add(effect.value)
                }
                debug('Directory toggled:', effect.value)
                return { ...value, expandedDirs: newExpandedDirs }
            } else if (effect.is(setProjectNameEffect)) {
                debug('Project name set:', effect.value)
                return { ...value, projectName: effect.value }
            }
        }
        return value
    },
})

function generateFileTree(files: File[]): string {
    interface TreeNode {
        [key: string]: TreeNode
    }
    const tree: TreeNode = {}

    // Build tree structure
    files
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(file => {
            const parts = file.name.split('/')
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
        const entries = Object.entries(node)
        const dirs = entries
            .filter(([, value]) => Object.keys(value).length > 0)
            .sort(([a], [b]) => a.localeCompare(b))
        const files = entries
            .filter(([, value]) => Object.keys(value).length === 0)
            .sort(([a], [b]) => a.localeCompare(b))

        const sortedEntries = [...dirs, ...files]
        if (sortedEntries.length === 0) return ''

        let result = ''
        sortedEntries.forEach(([name, subNode], index) => {
            const isLastEntry = index === sortedEntries.length - 1
            const connector = isLastEntry ? '└──' : '├──'
            const line = `${prefix}${connector} ${name}\n`
            const nextPrefix = prefix + (isLastEntry ? '    ' : '│   ')
            result += line
            if (!isLastEntry || Object.keys(subNode).length > 0) {
                result += renderTree(subNode, nextPrefix)
            }
        })
        return result
    }

    const treeContent = renderTree(tree).trimEnd()
    return '<file_map>\n' + treeContent + '\n</file_map>\n'
}

function generateFileContents(files: File[]): string {
    const content = files
        .map(file => {
            const ext = file.name.split('.').pop() || ''
            const trimmedContent = file.content.trim()
            return `File: ${file.name}\n\`\`\`${ext}\n${trimmedContent}\n\`\`\``
        })
        .join('\n\n')
        .trimEnd()

    return '<file_contents>\n' + content + '\n</file_contents>'
}

// Create Panel Specification
export const fileExplorerPanelSpec = {
    id: 'file-explorer',
    create(view: EditorView): HTMLElement {
        debug('Creating file explorer panel')
        const dom = crelt('div', { class: styles.explorerContent })
        renderFileExplorer(dom, view)
        return dom
    },
    update(view: EditorView): void {
        const dom = view.dom.querySelector(`.${styles.explorerContent}`)
        if (dom) {
            renderFileExplorer(dom as HTMLElement, view)
        }
    },
}

// Helper function to render the explorer
function renderFileExplorer(dom: HTMLElement, view: EditorView) {
    const explorerState = view.state.field(fileExplorerState)

    // Create header with copy button
    const headerContent = crelt(
        'span',
        { class: styles.explorerHeaderTitle },
        explorerState.projectName || 'Files',
    )

    const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`
    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

    const copyButton = crelt('button', {
        class: styles.explorerHeaderCopy,
        title: 'Copy Repository',
        onclick: (e: MouseEvent) => {
            const btn = e.currentTarget as HTMLButtonElement
            const fileTree = generateFileTree(explorerState.files)
            const fileContents = generateFileContents(explorerState.files)

            navigator.clipboard
                .writeText(fileTree + fileContents)
                .then(() => {
                    btn.innerHTML = checkIcon
                    btn.classList.add('success')
                    setTimeout(() => {
                        btn.innerHTML = copyIcon
                        btn.classList.remove('success')
                    }, 3000)
                })
                .catch(err => console.error('Failed to copy:', err))
        },
    })
    copyButton.innerHTML = copyIcon

    const header = crelt(
        'h3',
        { class: styles.explorerHeader },
        headerContent,
        copyButton,
    )

    const fileList = crelt('ul', { class: styles.explorerList })

    // Build and render file tree
    const fileTree = buildFileTree(explorerState.files)
    fileTree.forEach(node =>
        renderFileNode(node, 0, fileList, view, explorerState.selectedFile),
    )

    dom.innerHTML = ''
    dom.appendChild(header)
    dom.appendChild(fileList)
}

// Helper types and functions for file tree
interface FileNode {
    name: string
    path: string
    content?: string
    isDirectory: boolean
    children: FileNode[]
}

function buildFileTree(files: File[]): FileNode[] {
    const root: FileNode[] = []
    const directories: { [path: string]: FileNode } = {}

    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

    sortedFiles.forEach(file => {
        const parts = file.name.split('/')
        let currentPath = ''
        let currentChildren = root

        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            const isLastPart = index === parts.length - 1

            if (isLastPart) {
                currentChildren.push({
                    name: part,
                    path: currentPath,
                    content: file.content,
                    isDirectory: false,
                    children: [],
                })
            } else {
                if (!directories[currentPath]) {
                    const dirNode: FileNode = {
                        name: part,
                        path: currentPath,
                        isDirectory: true,
                        children: [],
                    }
                    directories[currentPath] = dirNode
                    currentChildren.push(dirNode)
                }
                currentChildren = directories[currentPath].children
            }
        })
    })

    return sortNodes(root)
}

function sortNodes(nodes: FileNode[]): FileNode[] {
    return nodes
        .sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) {
                return a.isDirectory ? -1 : 1
            }
            return a.name.localeCompare(b.name)
        })
        .map(node => {
            if (node.isDirectory) {
                node.children = sortNodes(node.children)
            }
            return node
        })
}

function renderFileNode(
    node: FileNode,
    level: number,
    container: HTMLElement,
    view: EditorView,
    selectedFile: string | null,
) {
    const indentation = 5 + level * 8
    const explorerState = view.state.field(fileExplorerState)

    if (node.isDirectory) {
        const isExpanded = explorerState.expandedDirs.has(node.path)
        const caretSpan = crelt(
            'span',
            {
                class: `${styles.directoryCaret}${
                    isExpanded ? ` ${styles.directoryCaretExpanded}` : ''
                }`,
            },
            '›',
        )
        const dirSpan = crelt(
            'span',
            { class: styles.explorerDirectory },
            node.name,
        )
        const dirItem = crelt(
            'li',
            {
                class: `${styles.explorerItem} ${styles.explorerDirectoryItem}`,
                style: `padding-left: ${indentation}px`,
                onclick: () => {
                    view.dispatch({
                        effects: toggleDirEffect.of(node.path),
                    })
                },
            },
            caretSpan,
            dirSpan,
        )
        container.appendChild(dirItem)

        if (isExpanded) {
            node.children.forEach(child =>
                renderFileNode(child, level + 1, container, view, selectedFile),
            )
        }
    } else {
        const iconSpan = crelt('span', { class: styles.explorerIcon }, '')
        const fileSpan = crelt(
            'span',
            { class: styles.explorerFile },
            node.name,
        )
        const fileItem = crelt(
            'li',
            {
                'data-file': node.path,
                class: `${styles.explorerItem} ${styles.explorerFileItem}${
                    node.path === selectedFile
                        ? ` ${styles.explorerItemSelected}`
                        : ''
                }`,
                style: `padding-left: ${indentation}px`,
                onclick: () => {
                    if (node.content) {
                        debug('Loading file:', node.path)
                        const langExtension = getLanguageExtension(node.path)
                        view.dispatch({
                            effects: [
                                selectFileEffect.of(node.path),
                                ...(langExtension
                                    ? [
                                          languageCompartment.reconfigure(
                                              langExtension,
                                          ),
                                      ]
                                    : []),
                            ],
                            changes: {
                                from: 0,
                                to: view.state.doc.length,
                                insert: node.content,
                            },
                        })
                    }
                },
            },
            iconSpan,
            fileSpan,
        )
        container.appendChild(fileItem)
    }
}

// Add ViewPlugin for handling state updates
export const fileExplorerPlugin = ViewPlugin.fromClass(
    class {
        update(update: ViewUpdate) {
            if (
                update.state.field(fileExplorerState) !==
                update.startState.field(fileExplorerState)
            ) {
                debug('Explorer state changed, updating panel')
                const dom = update.view.dom.querySelector(
                    `.${styles.explorerContent}`,
                )
                if (dom) {
                    renderFileExplorer(dom as HTMLElement, update.view)
                }
            }
        }
    },
)
