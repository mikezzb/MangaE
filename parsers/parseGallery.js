import HTMLParser from 'fast-html-parser'
import GET_HEADER from '../consts/getHeader'
import uniq from '../sharedFunctions/uniq'
export default async function parseGallery(parseParams){
  const queryParams = {
    page: parseParams.page && parseParams.page + 1,
    f_search: parseParams.searchQuery && [...new Set(parseParams.searchQuery.split(/\s+/))].filter(k => k !== '').join('+'),
    f_cats: parseParams.filter,
    inline_set: 'dm_t',
  }
  const url = parseParams.url ?
    parseParams.url : // default search string, can based on user preferred tags
    `https://e-hentai.org/?${
      Object.entries(queryParams).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
    }`
  console.log(url)
  const raw = await fetch(url, GET_HEADER)
    .catch(e => alert(e))
  const html = await raw.text()
  // Parse the content in homepage
  let doc = HTMLParser.parse(html);
  const rawMangaDiv = doc.querySelectorAll('.gl1t');
  const tempMangaList = [];
  rawMangaDiv.map(div => {
    const a = div.querySelector('a')
    const detail = div.querySelector('.gl5t')
    const manga = {
      title: a.text,
      url: a.rawAttributes.href,
      thumbnail: div.querySelector('img').rawAttributes.src,
      imageNumber: parseInt(detail.childNodes[1].text),
      stars: 5 - (parseInt(div.querySelector('.ir').rawAttrs.match(/(\d.*?\p)/)) / 16), // for stars, background-position-x: -16px means -1 star
    }
    tempMangaList.push(manga)
  })
  return({
    mangaList: uniq(tempMangaList),
    page: (parseParams.page || 0) + 1,
  })
}