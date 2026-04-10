import { ChatOpenAI } from '@langchain/openai';
import axios from 'axios';
import {
	NodeConnectionTypes,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

const BERGET_API_BASE_URL = 'https://api.berget.ai/v1';

interface BergetModel {
	id: string;
	name?: string;
	model_type?: string;
	owned_by?: string;
	capabilities?: { function_calling?: boolean };
}

export class BergetAiChatModel implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Chat Model',
		name: 'bergetAiChatModel',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		description: 'Use a Berget AI chat model with the n8n AI Agent, Chain, or other LangChain nodes',
		defaults: { name: 'Berget AI Chat Model' },
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
		},
		credentials: [{ name: 'bergetAiApi', required: true }],
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		outputNames: ['Model'],
		properties: [
			{
				displayName:
					'This node must be connected to an AI Agent, Chain, or another LangChain-based parent node. It cannot be executed on its own.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getModels' },
				default: '',
				required: true,
				description:
					'The Berget AI chat model to use. The list is fetched live from the Berget AI API.',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequencyPenalty',
						type: 'number',
						typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
						default: 0,
						description:
							"Positive values penalize new tokens based on their frequency in the text so far, decreasing the model's likelihood to repeat itself",
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 1024,
						description:
							'The maximum number of tokens to generate in the completion. Leave blank to let the model decide.',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 },
						default: 0,
						description:
							"Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics",
					},
					{
						displayName: 'Reasoning Effort',
						name: 'reasoningEffort',
						type: 'options',
						default: 'medium',
						description:
							'Controls how much thinking a reasoning-capable model performs (GPT-OSS, DeepSeek R1, etc.). The parameter is sent to the model, but note: the @langchain/openai JS package does not currently surface reasoning tokens back to the n8n Agent, so you will see the final answer only. The higher effort still affects answer quality even though the chain-of-thought is not visible.',
						options: [
							{
								name: 'Low',
								value: 'low',
								description: 'Favor speed, use fewer reasoning tokens',
							},
							{
								name: 'Medium',
								value: 'medium',
								description: 'Balance speed and accuracy',
							},
							{
								name: 'High',
								value: 'high',
								description: 'Favor accuracy, use more reasoning tokens',
							},
						],
					},
					{
						displayName: 'Response Format',
						name: 'responseFormat',
						type: 'options',
						default: 'text',
						options: [
							{ name: 'Text', value: 'text' },
							{ name: 'JSON Object', value: 'json_object' },
						],
						description:
							'Force the model to return a specific response format. Use JSON Object when you want parseable JSON output.',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 },
						default: 0.7,
						description:
							'Controls randomness. Lower values are more deterministic, higher values more creative.',
					},
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 60000,
						description: 'Maximum time in milliseconds to wait for an API response',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
						default: 1,
						description: 'Nucleus sampling cutoff. Alternative to temperature.',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('bergetAiApi');
				const response = await axios.get(`${BERGET_API_BASE_URL}/models`, {
					headers: {
						Authorization: `Bearer ${credentials.apiKey as string}`,
						'Content-Type': 'application/json',
					},
				});
				const models: BergetModel[] = response.data?.data ?? [];
				return models
					.filter((m) => m.model_type === 'text')
					.map((m) => ({
						name: m.id,
						value: m.id,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('bergetAiApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			frequencyPenalty?: number;
			maxTokens?: number;
			presencePenalty?: number;
			reasoningEffort?: 'low' | 'medium' | 'high';
			responseFormat?: 'text' | 'json_object';
			temperature?: number;
			timeout?: number;
			topP?: number;
		};

		const modelKwargs: Record<string, unknown> = {};
		if (options.reasoningEffort) {
			modelKwargs.reasoning_effort = options.reasoningEffort;
		}
		if (options.responseFormat && options.responseFormat !== 'text') {
			modelKwargs.response_format = { type: options.responseFormat };
		}

		const model = new ChatOpenAI({
			apiKey: credentials.apiKey as string,
			model: modelName,
			configuration: {
				baseURL: BERGET_API_BASE_URL,
			},
			streaming: true,
			temperature: options.temperature ?? 0.7,
			topP: options.topP ?? 1,
			maxTokens: options.maxTokens,
			frequencyPenalty: options.frequencyPenalty ?? 0,
			presencePenalty: options.presencePenalty ?? 0,
			timeout: options.timeout ?? 60000,
			modelKwargs: Object.keys(modelKwargs).length > 0 ? modelKwargs : undefined,
		});

		return { response: model };
	}
}
