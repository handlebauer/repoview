const ALLOWED_ORIGINS = [
	/^https?:\/\/localhost(:\d+)?$/, // localhost with optional port
	/^https:\/\/(.*\.)?repoview\.now$/, // repoview.now and subdomains
] as const;

export function getCorsHeaders(request: Request): HeadersInit {
	const origin = request.headers.get('Origin') || '';
	const isAllowedOrigin = ALLOWED_ORIGINS.some((pattern) => pattern.test(origin));

	return {
		'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400',
	};
}

export function createCorsResponse(request: Request, body: any, status = 200, extraHeaders: HeadersInit = {}): Response {
	return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...getCorsHeaders(request),
			...extraHeaders,
		},
	});
}

export function handleCorsPreflightRequest(request: Request): Response {
	return new Response(null, { headers: getCorsHeaders(request) });
}
