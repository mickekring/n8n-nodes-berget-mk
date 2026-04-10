import axios from 'axios';
import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

export const BERGET_API_BASE_URL = 'https://api.berget.ai/v1';

export interface BergetModel {
	id: string;
	name?: string;
	model_type?: string;
	owned_by?: string;
	capabilities?: { function_calling?: boolean };
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
