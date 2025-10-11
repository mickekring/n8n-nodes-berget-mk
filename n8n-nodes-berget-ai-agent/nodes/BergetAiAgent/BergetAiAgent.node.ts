import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import axios from 'axios';

export class BergetAiAgent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Berget AI Agent',
		name: 'bergetAiAgent',
		icon: 'file:bergetai.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
		description: 'AI Agent with tool calling capabilities using Berget AI models',
		defaults: {
			name: 'Berget AI Agent',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'bergetAiApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: 'https://api.berget.ai/v1',
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Agent',
						value: 'agent',
						description: 'Run agent with tool calling',
						action: 'Run agent with tool calling',
					},
				],
				default: 'agent',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				default: '',
				description: 'Model to use for the agent',
				required: true,
			},
			{
				displayName: 'System Prompt',
				name: 'systemPrompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: 'You are a helpful AI assistant with access to tools. Use the tools when necessary to help the user accomplish their tasks.',
				description: 'System prompt that defines the agent\'s behavior and capabilities',
			},
			{
				displayName: 'User Message',
				name: 'userMessage',
				type: 'string',
				typeOptions: {
					rows: 2,
				},
				default: '',
				description: 'The user\'s message or task for the agent',
				required: true,
			},
			{
				displayName: 'Tools',
				name: 'tools',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					values: [],
				},
				description: 'Tools available to the agent',
				options: [
					{
						displayName: 'Tool',
						name: 'values',
						values: [
							{
								displayName: 'Tool Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the tool',
								required: true,
							},
							{
								displayName: 'Tool Description',
								name: 'description',
								type: 'string',
								typeOptions: {
									rows: 2,
								},
								default: '',
								description: 'Description of what the tool does',
								required: true,
							},
							{
								displayName: 'Parameters',
								name: 'parameters',
								type: 'json',
								default: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
								description: 'JSON Schema for tool parameters',
							},
						],
					},
				],
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add options',
				default: {},
				options: [
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 2,
							numberStepSize: 0.1,
						},
						default: 0.7,
						description: 'Controls randomness in responses. Lower values = more deterministic.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 2000,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Max Iterations',
						name: 'max_iterations',
						type: 'number',
						default: 5,
						description: 'Maximum number of agent iterations (tool calls)',
					},
					{
						displayName: 'Tool Choice',
						name: 'tool_choice',
						type: 'options',
						options: [
							{
								name: 'Auto',
								value: 'auto',
								description: 'Model decides when to use tools',
							},
							{
								name: 'Required',
								value: 'required',
								description: 'Model must use a tool',
							},
							{
								name: 'None',
								value: 'none',
								description: 'Model will not use tools',
							},
						],
						default: 'auto',
						description: 'Control how the model uses tools',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				try {
					const credentials = await this.getCredentials('bergetAiApi');
					
					const response = await axios.get('https://api.berget.ai/v1/models', {
						headers: {
							'Authorization': `Bearer ${credentials.apiKey}`,
							'Content-Type': 'application/json',
						},
					});

					if (response.status !== 200) {
						throw new Error(`API error: ${response.statusText}`);
					}

					// Filter models that support chat completions and tool calling
					const models = response.data.data || [];
					const chatModels = models.filter((model: any) => {
						// Filter for models that support chat completions
						// Most text/chat models support tool calling
						const modelId = model.id || '';
						return modelId.includes('llama') || 
							   modelId.includes('mistral') || 
							   modelId.includes('qwen') || 
							   modelId.includes('deepseek') || 
							   modelId.includes('gpt') ||
							   modelId.toLowerCase().includes('instruct') ||
							   modelId.toLowerCase().includes('chat');
					});

					return chatModels.map((model: any) => ({
						name: model.id,
						value: model.id,
						description: `${model.id}${model.owned_by ? ` (${model.owned_by})` : ''}`,
					})).sort((a: any, b: any) => a.name.localeCompare(b.name));

				} catch (error) {
					// Fallback to hardcoded models if API call fails
					console.warn('Failed to load models from API, using fallback list:', error);
					return [
						{
							name: 'meta-llama/Llama-3.3-70B-Instruct',
							value: 'meta-llama/Llama-3.3-70B-Instruct',
							description: 'Llama 3.3 70B Instruct (fallback)',
						},
						{
							name: 'meta-llama/Llama-3.1-8B-Instruct',
							value: 'meta-llama/Llama-3.1-8B-Instruct',
							description: 'Llama 3.1 8B Instruct (fallback)',
						},
					];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('bergetAiApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const model = this.getNodeParameter('model', i) as string;
				const systemPrompt = this.getNodeParameter('systemPrompt', i) as string;
				const userMessage = this.getNodeParameter('userMessage', i) as string;
				const toolsConfig = this.getNodeParameter('tools.values', i, []) as Array<{
					name: string;
					description: string;
					parameters: string;
				}>;
				const options = this.getNodeParameter('options', i, {}) as any;

				if (operation === 'agent') {
					// Parse and validate tools
					const tools = toolsConfig.map(tool => {
						if (!tool.name || !tool.description) {
							throw new NodeOperationError(
								this.getNode(),
								'Tool name and description are required',
								{ itemIndex: i }
							);
						}

						try {
							const parameters = typeof tool.parameters === 'string' 
								? JSON.parse(tool.parameters) 
								: tool.parameters;
							
							// Validate that parameters is a valid JSON Schema object
							if (typeof parameters !== 'object' || parameters === null) {
								throw new Error('Parameters must be a valid JSON Schema object');
							}

							return {
								type: 'function',
								function: {
									name: tool.name.trim(),
									description: tool.description.trim(),
									parameters,
								},
							};
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid JSON Schema in parameters for tool "${tool.name}": ${error instanceof Error ? error.message : String(error)}`,
								{ itemIndex: i }
							);
						}
					});

					// Initialize conversation
					const messages: Array<any> = [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userMessage },
					];

					const maxIterations = options.max_iterations || 5;
					let iteration = 0;
					let finalResponse = null;
					const toolCalls: Array<any> = [];

					// Agent loop
					while (iteration < maxIterations) {
						iteration++;

						const body: any = {
							model,
							messages,
							temperature: options.temperature ?? 0.7,
							max_tokens: options.max_tokens ?? 2000,
						};

						// Add tools if available
						if (tools.length > 0) {
							body.tools = tools;
							if (options.tool_choice) {
								body.tool_choice = options.tool_choice;
							}
						}

						const response = await axios.post(
							'https://api.berget.ai/v1/chat/completions',
							body,
							{
								headers: {
									'Authorization': `Bearer ${credentials.apiKey}`,
									'Content-Type': 'application/json',
								},
							}
						);

						if (response.status !== 200) {
							const errorMessage = response.data?.error?.message || 
								response.data?.message || 
								response.statusText || 
								'Unknown API error';
							
							throw new NodeOperationError(
								this.getNode(),
								`Berget AI API error (${response.status}): ${errorMessage}. Check your API key and model availability`,
								{ 
									itemIndex: i
								}
							);
						}

						const choice = response.data.choices[0];
						const message = choice.message;

						// Add assistant's response to messages
						messages.push(message);

						// Check if there are tool calls
						if (message.tool_calls && message.tool_calls.length > 0) {
							// Process each tool call
							for (const toolCall of message.tool_calls) {
								toolCalls.push({
									id: toolCall.id,
									name: toolCall.function.name,
									arguments: toolCall.function.arguments,
									iteration,
								});

								// Tool execution is not implemented in this node
								// This node only handles the AI conversation flow and tool call detection
								// Actual tool execution should be handled by subsequent nodes in the workflow
								// The tool calls are returned in the output for further processing
								
								throw new NodeOperationError(
									this.getNode(),
									`Tool execution is not supported in this node. The AI model requested to call tool "${toolCall.function.name}" but this node only handles conversation flow. Use the tool calls in the output to implement actual tool execution in your workflow.`,
									{ 
										itemIndex: i,
										description: 'Connect this node to other nodes that can execute the requested tools, then feed the results back to continue the conversation.'
									}
								);
							}
						} else {
							// No tool calls, agent is done
							finalResponse = message.content;
							break;
						}

						// Check finish reason
						if (choice.finish_reason === 'stop') {
							finalResponse = message.content;
							break;
						}
					}

					returnData.push({
						json: {
							response: finalResponse,
							tool_calls: toolCalls,
							iterations: iteration,
							messages: messages,
							model,
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
