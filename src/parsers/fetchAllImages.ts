import { IImage } from '../interfaces';
import parseAlbum from './parseAlbum';

export default async function fetchAllImages(url: string, imageNumber: number) {
  let tempImageList: IImage[] = [], page = 0, tags = {};
  while (tempImageList.length < imageNumber){
    const response = await parseAlbum(url, page);
    if (response?.imageList){
      page === 0 && (tags = response.tags);
      tempImageList = tempImageList.concat(response.imageList);
    }
    else {
      tempImageList = tempImageList.concat({ uri: '' });
    }
    page++;
  }
  return {
    imageList: tempImageList,
    tags: tags,
  };
}
