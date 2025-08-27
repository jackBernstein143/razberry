const fs = require('fs')
const path = require('path')

async function testStoryWithAudioAPI() {
  const url = 'http://localhost:3004/api/story'
  
  const testPrompt = {
    prompt: "A chance encounter at a coffee shop"
  }
  
  console.log('Testing API with prompt:', testPrompt.prompt)
  console.log('This will generate both story text and audio...\n')
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPrompt)
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.error('API Error:', response.status, data)
      return
    }
    
    console.log('✅ API Test Successful!')
    console.log('Response status:', response.status)
    console.log('Story length:', data.storyText?.length || 0, 'characters')
    
    if (data.audio) {
      console.log('Audio generated:', data.audio.mime)
      console.log('Audio size (base64):', data.audio.base64.length, 'characters')
      
      // Save audio to file for testing
      const audioBuffer = Buffer.from(data.audio.base64, 'base64')
      const outputPath = path.join(__dirname, 'test-output.mp3')
      fs.writeFileSync(outputPath, audioBuffer)
      console.log(`\n📁 Audio saved to: ${outputPath}`)
      console.log(`   File size: ${(audioBuffer.length / 1024).toFixed(2)} KB`)
    } else {
      console.log('⚠️ No audio was generated')
    }
    
    console.log('\n--- Story Preview (first 200 chars) ---')
    console.log(data.storyText?.substring(0, 200) + '...')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log('Starting API test with audio generation...')
console.log('Make sure the dev server is running')
console.log('Note: Audio generation may take a few seconds')
console.log('-----------------------------------\n')

testStoryWithAudioAPI()