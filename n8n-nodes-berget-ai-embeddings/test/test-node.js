const { BergetAiEmbeddings } = require('../dist/nodes/BergetAiEmbeddings/BergetAiEmbeddings.node.js');

const mockExecuteFunctions = {
    getInputData: () => [{ json: { text: 'Hello world' } }],
    getNodeParameter: (param, index, defaultValue) => {
        const params = {
            'operation': 'embeddings',
            'model': 'intfloat/multilingual-e5-large-instruct',
            'input': 'This is a test text for embeddings',
            'options': { encoding_format: 'float' }
        };
        return params[param] || defaultValue;
    },
    getCredentials: async () => ({
        apiKey: process.env.BERGET_API_KEY || 'test-key'
    }),
    continueOnFail: () => false,
    getNode: () => ({ name: 'Test Embeddings Node' })
};

async function testNode() {
    console.log('🧪 Testing Berget AI Embeddings Node...');
    
    try {
        const node = new BergetAiEmbeddings();
        console.log('✅ Node created successfully');
        console.log('📋 Node description:', node.description.displayName);
        const modelProperty = node.description.properties.find(p => p.name === 'model');
        if (modelProperty && modelProperty.options) {
            console.log('🤖 Available models:', modelProperty.options.map(o => o.name));
        } else {
            console.log('🤖 Models loaded dynamically from API');
        }
        
        if (process.env.BERGET_API_KEY) {
            console.log('🔑 API key found, testing actual execution...');
            const result = await node.execute.call(mockExecuteFunctions);
            console.log('✅ Execution successful:', result);
        } else {
            console.log('⚠️  No API key found. Set BERGET_API_KEY environment variable to test actual API calls.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNode();
