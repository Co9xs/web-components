const createNode =  (text: string): Element => {
  const node = document.createElement('pre')
  node.style.width = '1px'
  node.style.height = '1px'
  node.style.position = 'fixed'
  node.style.top = '5px'
  node.textContent = text
  return node
}

export const copyNode = (node: Element): Promise<void> => {
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(node.textContent || "")
  }

  // 現在のselectionオブジェクトを取得
  const selection = getSelection()
  if (selection == null) {
    return Promise.reject(new Error())
  }

  // selectionオブジェクトが持つrangeを一旦削除
  selection.removeAllRanges()

  // 新しい空のrangeを作成
  const range = document.createRange()

  // 引数に渡されたnodeを含むようにrangeを調整
  range.selectNodeContents(node)

  // selectionに追加
  selection.addRange(range)
  
  // 今のselectionの状態でcopyする
  document.execCommand('copy')

  // 最後にすべてのrangeを削除
  selection.removeAllRanges()
  return Promise.resolve()
}

export const copyText = (text: string) => {
  if ('clipboard' in navigator) {
    return navigator.clipboard.writeText(text)
  }

  const body = document.body
  if (!body) {
    return Promise.reject(new Error())
  }

  const node = createNode(text)
  body.appendChild(node)
  copyNode(node)
  body.removeChild(node)
  return Promise.resolve()
}

