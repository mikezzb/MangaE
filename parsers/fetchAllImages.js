import parseAlbum from "./parseAlbum"
export default async function fetchAllImages(url, imageNumber) {
  let tempImageList = [], page = 0, tags = {};
  while(tempImageList.length < imageNumber){
    const response = await parseAlbum(url, page)
    page === 0 && (tags = response.tags)
    tempImageList = tempImageList.concat(response.imageList)
    page++;
  }
  return {
    imageList: tempImageList,
    tags: tags,
  };
}
