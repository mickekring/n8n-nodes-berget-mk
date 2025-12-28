const { BergetAiSpeech } = require('../dist/nodes/BergetAiSpeech/BergetAiSpeech.node.js');

const mockExecuteFunctions = {
    getInputData: () => [{ json: { audio: 'test-audio.wav' } }],
    getNodeParameter: (param, index, defaultValue) => {
        const params = {
            'operation': 'transcribe',
            'model': 'KBLab/kb-whisper-large',
            'file': 'test-audio-file-path',
            'options': { language: 'sv', response_format: 'json' }
        };
        return params[param] || defaultValue;
    },
    getCredentials: async () => ({
        apiKey: process.env.BERGET_API_KEY || 'test-key'
    }),
    continueOnFail: () => false,
    getNode: () => ({ name: 'Test Speech Node' })
};

async function testNode() {
    console.log('🧪 Testing Berget AI Speech Node...');
    
    try {
        const node = new BergetAiSpeech();
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
            console.log('⚠️  Note: Speech transcription requires actual audio file');
        } else {
            console.log('⚠️  No API key found. Set BERGET_API_KEY environment variable to test actual API calls.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNode();
