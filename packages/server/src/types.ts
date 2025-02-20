export interface Repository {
	owner: string;
	name: string;
	branch: string;
	files: Record<string, string>;
	lastUpdated: Date;
}

export interface TreeItem {
	path: string;
	mode: string;
	type: 'blob' | 'tree';
	sha: string;
	size?: number;
	url: string;
}

export interface TreeResponse {
	sha: string;
	truncated: boolean;
	tree: TreeItem[];
}

export interface GitHubContent {
	content: string;
	encoding: 'base64' | 'utf-8';
	path: string;
}

export interface GitHubErrorResponse {
	message: string;
	documentation_url?: string;
}

export class GitHubError extends Error {
	constructor(
		message: string,
		public status: number,
		public documentation_url?: string,
	) {
		super(message);
		this.name = 'GitHubError';
	}
}
