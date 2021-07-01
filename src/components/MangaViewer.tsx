import RNFetchBlob from 'rn-fetch-blob';
import { Platform, View, TouchableOpacity , SafeAreaView, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import ImageView from 'react-native-image-viewing';
import parseAlbum from '../parsers/parseAlbum';
import styles from '../style';
import { IAlbum } from '../interfaces';

type IMangaViewer = {
  album: IAlbum,
  close: () => void,
  saveHistory: (tags: any, imageIndex: number) => void,
}

const MangaViewer = ({ album, close, saveHistory }: IMangaViewer) => {
  const [currentAlbum, setCurrentAlbum] = useState<IAlbum | null>(null);
  const parseAlbumAndSave = async (page: number) => {
    const response = await parseAlbum(album.url, page);
    const tempImageList = (response || {}).imageList || [];
    const tags = (response || {}).tags;
    if (currentAlbum){
      setCurrentAlbum({
        ...currentAlbum,
        images: [...currentAlbum.images].concat(tempImageList),
        page: page,
      });
    }
    else {
      const manga = {
        title: album.title,
        url: album.url,
        images: tempImageList,
        imageNumber: album.imageNumber,
        page: 0,
        tags: tags,
      };
      setCurrentAlbum(manga);
    }
  };

  useEffect(() => {
    if (album?.downloaded){
      let dirs = RNFetchBlob.fs.dirs;
      const path = `${dirs.DocumentDir}/${album.title}`;
      setCurrentAlbum({
        ...album,
        images: Array.from({ length: album.imageNumber || 0 }, (x, i) => i).map(i => ({ uri: `${Platform.OS === 'android' ? 'file://' : ''}${path}/${i}` })),
      });
    }
    else {
      parseAlbumAndSave(0);
    }
  }, [album]);


  const ReaderHeader = ({ close }: { close: () => void }) =>
    <SafeAreaView>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={close}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>;

  const ReaderFooter = ({ imageIndex, totalPages }: { imageIndex: number, totalPages: number }) => (
    <SafeAreaView>
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>{`P.${imageIndex + 1}/${totalPages}`}</Text>
      </View>
    </SafeAreaView>
  );

  const fetchMoreImage = (imageIndex: number) => {
    if (currentAlbum && (imageIndex + 1) === currentAlbum.images.length && !(currentAlbum.images.length >= (currentAlbum.imageNumber || 0))){
      parseAlbumAndSave(currentAlbum.page + 1);
    }
  };

  return (
    <>
      {
        currentAlbum &&
        <ImageView
          images={currentAlbum.images}
          imageIndex={0}
          visible={true}
          onRequestClose={close}
          swipeToCloseEnabled={false}
          onImageIndexChange={fetchMoreImage}
          HeaderComponent={({ imageIndex }) => <ReaderHeader close={() => [saveHistory(currentAlbum.tags, imageIndex), close()]}/>}
          FooterComponent={({ imageIndex }) => <ReaderFooter imageIndex={imageIndex} totalPages={currentAlbum.imageNumber || 0} />} />
      }
    </>
  );
};
export default MangaViewer;
