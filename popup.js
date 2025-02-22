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
  const statsToggle = document.querySelector('.stats-toggle')
  const statsPanel = document.querySelector('.stats-panel')
  const todayCount = document.getElementById('todayCount')
  const weekCount = document.getElementById('weekCount')
  const monthCount = document.getElementById('monthCount')
  const totalCount = document.getElementById('totalCount')
  const formatOptions = document.querySelectorAll('input[name="format"]')
  const previewToggle = document.querySelector('.preview-toggle')
  const copyIcon = document.getElementById('copyIcon')
  const dailyGoal = document.getElementById('dailyGoal')
  const goalValue = document.getElementById('goalValue')
  let selectedFormat = 'plain'
  let lastGoalReached = false

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

  // Function to create confetti effect
  function createConfetti() {
    const confettiContainer = document.createElement('div')
    confettiContainer.className = 'confetti-container'
    document.body.appendChild(confettiContainer)

    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0']
    const confettiCount = 50

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti'
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.animationDuration = Math.random() * 2 + 1 + 's'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`
      confettiContainer.appendChild(confetti)

      // Start animation
      setTimeout(() => {
        confetti.style.animation = 'confetti 2s ease-out forwards'
      }, Math.random() * 1000)
    }

    // Remove container after animation
    setTimeout(() => {
      document.body.removeChild(confettiContainer)
    }, 3000)
  }

  // Function to check if daily goal is reached
  function checkGoalReached(todayInteractions) {
    const currentGoal = parseInt(dailyGoal.value)
    const wasReached = lastGoalReached
    lastGoalReached = todayInteractions >= currentGoal

    const todayCountCard = document.querySelector('.stat-card:first-child')

    // If goal was just reached (wasn't reached before but is now)
    if (lastGoalReached && !wasReached) {
      createConfetti()
      todayCountCard.classList.add('goal-reached')
    } else if (!lastGoalReached) {
      todayCountCard.classList.remove('goal-reached')
    }
  }

  // Function to update goal value display
  dailyGoal.addEventListener('input', function () {
    goalValue.textContent = this.value
  })

  // Function to load settings
  async function loadSettings() {
    try {
      const [syncData, localData] = await Promise.all([
        chrome.storage.sync.get(['apiKey']),
        chrome.storage.local.get(['selectedModel', 'dailyGoal']),
      ])

      const defaultModel = 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free'
      const selectedModel = localData.selectedModel || defaultModel

      // Set daily goal
      if (localData.dailyGoal) {
        dailyGoal.value = localData.dailyGoal
        goalValue.textContent = localData.dailyGoal
      }

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

  // Function to update statistics display
  async function updateStatistics() {
    try {
      const storage = await chrome.storage.local.get('interactions')
      const interactions = storage.interactions || {}

      const today = new Date().toISOString().split('T')[0]
      const todayInteractions = interactions[today] || 0

      // Calculate week interactions
      let weekTotal = 0
      const currentDate = new Date()
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        weekTotal += interactions[dateStr] || 0
      }

      // Calculate month interactions
      let monthTotal = 0
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      Object.entries(interactions).forEach(([date, count]) => {
        const [year, month] = date.split('-').map(Number)
        if (year === currentYear && month === currentMonth + 1) {
          monthTotal += count
        }
      })

      // Calculate total interactions
      const totalInteractions = Object.values(interactions).reduce((sum, count) => sum + count, 0)

      // Update display
      todayCount.textContent = todayInteractions
      weekCount.textContent = weekTotal
      monthCount.textContent = monthTotal
      totalCount.textContent = totalInteractions

      // Check if goal is reached
      checkGoalReached(todayInteractions)
    } catch (error) {
      console.error('Error updating statistics:', error)
    }
  }

  // Function to export interactions data as CSV
  async function exportToCsv() {
    try {
      const storage = await chrome.storage.local.get('interactions')
      const interactions = storage.interactions || {}

      // Convert interactions data to array of objects
      const data = Object.entries(interactions)
        .map(([date, count]) => ({
          date,
          count,
        }))
        .sort((a, b) => b.date.localeCompare(a.date)) // Sort by date descending

      // Create CSV content
      const csvContent = [
        'Date,Interactions', // CSV header
        ...data.map((row) => `${row.date},${row.count}`), // CSV rows
      ].join('\n')

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `social_media_outreach_stats_${new Date().toISOString().split('T')[0]}.csv`
      )
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  // Stats toggle handler
  statsToggle.addEventListener('click', () => {
    settingsPanel.classList.remove('visible')
    statsPanel.classList.toggle('visible')
    if (statsPanel.classList.contains('visible')) {
      updateStatistics()
    }
  })

  // Export CSV button handler
  document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv)

  // Settings toggle handler (modified)
  settingsToggle.addEventListener('click', () => {
    statsPanel.classList.remove('visible')
    settingsPanel.classList.toggle('visible')
    // Update model display when settings panel is opened
    if (settingsPanel.classList.contains('visible')) {
      updateCurrentModelDisplay(modelSelect.value)
    }
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
    const dailyGoalValue = parseInt(dailyGoal.value)

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

      await Promise.all([
        chrome.storage.sync.set({ apiKey }),
        chrome.storage.local.set({
          selectedModel,
          dailyGoal: dailyGoalValue,
        }),
      ])

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

  // Update recordInteraction function
  async function recordInteraction() {
    try {
      const date = new Date().toISOString().split('T')[0]
      const storage = await chrome.storage.local.get('interactions')
      const interactions = storage.interactions || {}

      if (!interactions[date]) {
        interactions[date] = 0
      }
      interactions[date]++

      await chrome.storage.local.set({ interactions })

      // Update statistics after recording interaction
      await updateStatistics()
    } catch (error) {
      console.error('Error recording interaction:', error)
    }
  }

  // Function to get format-specific prompt instructions
  function getFormatInstructions(format) {
    switch (format) {
      case 'markdown':
        return `Format the response using Markdown:
        - Use ** for bold text
        - Use * for italic text
        - Use bullet points where appropriate
        - Use headers for sections if needed
        - Include line breaks for readability`
      case 'html':
        return `Format the response using HTML:
        - Use appropriate HTML tags (<p>, <strong>, <em>, etc.)
        - Ensure proper tag closure
        - Use <br> for line breaks
        - Keep the HTML structure clean and semantic`
      default:
        return 'Format the response as plain text, using only line breaks for structure.'
    }
  }

  // Function to preview formatted text
  function previewFormat(text, format) {
    if (!previewToggle.classList.contains('active')) {
      return text // Return raw text when preview is not active
    }

    switch (format) {
      case 'markdown':
        // Convert markdown to rendered text
        return text
          .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
          .replace(/\*(.*?)\*/g, '$1') // Italic
          .replace(/^- (.*)/gm, '• $1') // Bullet points
          .replace(/^### (.*)/gm, '$1') // H3
          .replace(/^## (.*)/gm, '$1') // H2
          .replace(/^# (.*)/gm, '$1') // H1
      case 'html':
        // Strip HTML tags but preserve line breaks
        return text
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<[^>]*>/g, '')
      default:
        return text
    }
  }

  // Update generateResponse function to be simpler and focused
  async function generateResponse(link, sentiment, apiKey, model) {
    try {
      const formatInstructions = getFormatInstructions(selectedFormat)
      const prompt = `Generate a response to this social media post: ${link}
      The response should be in a ${sentiment} tone.
      ${formatInstructions}
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
              content:
                'You are a helpful assistant that generates engaging social media responses.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Validate response structure
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new Error('Invalid API response format')
      }

      const choice = data.choices[0]
      if (!choice || !choice.message || typeof choice.message.content !== 'string') {
        throw new Error('Invalid response content format')
      }

      let generatedResponse = choice.message.content.trim()

      // Preview format if enabled
      if (previewToggle?.classList.contains('active')) {
        generatedResponse = previewFormat(generatedResponse, selectedFormat)
      }

      return generatedResponse
    } catch (error) {
      console.error('Error calling OpenRouter API:', error)
      if (
        error.message.includes('API response format') ||
        error.message.includes('content format')
      ) {
        throw new Error('The AI service returned an unexpected response. Please try again.')
      }
      throw error
    }
  }

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

      // Record interaction after successful response
      await recordInteraction()
    } catch (error) {
      responseTextarea.value = 'Error generating response. Please try again.'
      console.error('Error:', error)
    } finally {
      generateBtn.disabled = false
      generateBtn.textContent = 'Generate Response'
    }
  })

  // Copy icon click handler
  copyIcon.addEventListener('click', function () {
    if (!responseTextarea.value) {
      return
    }

    responseTextarea.select()
    document.execCommand('copy')

    // Show animation feedback
    this.classList.add('copied')
    setTimeout(() => {
      this.classList.remove('copied')
    }, 1500)
  })

  // Format selection handler
  formatOptions.forEach((option) => {
    option.addEventListener('change', (e) => {
      selectedFormat = e.target.value
      // Save format preference
      chrome.storage.local.set({ selectedFormat })
    })
  })

  // Load saved format preference
  chrome.storage.local.get(['selectedFormat'], (result) => {
    if (result.selectedFormat) {
      selectedFormat = result.selectedFormat
      document.querySelector(`input[name="format"][value="${selectedFormat}"]`).checked = true
    }
  })
})
