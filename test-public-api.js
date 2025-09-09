// Simple test script for the new public API endpoint
const axios = require('axios');

const testPublicReporterAPI = async () => {
  try {
    console.log('🧪 Testing Public Reporter API...');
    
    // Test the new public endpoint
    const response = await axios.get('http://localhost:3000/user/reporter');
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`🎉 Success! Found ${response.data.count} reporters`);
    } else {
      console.log('❌ API returned error:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run the test
testPublicReporterAPI();

