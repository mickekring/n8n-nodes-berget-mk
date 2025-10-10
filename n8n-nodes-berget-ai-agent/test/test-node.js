const { BergetAiAgent } = require('../dist/nodes/BergetAiAgent/BergetAiAgent.node.js');

// Mock n8n execution context
const mockExecuteFunctions = {
    getInputData: () => [{ json: { test: 'data' } }],
    getNodeParameter: (param, index, defaultValue) => {
        const params = {
            'operation': 'agent',
            'model': 'meta-llama/Llama-3.3-70B-Instruct',
            'systemPrompt': 'You are a helpful AI assistant with access to tools.',
            'userMessage': 'What is the weather like today?',
            'tools.values': [
                {
                    name: 'get_weather',
                    description: 'Get the current weather for a location',
                    parameters: JSON.stringify({
                        type: 'object',
                        properties: {
                            location: {
                                type: 'string',
                                description: 'The city and country, e.g. Stockholm, Sweden'
                            }
                        },
                        required: ['location']
                    })
                }
            ],
            'options': { 
                temperature: 0.7, 
                max_tokens: 2000,
                max_iterations: 5,
                tool_choice: 'auto'
            }
        };
        return params[param] || defaultValue;
    },
    getCredentials: async () => ({
        apiKey: process.env.BERGET_API_KEY || 'test-key'
    }),
    continueOnFail: () => false,
    getNode: () => ({ name: 'Test Agent Node' })
};

async function testNode() {
    console.log('🧪 Testing Berget AI Agent Node...');
    
    try {
        const node = new BergetAiAgent();
        console.log('✅ Node created successfully');
        console.log('📋 Node description:', node.description.displayName);
        console.log('🔧 Available operations:', node.description.properties.find(p => p.name === 'operation').options.map(o => o.name));
        console.log('🤖 Available models:', node.description.properties.find(p => p.name === 'model').options.map(o => o.name));
        
        // Test with mock API key (will fail but shows structure)
        if (process.env.BERGET_API_KEY) {
            console.log('🔑 API key found, testing actual execution...');
            const result = await node.execute.call(mockExecuteFunctions);
            console.log('✅ Execution successful:', JSON.stringify(result, null, 2));
        } else {
            console.log('⚠️  No API key found. Set BERGET_API_KEY environment variable to test actual API calls.');
            console.log('💡 Example: BERGET_API_KEY=your-key npm test');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNode();
