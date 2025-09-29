const { BergetAiChat } = require('../dist/nodes/BergetAiChat/BergetAiChat.node.js');

// Mock n8n execution context
const mockExecuteFunctions = {
    getInputData: () => [{ json: { test: 'data' } }],
    getNodeParameter: (param, index, defaultValue) => {
        const params = {
            'operation': 'chat',
            'model': 'meta-llama/Llama-3.1-8B-Instruct',
            'messages.values': [
                { role: 'user', content: 'Hello, how are you?' }
            ],
            'options': { temperature: 0.7, max_tokens: 100 }
        };
        return params[param] || defaultValue;
    },
    getCredentials: async () => ({
        apiKey: process.env.BERGET_AI_API_KEY || 'test-key'
    }),
    continueOnFail: () => false,
    getNode: () => ({ name: 'Test Node' })
};

async function testNode() {
    console.log('🧪 Testing Berget AI Chat Node...');
    
    try {
        const node = new BergetAiChat();
        console.log('✅ Node created successfully');
        console.log('📋 Node description:', node.description.displayName);
        console.log('🔧 Available operations:', node.description.properties.find(p => p.name === 'operation').options.map(o => o.name));
        console.log('🤖 Available models:', node.description.properties.find(p => p.name === 'model').options.map(o => o.name));
        
        // Test with mock API key (will fail but shows structure)
        if (process.env.BERGET_AI_API_KEY) {
            console.log('🔑 API key found, testing actual execution...');
            const result = await node.execute.call(mockExecuteFunctions);
            console.log('✅ Execution successful:', result);
        } else {
            console.log('⚠️  No API key found. Set BERGET_AI_API_KEY environment variable to test actual API calls.');
            console.log('💡 Example: BERGET_AI_API_KEY=your-key npm test');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNode();
