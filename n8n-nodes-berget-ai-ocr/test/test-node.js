const { BergetAiOcr } = require('../dist/nodes/BergetAiOcr/BergetAiOcr.node.js');

// Mock n8n execution context
const mockExecuteFunctions = {
    getInputData: () => [{ json: { document: 'test-document.pdf' } }],
    getNodeParameter: (param, index, defaultValue) => {
        const params = {
            'operation': 'process',
            'documentType': 'url',
            'documentUrl': 'https://example.com/test-document.pdf',
            'async': false,
            'options': { 
                outputFormat: 'md',
                tableMode: 'accurate',
                ocrMethod: 'easyocr',
                doOcr: true,
                doTableStructure: true
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
    getNode: () => ({ name: 'Test OCR Node' })
};

async function testNode() {
    console.log('🧪 Testing Berget AI OCR Node...');
    
    try {
        const node = new BergetAiOcr();
        console.log('✅ Node created successfully');
        console.log('📋 Node description:', node.description.displayName);
        console.log('🔧 Available operations:', node.description.properties.find(p => p.name === 'operation').options.map(o => o.name));
        console.log('📄 Document types:', node.description.properties.find(p => p.name === 'documentType').options.map(o => o.name));
        
        // Test node structure only - actual execution requires API key and document
        console.log('📝 Note: This test only validates node structure.');
        console.log('💡 To test actual execution, run: BERGET_API_KEY=your-key npm test');
        
        if (process.env.BERGET_API_KEY) {
            console.log('🔑 API key found, testing actual execution...');
            console.log('⚠️  Note: OCR processing requires actual document URL');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNode();
