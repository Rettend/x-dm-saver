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
const debouncedSave = debounce(saveDraft, 500)

let isProgrammaticChange = false
let draftLoaded = false

function saveDraft(text: string) {
  const cleanedText = text.trim() === 'Start a new message' ? '' : text.trim()

  chrome.storage.local.set({ xDMDraft: cleanedText }, () => {
    console.log('Draft saved:', cleanedText)
  })
}

function setInputValue(element: HTMLElement, value: string) {
  isProgrammaticChange = true

  // replace any new lines (since they break the input) with spaces
  value = value.replace(/\n/g, ' ')

  // simulate user typing
  element.focus()
  document.execCommand('insertText', false, value)

  const inputEvent = new Event('input', { bubbles: true, cancelable: true })
  element.dispatchEvent(inputEvent)

  setTimeout(() => isProgrammaticChange = false, 100)
}

function loadDraft(editorContainer: HTMLElement) {
  if (draftLoaded)
    return

  chrome.storage.local.get(['xDMDraft'], (result: { xDMDraft?: string }) => {
    if (result.xDMDraft) {
      try {
        const inputElement = editorContainer.querySelector<HTMLElement>('[data-testid="dmComposerTextInput"]')
        if (inputElement) {
          // use setTimeout to ensure the element is ready
          setTimeout(() => {
            setInputValue(inputElement, result.xDMDraft || '')
            console.log('Loaded draft:', result.xDMDraft)
            draftLoaded = true
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

let currentObserver: MutationObserver | null = null

function attachListener() {
  const editorContainer = document.querySelector<HTMLElement>('[data-testid="dmComposerTextInputRichTextInputContainer"]')
  if (editorContainer) {
    console.log('Editor container found:', editorContainer)

    const observer = new MutationObserver(() => {
      if (!isProgrammaticChange) {
        const text = editorContainer.textContent?.trim() || ''
        debouncedSave(text)
      }
    })

    observer.observe(editorContainer, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    loadDraft(editorContainer)

    // disconnect previous observer if exists
    if (currentObserver) {
      currentObserver.disconnect()
    }

    // set current observer
    currentObserver = observer
  }
  else {
    console.log('Editor container not found, retrying...')
  }
}

let domObserver: MutationObserver | null = null

function monitorDomChanges() {
  const targetNode = document.body
  const observerOptions = {
    childList: true,
    subtree: true,
  }

  if (domObserver) {
    domObserver.disconnect()
  }

  const observerCallback = debounce((mutationsList: MutationRecord[]) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        attachListener()
        break
      }
    }
  }, 500)

  domObserver = new MutationObserver(observerCallback)
  domObserver.observe(targetNode, observerOptions)
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
