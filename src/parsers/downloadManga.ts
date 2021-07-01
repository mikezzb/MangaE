import { Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { IDownloadObject, IManga } from '../interfaces';
import { hasAndroidPermission } from '../utils/permissions';
import saveImageToFolder from '../utils/saveImageToFolder';
import { storeData } from '../utils/store';
import fetchAllImages from './fetchAllImages';

const downloadManga = async (manga: IManga, downloadObject: IDownloadObject): Promise<IDownloadObject | null> => {
  if (Platform.OS === 'android' && !(await hasAndroidPermission())) {
    return false;
  }
  const response = await fetchAllImages(manga.url, manga.imageNumber || 0);
  const imageList = response.imageList;
  let dirs = RNFetchBlob.fs.dirs;
  const path = `${dirs.DocumentDir}/${manga.title}`;
  await Promise.all(
    imageList.map(
      async image =>
        await saveImageToFolder({
          url: image.uri,
          path: path,
          index: image.index || 0,
        })
    )
  );
  let downloadObjectCopy: IDownloadObject = { ...downloadObject };
  downloadObjectCopy[manga.url] = {
    ...manga,
    thumbnail: `${Platform.OS === 'android' ? 'file://' : ''}${path}/0`,
    tags: response.tags,
  };
  await storeData('downloaded', downloadObjectCopy);
  return downloadObjectCopy;
};

export default downloadManga;
