let selectedSentiment = ''

document.addEventListener('DOMContentLoaded', function () {
  // Get DOM elements
  const socialLinkInput = document.getElementById('socialLink')
  const responseTextarea = document.getElementById('response')
  const generateBtn = document.getElementById('generateBtn')
  const copyBtn = document.getElementById('copyBtn')
  const emojiElements = document.querySelectorAll('.emoji')
  const settingsToggle = document.querySelector('.settings-toggle')
  const settingsPanel = document.querySelector('.settings-panel')
  const apiKeyInput = document.getElementById('apiKey')
  const modelSelect = document.getElementById('modelSelect')
  const saveSettingsBtn = document.getElementById('saveSettings')
  const currentModelSpan = document.getElementById('currentModel')
  const apiKeyStatusMessage = document.getElementById('apiKeyStatusMessage')
  const apiKeyStatus = document.getElementById('apiKeyStatus')
  const modelStatus = document.getElementById('modelStatus')
  const statusDot = document.querySelector('.status-dot')
  const quickModelStatus = document.getElementById('quickModelStatus')

  // Function to update current model display
  function updateCurrentModelDisplay(modelValue) {
    const selectedOption = modelSelect.querySelector(`option[value="${modelValue}"]`)
    if (selectedOption) {
      const modelName = selectedOption.textContent.trim()
      const isFree = modelValue.endsWith(':free')
      const badge = isFree ? '🆓' : '💰'
      currentModelSpan.textContent = `(${modelName}) ${badge}`
    } else {
      currentModelSpan.textContent = ''
    }
  }

  // Function to update save button state
  function updateSaveButtonState() {
    const apiKey = apiKeyInput.value.trim()
    if (apiKey && apiKey !== '••••••••') {
      saveSettingsBtn.classList.add('enabled')
    } else {
      saveSettingsBtn.classList.remove('enabled')
    }
  }

  // Function to update all status indicators
  function updateStatusIndicators(hasKey, modelValue) {
    // Update status dot
    if (hasKey) {
      statusDot.classList.remove('red')
      statusDot.classList.add('green')
    } else {
      statusDot.classList.remove('green')
      statusDot.classList.add('red')
    }

    // Update API key status messages
    const keyStatusText = hasKey
      ? '<span class="status-success">✅ API Key Saved and Valid</span>'
      : '<span class="status-error">❌ No API Key Saved</span>'

    apiKeyStatus.innerHTML = `<span>API Key:</span>${keyStatusText}`
    apiKeyStatusMessage.innerHTML = keyStatusText

    // Update model status
    if (modelValue) {
      const selectedOption = modelSelect.querySelector(`option[value="${modelValue}"]`)
      if (selectedOption) {
        const modelName = selectedOption.textContent.trim()
        const isFree = modelValue.endsWith(':free')
        const badge = isFree ? '🆓' : '💰'
        const modelText = `<span class="status-success">${modelName} ${badge}</span>`
        modelStatus.innerHTML = `<span>Current Model:</span>${modelText}`
        quickModelStatus.innerHTML = `${badge} ${modelName}`
      }
    } else {
      modelStatus.innerHTML =
        '<span>Current Model:</span><span class="status-error">Not Selected</span>'
      quickModelStatus.innerHTML = ''
    }
  }

  // Function to update API key input status
  function updateApiKeyInputStatus(value) {
    if (!value) {
      apiKeyStatusMessage.innerHTML = '<span class="status-error">❌ No API Key Saved</span>'
    } else if (value === '••••••••') {
      apiKeyStatusMessage.innerHTML =
        '<span class="status-success">✅ API Key Saved and Valid</span>'
    } else {
      apiKeyStatusMessage.innerHTML =
        '<span class="status-warning">⚠️ Key Validation Required</span>'
    }
  }

  // Function to load settings
  async function loadSettings() {
    try {
      const [syncData, localData] = await Promise.all([
        chrome.storage.sync.get(['apiKey']),
        chrome.storage.local.get(['selectedModel']),
      ])

      const defaultModel = 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free'
      const selectedModel = localData.selectedModel || defaultModel

      modelSelect.value = selectedModel
      if (!localData.selectedModel) {
        await chrome.storage.local.set({ selectedModel: defaultModel })
      }

      if (syncData.apiKey) {
        apiKeyInput.value = '••••••••'
        apiKeyInput.placeholder = 'API key is saved securely'
        saveSettingsBtn.classList.add('enabled')
      } else {
        apiKeyInput.value = ''
        apiKeyInput.placeholder = 'Enter your OpenRouter API key'
        saveSettingsBtn.classList.remove('enabled')
      }

      // Update all status indicators
      updateStatusIndicators(!!syncData.apiKey, selectedModel)
      updateApiKeyInputStatus(apiKeyInput.value)
    } catch (error) {
      console.error('Error loading settings:', error)
      modelSelect.value = 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free'
      updateStatusIndicators(false, modelSelect.value)
      saveSettingsBtn.classList.remove('enabled')
    }
  }

  // Load saved settings
  loadSettings()

  // Settings toggle
  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('visible')
  })

  // Update API key input handler
  apiKeyInput.addEventListener('input', function () {
    updateApiKeyInputStatus(this.value.trim())
    updateSaveButtonState()
  })

  // Model select change handler
  modelSelect.addEventListener('change', function () {
    updateCurrentModelDisplay(this.value)
  })

  // Save settings
  saveSettingsBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim()
    const selectedModel = modelSelect.value

    if (!apiKey || apiKey === '••••••••') {
      alert('Please enter your OpenRouter API key')
      return
    }

    try {
      const testResponse = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!testResponse.ok) {
        throw new Error('Invalid API key')
      }

      await chrome.storage.sync.set({ apiKey })
      await chrome.storage.local.set({ selectedModel })

      updateStatusIndicators(true, selectedModel)
      settingsPanel.classList.remove('visible')
      apiKeyInput.value = '••••••••'
      apiKeyInput.placeholder = 'API key is saved securely'
      saveSettingsBtn.classList.remove('enabled')

      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error: Invalid API key or connection failed. Please check your API key and try again.')
      apiKeyInput.value = ''
      apiKeyInput.placeholder = 'Enter your OpenRouter API key'
      updateStatusIndicators(false, selectedModel)
      saveSettingsBtn.classList.remove('enabled')
    }
  })

  // Add event listeners for emoji elements
  emojiElements.forEach((emoji) => {
    emoji.addEventListener('click', function () {
      // Remove selected class from all emojis
      emojiElements.forEach((em) => em.classList.remove('selected'))
      // Add selected class to clicked emoji
      this.classList.add('selected')
      selectedSentiment = this.getAttribute('data-sentiment')
    })
  })

  // Generate response button click handler
  generateBtn.addEventListener('click', async function () {
    const link = socialLinkInput.value.trim()

    if (!link) {
      alert('Please enter a social media link')
      return
    }

    if (!selectedSentiment) {
      alert('Please select an emoji for sentiment')
      return
    }

    try {
      // Get settings from both storage types
      const [syncData, localData] = await Promise.all([
        chrome.storage.sync.get(['apiKey']),
        chrome.storage.local.get(['selectedModel']),
      ])

      if (!syncData.apiKey) {
        alert('Please set your OpenRouter API key in settings')
        settingsPanel.classList.add('visible')
        return
      }

      // Show loading state
      generateBtn.disabled = true
      generateBtn.textContent = 'Generating...'
      responseTextarea.value = 'Generating response...'

      // Generate response based on sentiment
      const response = await generateResponse(
        link,
        selectedSentiment,
        syncData.apiKey,
        localData.selectedModel
      )
      responseTextarea.value = response
    } catch (error) {
      responseTextarea.value = 'Error generating response. Please try again.'
      console.error('Error:', error)
    } finally {
      generateBtn.disabled = false
      generateBtn.textContent = 'Generate Response'
    }
  })

  // Copy button click handler
  copyBtn.addEventListener('click', function () {
    if (!responseTextarea.value) {
      alert('No response to copy')
      return
    }

    responseTextarea.select()
    document.execCommand('copy')

    // Show feedback
    const originalText = copyBtn.textContent
    copyBtn.textContent = 'Copied!'
    setTimeout(() => {
      copyBtn.textContent = originalText
    }, 1500)
  })
})

// Function to generate response based on sentiment using OpenRouter API
async function generateResponse(link, sentiment, apiKey, model) {
  try {
    const prompt = `Generate a response to this social media post: ${link}
    The response should be in a ${sentiment} tone.
    Keep the response concise, professional, and engaging.
    Include the appropriate emoji for the sentiment.
    Make sure the response encourages further discussion.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/yourusername/social-media-extension',
      },
      body: JSON.stringify({
        model: model || 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates engaging social media responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    const data = await response.json()
    const generatedResponse = data.choices[0].message.content.trim()

    // Store this interaction in Chrome storage
    try {
      const date = new Date().toISOString().split('T')[0]
      const storage = await chrome.storage.local.get('interactions')
      const interactions = storage.interactions || {}

      if (!interactions[date]) {
        interactions[date] = 0
      }
      interactions[date]++

      await chrome.storage.local.set({ interactions })
    } catch (error) {
      console.error('Error storing interaction:', error)
    }

    return generatedResponse
  } catch (error) {
    console.error('Error calling OpenRouter API:', error)
    throw error
  }
}
