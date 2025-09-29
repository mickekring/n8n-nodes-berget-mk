"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BergetAiChat = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const axios_1 = __importDefault(require("axios"));
class BergetAiChat {
    constructor() {
        this.description = {
            displayName: 'Berget AI Chat',
            name: 'bergetAiChat',
            icon: 'file:bergetai.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["model"]}}',
            description: 'Use Berget AI chat/text models',
            defaults: {
                name: 'Berget AI Chat',
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
                            name: 'Chat',
                            value: 'chat',
                            description: 'Create a chat completion',
                            action: 'Create a chat completion',
                        },
                    ],
                    default: 'chat',
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
                    default: 'meta-llama/Llama-3.1-8B-Instruct',
                    description: 'Model to use for chat completion',
                },
                {
                    displayName: 'Messages',
                    name: 'messages',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {
                        values: [
                            {
                                role: 'user',
                                content: '',
                            },
                        ],
                    },
                    options: [
                        {
                            displayName: 'Values',
                            name: 'values',
                            values: [
                                {
                                    displayName: 'Role',
                                    name: 'role',
                                    type: 'options',
                                    options: [
                                        {
                                            name: 'System',
                                            value: 'system',
                                        },
                                        {
                                            name: 'User',
                                            value: 'user',
                                        },
                                        {
                                            name: 'Assistant',
                                            value: 'assistant',
                                        },
                                    ],
                                    default: 'user',
                                },
                                {
                                    displayName: 'Content',
                                    name: 'content',
                                    type: 'string',
                                    typeOptions: {
                                        rows: 2,
                                    },
                                    default: '',
                                    description: 'Message content',
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
                            default: 1,
                            description: 'Controls randomness in responses. Lower values = more deterministic.',
                        },
                        {
                            displayName: 'Max Tokens',
                            name: 'max_tokens',
                            type: 'number',
                            default: 1000,
                            description: 'Maximum number of tokens to generate',
                        },
                        {
                            displayName: 'Stream',
                            name: 'stream',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to stream the response',
                        },
                        {
                            displayName: 'JSON Mode',
                            name: 'response_format',
                            type: 'options',
                            options: [
                                {
                                    name: 'Text',
                                    value: 'text',
                                },
                                {
                                    name: 'JSON',
                                    value: 'json_object',
                                },
                            ],
                            default: 'text',
                            description: 'Response format',
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        var _a, _b;
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('bergetAiApi');
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                const model = this.getNodeParameter('model', i);
                const messages = this.getNodeParameter('messages.values', i, []);
                const options = this.getNodeParameter('options', i, {});
                if (operation === 'chat') {
                    const body = {
                        model,
                        messages,
                        ...options,
                    };
                    // Hantera response_format
                    if (options.response_format === 'json_object') {
                        body.response_format = { type: 'json_object' };
                    }
                    const response = await axios_1.default.post('https://api.berget.ai/v1/chat/completions', body, {
                        headers: {
                            'Authorization': `Bearer ${credentials.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (response.status !== 200) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Berget AI API error: ${((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.message) || response.statusText}`, { itemIndex: i });
                    }
                    returnData.push({
                        json: response.data,
                        pairedItem: { item: i },
                    });
                }
            }
            catch (error) {
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
exports.BergetAiChat = BergetAiChat;
