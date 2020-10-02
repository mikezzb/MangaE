import HTMLParser from 'fast-html-parser'
import GET_HEADER from '../consts/getHeader'
import parseImage from './parseImage'
export default async function parseAlbum(url, page) {
  const initial = await fetch(`${url}?p=${page || 0}`, GET_HEADER)
    .catch(e => alert(e))
  const initialText = await initial.text()
  let doc = HTMLParser.parse(initialText);
  let tags = {}
  if(page === 0){
    const tagDiv = doc.querySelector('#taglist')
    tagDiv.childNodes[0].childNodes.map(node => {
      node.childNodes.length >= 2 &&
          (tags[node.childNodes[0].text.trim().slice(0, -1)] = node.childNodes[1].childNodes.map(node => node.text))
    })
  }
  const rawImageDiv = doc.querySelectorAll('.gdtm');
  const tempImageList = []
  await Promise.all(rawImageDiv.map(async (div, i) => {
    const uri = await parseImage(div.querySelector('a').rawAttributes.href)
    const image = {
      uri: uri,
      index: i,
    }
    tempImageList.push(image)
  }))
  tempImageList.sort((a, b) => (a.index > b.index) ? 1 : -1)
  return {
    imageList: tempImageList,
    tags: tags,
  }
}