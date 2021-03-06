const CLOSE_ATTR = 'data-close-dialog'
const CLOSE_SELECTOR = `[${CLOSE_ATTR}]`

type Target = Disableable | Focusable

type Disableable = HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

type Focusable = HTMLElement

const autofocus = (el: DetailsDialogElement): void => {
  let autofocusElement = Array.from(el.querySelectorAll<HTMLElement>('[autofocus]')).filter(focusable)[0]
  if (!autofocusElement) {
    autofocusElement = el
    el.setAttribute('tabindex', '-1')
  }
  autofocusElement.focus()
} 

const keydown = (event: KeyboardEvent): void => {
  const details = event.currentTarget
  if (!(details instanceof Element)) return 
  if (event.key === 'Escape' || event.key === 'Esc') {
    toggleDetails(details, false)
    event.stopPropagation()
  } else if (event.key === 'Tab') {
    restrictTabBehavior(event)
  }
}

const focusable = (el: Target): boolean => {
  return el.tabIndex >= 0 && !(el as Disableable).disabled && visible(el)
}

const visible = (el: Target): boolean => {
  return (
    !el.hidden &&
    (!(el as Disableable).type || (el as Disableable).type !== 'hidden') &&
    (el.offsetWidth > 0 || el.offsetHeight > 0)
  )
}

const restrictTabBehavior = (event: KeyboardEvent): void => {
  if (!(event.currentTarget instanceof Element)) return
  const dialog = event.currentTarget.querySelector('details-dialog')
  if (!dialog) return
  event.preventDefault()

  const elements: Target[] = Array.from(dialog.querySelectorAll<HTMLElement>('*')).filter(focusable)
  if (elements.length === 0) return

  const movement = event.shiftKey ? -1 : 1
  const root = dialog.getRootNode() as Document | ShadowRoot
  const currentFocus = dialog.contains(root.activeElement) ? root.activeElement : null
  let targetIndex = movement === -1 ? -1 : 0

  if (currentFocus instanceof HTMLElement) {
    const currentIndex = elements.indexOf(currentFocus)
    if (currentIndex !== -1) {
      targetIndex = currentIndex + movement
    }
  }

  if (targetIndex < 0) {
    targetIndex = elements.length - 1
  } else {
    targetIndex = targetIndex % elements.length
  }

  elements[targetIndex].focus()
}

const allowClosingDialog = (details: Element): boolean => {
  const dialog = details.querySelector('details-dialog')
  if (!(dialog instanceof DetailsDialogElement)) return true

  return dialog.dispatchEvent(
    new CustomEvent('details-dialog-close', {
      bubbles: true,
      cancelable: true
    })
  )
}

const onSummaryClick = (event: Event): void => {
  if (!(event.currentTarget instanceof Element)) return
  const details = event.currentTarget.closest('details')
  if (!details || !details.hasAttribute('open')) return

  // Prevent summary click events if details-dialog-close was cancelled
  if (!allowClosingDialog(details)) {
    event.preventDefault()
    event.stopPropagation()
  }
}

const toggle = (event: Event): void => {
  const details = event.currentTarget
  if (!(details instanceof Element)) return
  const dialog = details.querySelector('details-dialog')
  if (!(dialog instanceof DetailsDialogElement)) return

  if (details.hasAttribute('open')) {
    const root = 'getRootNode' in dialog ? (dialog.getRootNode() as Document | ShadowRoot) : document
    if (root.activeElement instanceof HTMLElement) {
      initialized.set(dialog, {details, activeElement: root.activeElement})
    }

    autofocus(dialog);
    (details as HTMLElement).addEventListener('keydown', keydown)
  } else {
    for (const form of dialog.querySelectorAll('form')) {
      form.reset()
    }
    const focusElement = findFocusElement(details, dialog)
    if (focusElement) focusElement.focus()
    ;(details as HTMLElement).removeEventListener('keydown', keydown)
  }
}

function findFocusElement(details: Element, dialog: DetailsDialogElement): HTMLElement | null {
  const state = initialized.get(dialog)
  if (state && state.activeElement instanceof HTMLElement) {
    return state.activeElement
  } else {
    return details.querySelector('summary')
  }
}

