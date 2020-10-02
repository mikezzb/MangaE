import HTMLParser from 'fast-html-parser'
import GET_HEADER from '../consts/getHeader'
export default async function parseImage(url) {
  const raw = await fetch(url, GET_HEADER)
  const html = await raw.text()
  let doc = HTMLParser.parse(html);
  const uri = doc.querySelector('#img').rawAttributes.src
  return uri;
}
