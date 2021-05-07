class PopUpInfo extends HTMLElement {
  constructor() {
    super()
    var shadow = this.attachShadow({mode: 'open'})

    var wrapper = document.createElement('span')
    wrapper.setAttribute('class', 'wrapper')
    var icon = document.createElement('span')
    icon.setAttribute('class', 'icon')
    icon.setAttribute('tabindex', '0')
    var info = document.createElement('span')
    info.setAttribute('class', 'info')

    var text = this.getAttribute('data-text')
    info.textContent = text

    var imgUrl
    if(this.hasAttribute('img')) {
      imgUrl = this.getAttribute('img');
    } else {
      imgUrl = 'img/default.png'
    }
    var img = document.createElement('img')
    img.src = imgUrl
    icon.appendChild(img)

    var style = document.createElement('style')
    style.textContent = `
      .wrapper {
        position: relative;
      }
      .info {
        font-size: 0.8rem;
        width: 200px;
        display: inline-block;
        border: 1px solid black;
        padding: 10px;
        background: white;
        border-radius: 10px;
        opacity: 0;
        transition: 0.6s all;
        position: absolute;
        bottom: 20px;
        left: 10px;
        z-index: 3;
      }
      img {
        width: 1.2rem;
      }
      .icon:hover + .info, .icon:focus + .info {
        opacity: 1;
      }
    `;

    shadow.appendChild(style)
    shadow.appendChild(wrapper)
    wrapper.appendChild(icon)
    wrapper.appendChild(info)
  }
}
customElements.define('popup-info', PopUpInfo)
