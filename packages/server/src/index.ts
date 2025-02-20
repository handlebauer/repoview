import { DurableObject } from 'cloudflare:workers';
import { Repository, TreeResponse, GitHubContent, GitHubError, GitHubErrorResponse } from './types';

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

	async getRepoData(owner: string, name: string): Promise<Repository> {
		// If there's an active fetch, wait for it
		if (this.activeFetch) {
			console.log('Waiting for active fetch to complete');
			return this.activeFetch;
		}

		// Check cache
		const data = await this.state.storage.get<Repository>('repoData');
		const isCacheValid = data && Date.now() - new Date(data.lastUpdated).getTime() <= this.CACHE_DURATION;
		if (isCacheValid) {
			console.log('Returning cached data');
			return data;
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

			// Fetch all file contents in parallel with error handling
			await Promise.all(
				files.map(async (file) => {
					try {
						fileContents[file.path] = await this.fetchFileContent(owner, name, file.path);
					} catch (err) {
						console.error(`Failed to fetch content for ${file.path}:`, err);
						fileContents[file.path] = `// Failed to load ${file.path}`;
					}
				}),
			);

			const repoData: Repository = {
				owner,
				name,
				branch: 'main',
				files: fileContents,
				lastUpdated: new Date(),
			};

			// Atomic storage operation
			await this.state.storage.put('repoData', repoData);
			return repoData;
		} catch (error) {
			if (error instanceof GitHubError) {
				throw error;
			}
			throw new Error(`Error fetching repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param _ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const [route, owner, name] = url.pathname.split('/').filter(Boolean);

		if (route !== 'repo' || !owner || !name) {
			return new Response('Invalid request', { status: 400 });
		}

		const id = env.GITHUB_REPO_DO.idFromName(`${owner}/${name}`);
		const durableObject = env.GITHUB_REPO_DO.get(id);

		try {
			const data = await durableObject.getRepoData(owner, name);
			return new Response(JSON.stringify(data), {
				headers: { 'Content-Type': 'application/json' },
			});
		} catch (error) {
			if (error instanceof GitHubError) {
				return new Response(error.message, {
					status: error.status,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response(error instanceof Error ? error.message : 'Unknown error', {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
} satisfies ExportedHandler<Env>;
