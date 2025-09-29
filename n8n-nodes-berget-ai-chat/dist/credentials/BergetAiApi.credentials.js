"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BergetAiApi = void 0;
class BergetAiApi {
    constructor() {
        this.name = 'bergetAiApi';
        this.displayName = 'Berget AI API';
        this.documentationUrl = 'https://api.berget.ai/docs';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'Your Berget AI API key',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.berget.ai/v1',
                url: '/models',
            },
        };
    }
}
exports.BergetAiApi = BergetAiApi;
