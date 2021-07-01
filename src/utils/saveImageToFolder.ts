import RNFetchBlob from 'rn-fetch-blob';

const saveImageToFolder = async ({ url, path, index }: { url: string, path:string, index: number }) => {
  await RNFetchBlob.config({
    fileCache: true,
    path: path + '/' + index,
    appendExt: 'png',
  })
    .fetch('GET', url)
    .then(res => {
      console.log(res.path());
    })
    .catch(e => console.log(e));
};

export default saveImageToFolder;
