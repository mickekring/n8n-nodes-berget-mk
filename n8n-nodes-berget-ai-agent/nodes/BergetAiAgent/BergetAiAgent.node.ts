import {
	IExecuteFunctions,
	INodeExecutionData,
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
				options: [
					{
						name: 'Llama 3.1 8B Instruct',
						value: 'meta-llama/Llama-3.1-8B-Instruct',
					},
					{
						name: 'Llama 3.3 70B Instruct',
						value: 'meta-llama/Llama-3.3-70B-Instruct',
					},
					{
						name: 'DeepSeek R1 Microsoft AI Finetuned',
						value: 'unsloth/MAI-DS-R1-GGUF',
					},
					{
						name: 'Mistral Small 3.1 24B Instruct 2503',
						value: 'mistralai/Mistral-Small-3.1-24B-Instruct-2503',
					},
					{
						name: 'Qwen3 32B',
						value: 'Qwen/Qwen3-32B',
					},
					{
						name: 'Devstral Small 2505',
						value: 'mistralai/Devstral-Small-2505',
					},
					{
						name: 'GPT-OSS-120B',
						value: 'openai/gpt-oss-120b',
					},
				],
				default: 'meta-llama/Llama-3.3-70B-Instruct',
				description: 'Model to use for the agent',
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
					// Parse tools
					const tools = toolsConfig.map(tool => {
						try {
							const parameters = typeof tool.parameters === 'string' 
								? JSON.parse(tool.parameters) 
								: tool.parameters;
							return {
								type: 'function',
								function: {
									name: tool.name,
									description: tool.description,
									parameters,
								},
							};
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid JSON in parameters for tool "${tool.name}"`,
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
							throw new NodeOperationError(
								this.getNode(),
								`Berget AI API error: ${response.data?.error?.message || response.statusText}`,
								{ itemIndex: i }
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

								// Add tool response placeholder
								// In a real implementation, this would execute the tool
								// For now, we return a message indicating the tool would be called
								messages.push({
									role: 'tool',
									tool_call_id: toolCall.id,
									content: JSON.stringify({
										message: 'Tool execution would happen here',
										tool_name: toolCall.function.name,
										arguments: toolCall.function.arguments,
									}),
								});
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
