/* eslint-disable arrow-parens */
import { Image, ScrollView, Dimensions, PermissionsAndroid, Platform, View, FlatList } from 'react-native';
import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Menu, Text, Surface, Snackbar, IconButton, Colors, Button, Chip, Card, Searchbar } from 'react-native-paper';
import AsyncStorage from '@react-native-community/async-storage';
import RNFetchBlob from 'rn-fetch-blob'
import { PieChart, ContributionGraph } from "react-native-chart-kit";
import MangaViewer from "../components/MangaViewer"
import parseGallery from "../parsers/parseGallery"
import fetchAllImages from "../parsers/fetchAllImages"
import styles from '../style'
import uniq from '../sharedFunctions/uniq'
import config from '../consts/config'

const screenWidth = Dimensions.get("window").width;

async function hasAndroidPermission() {
  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === 'granted';
}

const Home = ({ mode }) => {
  const [mangaList, setMangaList] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [currentAlbum, setCurrentAlbum] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [favObject, setFavObject] = useState({});
  const [downloadObject, setDownloadObject] = useState({});
  const [userObject, setUserObject] = useState({});
  const [tagObject, setTagObject] = useState({});
  const [commitObject, setCommitObject] = useState({})
  const [snackBarMessage, setSnackBarMessage] = useState(null);

  const [showMenu, setShowMenu] = useReducer(
    (state, active) => Object.keys(state).reduce((result, menu) => ({ ...result, [menu]: active === menu }), {}),
    {
      search: false,
    }
  )

  useEffect(() => {
    fetchStorage()
  },[])

  const fetchStorage = async () => {
    // AsyncStorage.removeItem('tags')
    const downloaded = JSON.parse(await AsyncStorage.getItem('downloaded')) || {};
    const fav = JSON.parse(await AsyncStorage.getItem('favourites')) || {};
    const user = JSON.parse(await AsyncStorage.getItem('user')) || {};
    const tags = JSON.parse(await AsyncStorage.getItem('tags')) || {};
    const commits = JSON.parse(await AsyncStorage.getItem('commits')) || {};
    setDownloadObject(downloaded)
    setFavObject(fav)
    setUserObject(user)
    setTagObject(tags)
    setCommitObject(commits)

    console.log("TAGS")
    console.log(tags)
    console.log("HISTORY")
    console.log(user.history)
    console.log("DOWNLAODED")
    console.log(downloaded)
    console.log("Commits")
    console.log(commits)

    if(mode){
      mode.isDownload && setMangaList(Object.values(downloaded))
      mode.isFav && setMangaList(Object.values(fav))
      mode.isDashboard && setMangaList(user.history.reverse())
    }
  }

  const toggleFavourite = async (manga) => {
    try {
      let favObjectCopy = {...favObject}
      if(!favObject[manga.url]){
        favObjectCopy[manga.url] = manga
      }
      else{
        delete favObjectCopy[manga.url]
      }
      await AsyncStorage.setItem('favourites', JSON.stringify(favObjectCopy))
      setFavObject(favObjectCopy)
    }
    catch(e) {
      console.log(e)
    }
  }

  const downloadManga = async(manga) => {
    const response = await fetchAllImages(manga.url, manga.imageNumber)
    const imageList = response.imageList
    let dirs = RNFetchBlob.fs.dirs
    const path = `${dirs.DocumentDir}/${manga.title}`
    await Promise.all(
      imageList.map(async (image) =>
        await saveImageToFolder({url: image.uri, path: path, index: image.index}
        ))
    )
    setSnackBarMessage("All downloaded!")
    let downloadObjectCopy = {...downloadObject}
    downloadObjectCopy[manga.url] = {...manga, thumbnail: `${Platform.OS === 'android' ? 'file://' : ''}${path}/0`, tags: response.tags}
    await AsyncStorage.setItem('downloaded', JSON.stringify(downloadObjectCopy))
    setFavObject(downloadObjectCopy)
  }

  const saveImageToFolder = async ({url, path, index}) => {
    if (Platform.OS === "android" && !(await hasAndroidPermission())) {
      alert("Unable to download album, please turn on ur permission in Settings!")
      return;
    }
    await RNFetchBlob
      .config({
        fileCache: true,
        path: path + '/' + index,
        appendExt: 'png',
      })
      .fetch('GET', url)
      .then(res => {
        console.log(res.path())
      })
      .catch(e => console.log(e))
  }

  const saveHistory = async (tags, imageIndex) => {
    try {
      if(imageIndex >= 1 || (imageIndex / currentAlbum.imageNumber) >= 0.5){
        const tagsCopy = {...tagObject} || {}
        Object.entries(tags)
          .map(([k, v]) => {
            !tagsCopy[k] && (tagsCopy[k] = {})
            v.map(tag => {
              tagsCopy[k][tag] = tagsCopy[k][tag] ? tagsCopy[k][tag] + 1 : 1
            })
          })
        await AsyncStorage.setItem('tags', JSON.stringify(tagsCopy))
      }
      const currentAlbumCopy = {...currentAlbum}
      delete currentAlbumCopy['downloaded']
      let userObjectCopy = {
        ...userObject,
        history: userObject.history ? uniq(userObject.history.concat([currentAlbumCopy])) : [currentAlbumCopy],
      }
      await AsyncStorage.setItem('user', JSON.stringify(userObjectCopy))
      setUserObject(userObjectCopy)
      const dateNow = new Date(Date.now())
      const todayDateString = new Date(dateNow.getTime() - (dateNow.getTimezoneOffset()*60*1000)).toISOString().split('T')[0];
      const commitCopy = {
        ...commitObject,
        [todayDateString]: commitObject[todayDateString] ? commitObject[todayDateString] + 1 : 1,
      }
      await AsyncStorage.setItem('commits', JSON.stringify(commitCopy))
      setCommitObject(commitCopy)
    }
    catch(e) {
      console.log(e)
    }
  }

  const MangaCard = ({ manga }) => {
    const [showAction, setShowAction] = useState(false);
    return(
      <Card
        style={styles.mangaCard}
        onPress={() => setCurrentAlbum({...manga, downloaded: Boolean(downloadObject[manga.url])})}
        onLongPress={() => setShowAction(!showAction)}
      >
        <Card.Content style={styles.cardContent}>
          <Image style={styles.cardImage} source={{ uri: manga.thumbnail }} />
          <Card.Title
            title={manga.title}
            subtitle={`${Array((manga.stars || -1 )+ 1).map(() => '').join('★')}\n${manga.imageNumber} pages`}
            style={styles.cardTitleContainer}
            titleStyle={styles.cardTitle}
            rightStyle={styles.cardButton}
            titleNumberOfLines={3}
            subtitleNumberOfLines={2}
            right={
              props =>
                <IconButton
                  {...props}
                  onPress={() => toggleFavourite(manga)}
                  color={Colors.purple800}
                  size={18}
                  icon={favObject[manga.url] ? "heart" : "heart-outline"}
                />
            }
          />
        </Card.Content>
        {
          showAction &&
          <Card.Actions>
            <Button onPress={() => setShowAction(false)}>Cancel</Button>
            <Button onPress={() => [downloadManga(manga), setSnackBarMessage('Downloading!'), setShowAction(false)]}>Download</Button>
          </Card.Actions>
        }
      </Card>
    )
  }

  const parseHomePage = async(parseParams) => {
    const needsReset = parseParams && parseParams.refresh && (!searchQuery || parseParams.initial);
    const response = await parseGallery({
      ...(parseParams || {}),
      searchQuery: searchQuery,
      page: needsReset ? 0 : currentPage,
      url: parseParams && parseParams.url,
      filter: !searchQuery && config.defaultFilter,
    })
    setMangaList(
      needsReset ?
        response.mangaList:
        old => (old || []).concat(response.mangaList)
    )
    setCurrentPage(response.page)
  }

  useEffect(() => {
    if(!mode){
      setCurrentPage(0);
      parseHomePage({refresh: true, initial: true})
    }
  },[searchQuery.split(/\s+/).length])

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    parseHomePage({refresh: true})
      .then(() => setRefreshing(false))
  }, []);

  const onSearchPressed = () => {
    setCurrentPage(0);
    parseHomePage({refresh: true, initial: true})
    setSearchHistory([...searchHistory.concat([searchQuery])])
  }

  const switchChart = () => {

  }

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity || 0.5})`,
  };

  return(
    <>
      {
        !mode &&
        <Menu
          style={styles.dropDownMenuStyle}
          visible={showMenu.search}
          onDismiss={() => setShowMenu()}
          anchor={
            <Searchbar
              style={styles.searchBar}
              placeholder="Enter keywords"
              onChangeText={query => setSearchQuery(query)}
              value={searchQuery}
              onSubmitEditing={onSearchPressed}
              icon="menu"
              onIconPress={() => setShowMenu('search')}
            />
          }
        >
          <Menu.Item
            onPress={() => [
              parseHomePage({
                refresh: true, initial: true, url: 'https://e-hentai.org/popular',
              }), setShowMenu()]
            }
            title="Popular"
            icon="fire"
          />
        </Menu>
      }
      {
        searchQuery !== '' &&
        <View style={styles.chipContainer} >
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            {
              [...new Set(searchQuery.split(/\s+/))].filter(k => k !== '').map(keyword =>
                <Chip
                  style={styles.chip}
                  mode={'outlined'}
                  key={keyword}
                  onClose={() => [setSearchQuery(searchQuery.replace(keyword, ''))]} // Potential setState async bug, better use useEffect
                >
                  {keyword}
                </Chip>
              )
            }
          </ScrollView>
        </View>
      }
      {
        (!mode) && Object.keys(tagObject).length !== 0 && tagObject[config.tagMode] &&
        <View style={styles.chipContainer}>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={
              Object.entries(tagObject[config.tagMode])
                .sort(([,a],[,b]) => b-a)
                .slice(0, 10)
            }
            keyExtractor={item => item[0]}
            renderItem={({item}) =>
              <Chip
                icon={searchQuery.toLowerCase().includes(item[0]) ? 'check' : 'heart'}
                style={styles.chip}
                selected={searchQuery.toLowerCase().includes(item[0])}
                onPress={() =>
                  [
                    setSearchQuery(
                      searchQuery.toLowerCase().includes(item[0]) ?
                        searchQuery.replace(item[0], ''):
                        searchQuery.concat(` ${item[0]}`)
                    ),
                  ]
                }
              >
                {`${item[0]} ${item[1]}`}
              </Chip>
            }
          />
        </View>
      }
      <FlatList
        ListHeaderComponent={mode && (() =>
          <>
            <Surface style={[styles.surface, {justifyContent: 'flex-start'}]}>
              <IconButton
                onPress={switchChart}
                icon={Object.values(mode)[0].iconName}
              />
              <Text>{`${mangaList.length} Items`}</Text>
            </Surface>
            {
              mode && mode.isDashboard && Object.keys(tagObject).length !== 0 && tagObject[config.tagMode] &&
              <>
                <Surface style={[styles.surface, styles.surfaceRow]}>
                  <PieChart
                    style={styles.chart}
                    data={
                      Object.entries(tagObject[config.tagMode])
                        .sort(([,a],[,b]) => b-a)
                        .slice(0, 8)
                        .map(([k, v], i) => ({
                          name: k,
                          count: v,
                          color: `rgba(0,0,0,${1 - i / 8.0})`,
                          legendFontColor: "#7F7F7F",
                        }))
                    }
                    width={screenWidth * 0.94}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="count"
                    absolute
                  />
                </Surface>
                <Surface style={[styles.surface, styles.surfaceRow]}>
                  <ContributionGraph
                    values={Object.entries(commitObject).map(([k, v]) => ({date: k, count: v}))}
                    endDate={new Date(Date.now())}
                    numDays={105}
                    width={screenWidth * 0.94}
                    height={220}
                    chartConfig={chartConfig}
                  />
                </Surface>
              </>
            }
          </>
        )}
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.container}
        onRefresh={() => mode ? fetchStorage() : onRefresh()}
        refreshing={refreshing}
        data={mangaList}
        keyExtractor={manga => manga.url}
        onEndReached={() => !mode && parseHomePage()}
        renderItem={({item}) => <MangaCard manga={item} />}
      />
      {
        currentAlbum &&
        <MangaViewer album={currentAlbum} close={() => setCurrentAlbum(null)} saveHistory={saveHistory}/>
      }
      {
        snackBarMessage &&
        <Snackbar
          style={styles.snackBar}
          visible={Boolean(snackBarMessage)}
          onDismiss={() => setSnackBarMessage(null)}
          duration={1000}
        >
          {snackBarMessage}
        </Snackbar>
      }
    </>
  )
}

export default Home;