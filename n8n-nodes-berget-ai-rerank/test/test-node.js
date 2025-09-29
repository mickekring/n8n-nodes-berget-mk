const { BergetAiRerank } = require('../dist/nodes/BergetAiRerank/BergetAiRerank.node.js');

const mockExecuteFunctions = {
    getInputData: () => [{ json: { query: 'test query' } }],
    getNodeParameter: (param, index, defaultValue) => {
        const params = {
            'operation': 'rerank',
            'model': 'BAAI/bge-reranker-v2-m3',
            'query': 'What is artificial intelligence?',
            'documents.values': [
                { text: 'AI is a branch of computer science' },
                { text: 'Machine learning is a subset of AI' },
                { text: 'Deep learning uses neural networks' }
            ],
            'options': { top_k: 3, return_documents: true }
        };
        return params[param] || defaultValue;
    },
    getCredentials: async () => ({
        apiKey: process.env.BERGET_API_KEY || 'test-key'
    }),
    continueOnFail: () => false,
    getNode: () => ({ name: 'Test Rerank Node' })
};

async function testNode() {
    console.log('🧪 Testing Berget AI Rerank Node...');
    
    try {
        const node = new BergetAiRerank();
        console.log('✅ Node created successfully');
        console.log('📋 Node description:', node.description.displayName);
        console.log('🤖 Available models:', node.description.properties.find(p => p.name === 'model').options.map(o => o.name));
        
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