function toggleDetails(details: Element, open: boolean) {
  // Don't update unless state is changing
  if (open === details.hasAttribute('open')) return

  if (open) {
    details.setAttribute('open', '')
  } else if (allowClosingDialog(details)) {
    details.removeAttribute('open')
  }
}

function loadIncludeFragment(event: Event) {
  const details = event.currentTarget
  if (!(details instanceof Element)) return
  const dialog = details.querySelector('details-dialog')
  if (!(dialog instanceof DetailsDialogElement)) return
  const loader = dialog.querySelector('include-fragment:not([src])')
  if (!loader) return

  const src = dialog.src
  if (src === null) return

  loader.addEventListener('loadend', () => {
    if (details.hasAttribute('open')) autofocus(dialog)
  })
  loader.setAttribute('src', src)
  removeIncludeFragmentEventListeners(details)
}

function updateIncludeFragmentEventListeners(details: Element, src: string | null, preload: boolean) {
  removeIncludeFragmentEventListeners(details)

  if (src) {
    details.addEventListener('toggle', loadIncludeFragment, {once: true})
  }

  if (src && preload) {
    details.addEventListener('mouseover', loadIncludeFragment, {once: true})
  }
}

function removeIncludeFragmentEventListeners(details: Element) {
  details.removeEventListener('toggle', loadIncludeFragment)
  details.removeEventListener('mouseover', loadIncludeFragment)
}

type State = {
  details: Element | null
  activeElement: HTMLElement | null
}

const initialized: WeakMap<Element, State> = new WeakMap()

class DetailsDialogElement extends HTMLElement {
  static get CLOSE_ATTR() {
    return CLOSE_ATTR
  }

  static get CLOSE_SELECTOR() {
    return CLOSE_SELECTOR
  }

  constructor() {
    super()
    initialized.set(this, {details: null, activeElement: null})
    this.addEventListener('click', ({target}: Event) => {
      if (!(target instanceof Element)) return
      const details = target.closest('details')
      if (details && target.closest(CLOSE_SELECTOR)) {
        toggleDetails(details, false)
      }
    })
  }

  get src(): string | null {
    return this.getAttribute('src')
  }

  set src(value: string | null) {
    this.setAttribute('src', value || '')
  }

  get preload(): boolean {
    return this.hasAttribute('preload')
  }

  set preload(value: boolean) {
    value ? this.setAttribute('preload', '') : this.removeAttribute('preload')
  }

  connectedCallback() {
    this.setAttribute('role', 'dialog')
    this.setAttribute('aria-modal', 'true')
    const state = initialized.get(this)
    if (!state) return
    const details = this.parentElement
    if (!details) return

    const summary = details.querySelector('summary')
    if (summary) {
      if (!summary.hasAttribute('role')) summary.setAttribute('role', 'button')
      summary.addEventListener('click', onSummaryClick, {capture: true})
    }

    details.addEventListener('toggle', toggle)
    state.details = details

    updateIncludeFragmentEventListeners(details, this.src, this.preload)
  }

  disconnectedCallback() {
    const state = initialized.get(this)
    if (!state) return
    const {details} = state
    if (!details) return
    details.removeEventListener('toggle', toggle)
    removeIncludeFragmentEventListeners(details)
    const summary = details.querySelector('summary')
    if (summary) {
      summary.removeEventListener('click', onSummaryClick, {capture: true})
    }
    state.details = null
  }

  toggle(open: boolean): void {
    const state = initialized.get(this)
    if (!state) return
    const {details} = state
    if (!details) return
    toggleDetails(details, open)
  }

  static get observedAttributes() {
    return ['src', 'preload']
  }

  attributeChangedCallback() {
    const state = initialized.get(this)
    if (!state) return
    const {details} = state
    if (!details) return

    updateIncludeFragmentEventListeners(details, this.src, this.preload)
  }
}

declare global {
  interface Window {
    DetailsDialogElement: typeof DetailsDialogElement
  }
}

export default DetailsDialogElement

if (!window.customElements.get('details-dialog')) {
  window.DetailsDialogElement = DetailsDialogElement
  window.customElements.define('details-dialog', DetailsDialogElement)
}