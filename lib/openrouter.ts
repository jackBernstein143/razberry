interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens?: number
  temperature?: number
}

interface OpenRouterChoice {
  message: {
    content: string
    role: string
  }
  finish_reason: string
}

interface OpenRouterResponse {
  id: string
  choices: OpenRouterChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: {
    message: string
    type: string
    code: string
  }
}

const SYSTEM_PROMPT = `You are an adult fiction ghostwriter specializing in explicit erotic content. Write a sexually explicit, adult-only story based on the user's prompt.

Requirements:
- USE EXPLICIT SEXUAL VOCABULARY: cock, pussy, cunt, fuck, ass, tits, cum, etc.
- Do NOT use euphemisms or flowery language - be direct and graphic
- Include detailed descriptions of sexual acts, bodily fluids, and physical responses
- Describe penetration, oral sex, and other acts explicitly
- Focus on consensual adult encounters with enthusiasm from all parties
- Include dirty talk and sexually explicit dialogue
- Build tension then deliver graphic sexual content
- Make it arousing, raw, and pornographic in nature

IMPORTANT - Make each story unique:
- AVOID cliché openings like "dimly lit room", "shadows danced", "moonlight streaming"
- Start with action, dialogue, or specific sensory details
- Jump straight into the scenario the user described
- Each story should feel distinct and fresh
- Vary your sentence structure and pacing

Strict boundaries - NEVER include:
- Anyone under 18 years old
- Non-consensual acts of any kind
- Illegal activities
- Extreme violence or harm
- Incest or family relations

IMPORTANT - Keep it SHORT for audio (about 150-200 words total, roughly 1 minute when read aloud):
- Write 2-3 short paragraphs maximum
- Get to the action quickly
- Keep sentences punchy and direct
- Focus on the hottest moments only

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
TITLE: [A short, explicit 3-5 word title that captures the essence of the story]
DESCRIPTION: [One sentence description of what happens in the story, be explicit and direct about the sexual content]
STORY: [Your hardcore erotica story here]

The title should be provocative and make it obvious what the story is about (e.g., "Pool Boy's Wet Adventure", "Secretary's Desk Encounter", "Neighbor's Late Night Visit").
The description should be a single sentence that tells the reader exactly what sexual scenario to expect (e.g., "A frustrated housewife seduces her young pool cleaner for an afternoon of rough poolside fucking").

Write hardcore erotica that sounds natural when read aloud. Be as sexually explicit as possible while respecting the boundaries above.`

const SAMPLE_SYSTEM_PROMPT = `You are an adult fiction ghostwriter specializing in explicit erotic content. Write a SHORT TEASER story that starts casual, gets steamy, shows a glimpse of explicit content, then ends on a cliffhanger.

Requirements for SAMPLE stories:
- Start with casual/romantic setup (30-40 words)
- Build sexual tension quickly (30-40 words)  
- Show just a GLIMPSE of explicit content - use one or two explicit words like "cock", "pussy", "fuck" (20-30 words)
- END ON A CLIFFHANGER - stop mid-action with "..."
- Total length: 80-110 words maximum (about 30-40 seconds of audio)
- Make it clear there's much more to come

Example ending styles:
- "She gasped as he pushed inside her wet pussy, stretching her perfectly when suddenly..."
- "His cock throbbed as she took him deeper, her moans getting louder until..."
- "'Fuck me harder,' she begged, grinding against him desperately as the door..."

Strict boundaries - NEVER include:
- Anyone under 18 years old
- Non-consensual acts of any kind
- Illegal activities
- Extreme violence or harm
- Incest or family relations

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
TITLE: [A short, teasing 3-5 word title]
DESCRIPTION: [One sentence hinting at what's about to happen]
STORY: [Your teaser story with cliffhanger ending]

Write a teaser that leaves them desperately wanting more.`

export interface StoryResult {
  title: string
  description: string
  story: string
}

export async function generateStoryFromPrompt(prompt: string, isSample: boolean = false): Promise<StoryResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL
  const appName = process.env.OPENROUTER_APP_NAME
  const siteUrl = process.env.OPENROUTER_SITE_URL

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  if (!model) {
    throw new Error('OPENROUTER_MODEL is not configured')
  }

  const requestBody: OpenRouterRequest = {
    model,
    messages: [
      {
        role: 'system',
        content: isSample ? SAMPLE_SYSTEM_PROMPT : SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: isSample ? 150 : 300,
    temperature: 0.8
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': appName || 'Story Generator',
        'HTTP-Referer': siteUrl || 'http://localhost:3000'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const errorMessage = errorData?.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`
      console.error('OpenRouter API error:', errorData || response.statusText)
      throw new Error(errorMessage)
    }

    const data: OpenRouterResponse = await response.json()

    if (data.error) {
      console.error('OpenRouter returned error:', data.error)
      throw new Error(data.error.message || 'Failed to generate story')
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response generated from OpenRouter')
    }

    const fullContent = data.choices[0].message.content

    if (!fullContent) {
      throw new Error('Empty response from OpenRouter')
    }

    // Parse the title, description, and story from the response
    const titleMatch = fullContent.match(/TITLE:\s*(.+?)(?:\n|DESCRIPTION:|STORY:)/i)
    const descriptionMatch = fullContent.match(/DESCRIPTION:\s*(.+?)(?:\n|STORY:)/i)
    const storyMatch = fullContent.match(/STORY:\s*(.+)/si)
    
    let title = 'Untitled Story'
    let description = ''
    let story = fullContent.trim()
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim()
    }
    
    if (descriptionMatch && descriptionMatch[1]) {
      description = descriptionMatch[1].trim()
    }
    
    if (storyMatch && storyMatch[1]) {
      story = storyMatch[1].trim()
    } else if (fullContent.includes('TITLE:')) {
      // If we found a title but not the STORY: marker, everything after description is the story
      const storyStartIndex = fullContent.indexOf('\n', fullContent.indexOf('DESCRIPTION:') > -1 ? fullContent.indexOf('DESCRIPTION:') : fullContent.indexOf('TITLE:'))
      if (storyStartIndex !== -1) {
        story = fullContent.substring(storyStartIndex).trim()
      }
    }
    
    return {
      title,
      description,
      story
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Story generation error:', error.message)
      throw error
    }
    
    console.error('Unexpected error during story generation:', error)
    throw new Error('Failed to generate story')
  }
}