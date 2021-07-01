import HTMLParser from 'fast-html-parser';
import GET_HEADER from '../constants/getHeader';
import { IImage, ITags } from '../interfaces';
import parseImage from './parseImage';

type IParsedAlbum = {
  imageList: IImage[],
  tags: any,
}

export default async function parseAlbum(url: string, page: number): Promise<IParsedAlbum | null> {
  try {
    const initial = await fetch(`${url}?p=${page || 0}`, GET_HEADER);
    const initialText = await initial.text();
    let doc = HTMLParser.parse(initialText);
    const tags: ITags = {};
    if (page === 0){
      const tagDiv = doc.querySelector('#taglist');
      if (tagDiv){
        tagDiv.childNodes[0].childNodes.map(node => {
          if (node.childNodes.length >= 2){
            (tags[node.childNodes[0].text.trim().slice(0, -1)] = node.childNodes[1].childNodes.map(node => node.text));
          }
        });
      }
    }
    const rawImageDiv = doc.querySelectorAll('.gdtm');
    const tempImageList: IImage[] = [];
    await Promise.all(rawImageDiv.map(async (div, i) => {
      if (div) {
        const uri = await parseImage((div as any).querySelector('a').rawAttributes.href);
        const image = {
          uri: uri,
          index: i,
        };
        tempImageList.push(image);
      }
    }));
    tempImageList.sort((a, b) => ((a.index || 0) > (b.index || 0)) ? 1 : -1);
    return {
      imageList: tempImageList,
      tags: tags,
    };
  }
  catch (e) {
    console.warn(e);
    return null;
  }
}
