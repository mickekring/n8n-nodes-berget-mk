import axios from 'axios';
import {
	NodeOperationError,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
} from 'n8n-workflow';

export const BERGET_API_BASE_URL = 'https://api.berget.ai/v1';

export interface BergetModel {
	id: string;
	name?: string;
	model_type?: string;
	owned_by?: string;
	capabilities?: {
		function_calling?: boolean;
		vision?: boolean;
		json_mode?: boolean;
		classification?: boolean;
		embeddings?: boolean;
		formatted_output?: boolean;
		streaming?: boolean;
	};
}

export async function fetchBergetModels(context: ILoadOptionsFunctions): Promise<BergetModel[]> {
	const credentials = await context.getCredentials('bergetAiApi');
	const response = await axios.get(`${BERGET_API_BASE_URL}/models`, {
		headers: {
			Authorization: `Bearer ${credentials.apiKey as string}`,
			'Content-Type': 'application/json',
		},
	});
	return (response.data?.data ?? []) as BergetModel[];
}

export async function loadModelOptions(
	context: ILoadOptionsFunctions,
	filter: (model: BergetModel) => boolean,
): Promise<INodePropertyOptions[]> {
	const models = await fetchBergetModels(context);
	return models
		.filter(filter)
		.map((m) => ({
			name: m.id,
			value: m.id,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export async function bergetRequest(
	apiKey: string,
	method: 'GET' | 'POST',
	path: string,
	body?: unknown,
	extraHeaders?: Record<string, string>,
): Promise<{ status: number; data: unknown }> {
	const response = await axios.request({
		method,
		url: `${BERGET_API_BASE_URL}${path}`,
		data: body,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			...extraHeaders,
		},
		validateStatus: () => true,
	});
	return { status: response.status, data: response.data };
}

/**
 * Format a Berget API error response into a human-readable string.
 *
 * Berget's API returns errors in multiple shapes across endpoints, so we
 * handle each possibility defensively. Always includes HTTP status code,
 * and surfaces error code + details when the API provides them.
 */
export function formatBergetError(resourceLabel: string, status: number, data: unknown): string {
	const parts: string[] = [`Berget AI ${resourceLabel} error (HTTP ${status})`];

	if (data && typeof data === 'object') {
		const d = data as Record<string, unknown>;

		// Shape A (OpenAPI-documented): { error: "message string", code: "...", details: ... }
		// Shape B (OpenAI-compatible):   { error: { message: "...", type: "...", code: "..." } }
		// Shape C (some endpoints):      { message: "..." }
		// Shape D (bare string on some):  "error text"
		let messageText: string | undefined;
		let code: string | undefined;
		let details: unknown;

		const err = d.error;
		if (typeof err === 'string') {
			messageText = err;
			code = typeof d.code === 'string' ? d.code : undefined;
			details = d.details;
		} else if (err && typeof err === 'object') {
			const eo = err as Record<string, unknown>;
			if (typeof eo.message === 'string') messageText = eo.message;
			if (typeof eo.code === 'string') code = eo.code;
			if (eo.type && typeof eo.type === 'string' && !code) code = eo.type;
			if (eo.details !== undefined) details = eo.details;
		} else if (typeof d.message === 'string') {
			messageText = d.message;
		}

		if (messageText) parts.push(messageText);
		if (code) parts.push(`code: ${code}`);
		if (details !== undefined) {
			const detailsStr =
				typeof details === 'string' ? details : JSON.stringify(details);
			if (detailsStr && detailsStr !== '{}' && detailsStr !== 'null') {
				parts.push(`details: ${detailsStr}`);
			}
		}
	} else if (typeof data === 'string' && data.trim().length > 0) {
		parts.push(data.trim().slice(0, 500));
	}

	return parts.join(' — ');
}

/**
 * Throw a NodeOperationError formatted with `formatBergetError`. Keeps the
 * five `if (status !== 200) throw ...` blocks in the resource modules
 * down to a single line each.
 */
export function throwBergetError(
	context: IExecuteFunctions,
	itemIndex: number,
	resourceLabel: string,
	status: number,
	data: unknown,
	suffix?: string,
): never {
	const message = formatBergetError(resourceLabel, status, data) + (suffix ?? '');
	throw new NodeOperationError(context.getNode(), message, { itemIndex });
}
