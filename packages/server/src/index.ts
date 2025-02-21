import { DurableObject } from 'cloudflare:workers';

import { Repository, GitHubError } from '@repoview/common';
import { createCorsResponse, handleCorsPreflightRequest } from './cors';

import type { GitHubContent, TreeResponse, GitHubErrorResponse } from '@repoview/common/types';

export class GitHubRepoDO extends DurableObject<Env> {
	private state: DurableObjectState;
	private CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
	private GITHUB_API_BASE = 'https://api.github.com';
	private activeFetch: Promise<Repository> | null = null;

	env: Env;

	/**
	 * @param state - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
		this.env = env;
	}

	private async fetchFromGitHub(path: string): Promise<any> {
		const headers: HeadersInit = {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'github-repo-do',
		};

		if (this.env.GITHUB_TOKEN) {
			headers.Authorization = `Bearer ${this.env.GITHUB_TOKEN}`;
		}

		console.log(`Fetching from GitHub: ${this.GITHUB_API_BASE}${path}`);
		const response = await fetch(`${this.GITHUB_API_BASE}${path}`, { headers });
		const responseText = await response.text();

		try {
			// Try to parse the response as JSON
			const data = JSON.parse(responseText);

			if (!response.ok) {
				const errorData = data as GitHubErrorResponse;
				throw new GitHubError(
					errorData.message || `GitHub API error: ${response.statusText}`,
					response.status,
					errorData.documentation_url,
				);
			}

			return data;
		} catch (error) {
			console.error('Failed to parse GitHub API response:', {
				status: response.status,
				statusText: response.statusText,
				responseText: responseText.slice(0, 200), // Log first 200 chars of response
				path,
			});

			throw new Error(`Failed to parse GitHub API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private async fetchRepoTree(owner: string, name: string): Promise<TreeResponse> {
		return this.fetchFromGitHub(`/repos/${owner}/${name}/git/trees/main?recursive=1`);
	}

	private async fetchFileContent(owner: string, name: string, path: string): Promise<string> {
		const response: GitHubContent = await this.fetchFromGitHub(`/repos/${owner}/${name}/contents/${path}`);

		if (response.encoding === 'base64') {
			return atob(response.content);
		}

		return response.content;
	}

	private async getFileFromStorage(path: string): Promise<string | null> {
		const content = await this.state.storage.get<string>(`file:${path}`);
		return content ?? null;
	}

	private async storeFile(path: string, content: string): Promise<void> {
		await this.state.storage.put(`file:${path}`, content);
	}

	private async getMetadata(): Promise<{
		owner: string;
		name: string;
		branch: string;
		lastUpdated: Date;
		fileList: string[];
	} | null> {
		const metadata = await this.state.storage.get<{
			owner: string;
			name: string;
			branch: string;
			lastUpdated: Date;
			fileList: string[];
		}>('metadata');
		return metadata ?? null;
	}

	private async storeMetadata(metadata: {
		owner: string;
		name: string;
		branch: string;
		lastUpdated: Date;
		fileList: string[];
	}): Promise<void> {
		await this.state.storage.put('metadata', metadata);
	}

	async getRepoData(owner: string, name: string): Promise<Repository> {
		// If there's an active fetch, wait for it
		if (this.activeFetch) {
			console.log('Waiting for active fetch to complete');
			return this.activeFetch;
		}

		// Check cache
		const metadata = await this.getMetadata();
		const isCacheValid = metadata && Date.now() - new Date(metadata.lastUpdated).getTime() <= this.CACHE_DURATION;
		if (isCacheValid && metadata) {
			console.log('Loading cached data');
			const files: Record<string, string> = {};

			await Promise.all(
				metadata.fileList.map(async (path) => {
					const content = await this.getFileFromStorage(path);
					if (content !== null) {
						files[path] = content;
					}
				}),
			);

			return {
				owner: metadata.owner,
				name: metadata.name,
				branch: metadata.branch,
				lastUpdated: metadata.lastUpdated,
				files,
			};
		}

		// Start new fetch with lock
		try {
			console.log('Starting new GitHub fetch');
			this.activeFetch = this.fetchAndCacheRepo(owner, name);
			const result = await this.activeFetch;
			return result;
		} finally {
			this.activeFetch = null;
		}
	}

	private async fetchAndCacheRepo(owner: string, name: string): Promise<Repository> {
		try {
			const treeData = await this.fetchRepoTree(owner, name);
			const files = treeData.tree.filter((item) => item.type === 'blob');
			const fileContents: Record<string, string> = {};
			const fileList: string[] = [];

			// Fetch and store files individually
			await Promise.all(
				files.map(async (file) => {
					try {
						const content = await this.fetchFileContent(owner, name, file.path);
						await this.storeFile(file.path, content);
						fileContents[file.path] = content;
						fileList.push(file.path);
					} catch (err) {
						console.error(`Failed to fetch content for ${file.path}:`, err);
						const errorMessage = `// Failed to load ${file.path}`;
						await this.storeFile(file.path, errorMessage);
						fileContents[file.path] = errorMessage;
						fileList.push(file.path);
					}
				}),
			);

			// Store metadata
			const metadata = {
				owner,
				name,
				branch: 'main',
				lastUpdated: new Date(),
				fileList,
			};
			await this.storeMetadata(metadata);

			return {
				...metadata,
				files: fileContents,
			};
		} catch (error) {
			if (error instanceof GitHubError) {
				throw error;
			}
			throw new Error(`Error fetching repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const [route, owner, name] = url.pathname.split('/').filter(Boolean);

		// Handle OPTIONS request for CORS preflight
		if (request.method === 'OPTIONS') {
			return handleCorsPreflightRequest(request);
		}

		if (route !== 'repo' || !owner || !name) {
			return createCorsResponse(request, 'Invalid request', 400);
		}

		const id = env.GITHUB_REPO_DO.idFromName(`${owner}/${name}`);
		const durableObject = env.GITHUB_REPO_DO.get(id);

		try {
			const data = await durableObject.getRepoData(owner, name);
			return createCorsResponse(request, data);
		} catch (error) {
			if (error instanceof GitHubError) {
				return createCorsResponse(request, error.message, error.status);
			}
			return createCorsResponse(request, error instanceof Error ? error.message : 'Unknown error', 500);
		}
	},
} satisfies ExportedHandler<Env>;
