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
    getCredentials: async () => {
        const apiKey = process.env.BERGET_API_KEY;
        if (!apiKey) {
            throw new Error('BERGET_API_KEY environment variable is required for testing. Set it with: export BERGET_API_KEY=your-api-key');
        }
        return { apiKey };
    },
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
        const modelProperty = node.description.properties.find(p => p.name === 'model');
        if (modelProperty && modelProperty.options) {
            console.log('🤖 Available models:', modelProperty.options.map(o => o.name));
        } else {
            console.log('🤖 Models loaded dynamically from API');
        }
        
        // Test node structure only - actual execution requires API key
        console.log('📝 Note: This test only validates node structure.');
        console.log('💡 To test actual execution, run: BERGET_API_KEY=your-key npm test');
        
        if (process.env.BERGET_API_KEY) {
            console.log('🔑 API key found, testing actual execution...');
            try {
                const result = await node.execute.call(mockExecuteFunctions);
                console.log('✅ Execution successful:', JSON.stringify(result, null, 2));
            } catch (error) {
                if (error.message.includes('Tool execution is not supported')) {
                    console.log('✅ Expected behavior: Tool execution properly blocked');
                } else {
                    console.error('❌ Unexpected error:', error.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNode();
