const privateData = new WeakMap()

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const {target} = entry
      observer.unobserve(target)
      if (!(target instanceof IncludeFragmentElement)) return
      if (target.loading === 'lazy') { 
        handleData(target)
      }
    }
  }
}, {
  rootMargin: '0px 0px 256px 0px',
  threshold: 0.01
})

function task(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

async function handleData(el: IncludeFragmentElement) {
  observer.unobserve(el)
  return getData(el).then(
    function (html: string) {
      const template = document.createElement('template')
      template.innerHTML = html
      const fragment = document.importNode(template.content, true)
      const canceled = !el.dispatchEvent(new CustomEvent('include-fragment-replace', {cancelable: true, detail: {fragment}}))
      if (canceled) return
      el.replaceWith(fragment)
      el.dispatchEvent(new CustomEvent('include-fragment-replaced'))
    },
    function () {
      el.classList.add('is-error')
    }
  )
}

function getData(el: IncludeFragmentElement) {
  const src = el.src
  let data = privateData.get(el)
  if (data && data.src === src) {
    return data.data
  } else {
    if (src) {
      data = el.load()
    } else {
      data = Promise.reject(new Error('missing src'))
    }
    privateData.set(el, {src, data})
    return data
  }
}

function isWildcard(accept: string | null) {
  return accept && !!accept.split(',').find(x => x.match(/^\s*\*\/\*/))
}

export default class IncludeFragmentElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'loading']
  }

  get src(): string {
    const src = this.getAttribute('src')
    if (src) {
      const link = this.ownerDocument!.createElement('a')
      link.href = src
      return link.href
    } else {
      return ''
    }
  }

  set src(val: string) {
    this.setAttribute('src', val)
  }

  get loading(): 'eager'|'lazy' {
    if (this.getAttribute('loading') === 'lazy') return 'lazy'
    return 'eager'
  }

  set loading(val: 'eager'|'lazy') {
    this.setAttribute('loading', val)
  }

  get accept(): string {
    return this.getAttribute('accept') || ''
  }

  set accept(val: string) {
    this.setAttribute('accept', val)
  }

  get data(): Promise<string> {
    return getData(this)
  }

  attributeChangedCallback(attribute: string, oldVal:string|null): void {
    if (attribute === 'src') {
      if (this.isConnected && this.loading === 'eager') {
        handleData(this)
      }
    } else if (attribute === 'loading') {
      if (this.isConnected && oldVal !== 'eager' && this.loading === 'eager') {
        handleData(this)
      }
    }
  }

  connectedCallback(): void {
    if (this.src && this.loading === 'eager') {
      handleData(this)
    }
    if (this.loading === 'lazy') {
      observer.observe(this)
    }
  }

  request(): Request {
    const src = this.src
    if (!src) {
      throw new Error('missing src')
    }

    return new Request(src, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: this.accept || 'text/html'
      }
    })
  }

  load(): Promise<string> {
    observer.unobserve(this)
    return task()
      .then(() => {
        this.dispatchEvent(new Event('loadstart'))
        return this.fetch(this.request())
      })
      .then(response => {
        if (response.status !== 200) {
          throw new Error(`Failed to load resource: the server responded with a status of ${response.status}`)
        }
        const ct = response.headers.get('Content-Type')
        if (!isWildcard(this.accept) && (!ct || !ct.includes(this.accept ? this.accept : 'text/html'))) {
          throw new Error(`Failed to load resource: expected ${this.accept || 'text/html'} but was ${ct}`)
        }
        return response.text()
      })
      .then(data => {
        task().then(() => {
          this.dispatchEvent(new Event('load'))
          this.dispatchEvent(new Event('loadend'))
        })
        return data
      }, error => {
        task().then(() => {
          this.dispatchEvent(new Event('error'))
          this.dispatchEvent(new Event('loadend'))
        })
        throw error
      })
  }

  fetch(request: RequestInfo): Promise<Response> {
    return fetch(request)
  }
}

declare global {
  interface Window {
    IncludeFragmentElement: typeof IncludeFragmentElement
  }
  interface HTMLElementTagNameMap {
    'include-fragment': IncludeFragmentElement
  }
}
if (!window.customElements.get('include-fragment')) {
  window.IncludeFragmentElement = IncludeFragmentElement
  window.customElements.define('include-fragment', IncludeFragmentElement)
}