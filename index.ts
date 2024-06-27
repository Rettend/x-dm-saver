function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<F>) => {
    if (timeout)
      clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

function saveDraft(text: string) {
  const cleanedText = text.trim() === 'Start a new message' ? '' : text.trim()

  chrome.storage.local.set({ xDMDraft: cleanedText }, () => {
    console.log('Draft saved:', cleanedText)
  })
}

const debouncedSave = debounce(saveDraft, 500)

function setInputValue(element: HTMLElement, value: string) {
  // simulate user typing
  element.focus()
  document.execCommand('insertText', false, value)

  const inputEvent = new Event('input', { bubbles: true, cancelable: true })
  element.dispatchEvent(inputEvent)
}

function loadDraft(editorContainer: HTMLElement) {
  chrome.storage.local.get(['xDMDraft'], (result: { xDMDraft?: string }) => {
    if (result.xDMDraft) {
      try {
        const inputElement = editorContainer.querySelector<HTMLElement>('[data-testid="dmComposerTextInput"]')
        if (inputElement) {
          // use setTimeout to ensure the element is ready
          setTimeout(() => {
            setInputValue(inputElement, result.xDMDraft || '')
            console.log('Loaded draft:', result.xDMDraft)
          }, 100)
        }
        else {
          console.error('Could not find input element')
        }
      }
      catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  })
}

function attachListener() {
  const editorContainer = document.querySelector<HTMLElement>('[data-testid="dmComposerTextInputRichTextInputContainer"]')
  if (editorContainer) {
    console.log('Editor container found:', editorContainer)

    const observer = new MutationObserver(() => {
      const text = editorContainer.textContent?.trim() || ''
      debouncedSave(text)
    })

    observer.observe(editorContainer, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    loadDraft(editorContainer)
  }
  else {
    console.log('Editor container not found, retrying...')
    setTimeout(attachListener, 1000)
  }
}

function monitorDomChanges() {
  const targetNode = document.body
  const observerOptions = {
    childList: true,
    subtree: true,
  }

  const observerCallback = (mutationsList: MutationRecord[]) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        attachListener()
      }
    }
  }

  const observer = new MutationObserver(observerCallback)
  observer.observe(targetNode, observerOptions)
}

function initExtension() {
  // wait for the page to be fully loaded
  if (document.readyState === 'complete') {
    attachListener()
    monitorDomChanges()
  }
  else {
    window.addEventListener('load', () => {
      setTimeout(() => {
        attachListener()
        monitorDomChanges()
      }, 1000)
    })
  }
}

try {
  initExtension()
}
catch (error) {
  console.error('Error in X DM Saver extension:', error)
}
