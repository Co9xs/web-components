class MyParagragh extends HTMLElement {
  constructor() {
    super()
    let template = document.getElementById('my-paragragh')
    let templateContent = template.content

    const shadowRoot = this.attachShadow({mode: 'open'})
      .appendChild(templateContent.cloneNode(true))
  }
}

customElements.define('my-paragragh', MyParagragh)

const slottedSpan = document.querySelector('my-paragraph span');

console.log(slottedSpan.assignedSlot);
console.log(slottedSpan.slot);