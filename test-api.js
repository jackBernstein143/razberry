async function testStoryAPI() {
  const url = 'http://localhost:3003/api/story'
  
  const testPrompt = {
    prompt: "A mysterious stranger arrives at a masquerade ball"
  }
  
  console.log('Testing API with prompt:', testPrompt.prompt)
  
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
    
    console.log('\n✅ API Test Successful!')
    console.log('Response status:', response.status)
    console.log('Story length:', data.storyText?.length || 0, 'characters')
    console.log('\n--- Story Preview (first 200 chars) ---')
    console.log(data.storyText?.substring(0, 200) + '...')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

console.log('Starting API test...')
console.log('Make sure the dev server is running on port 3002')
console.log('-----------------------------------\n')

testStoryAPI()