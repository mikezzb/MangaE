/* eslint-disable arrow-parens */
import { ScrollView, Dimensions, PermissionsAndroid, Platform, View, FlatList, TouchableOpacity , SafeAreaView} from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, Surface, Snackbar, IconButton, Colors, Button, BottomNavigation, DefaultTheme, Chip, Card, Searchbar, Provider as PaperProvider } from 'react-native-paper';
import HTMLParser from 'fast-html-parser'
import ImageView from "react-native-image-viewing";
import AsyncStorage from '@react-native-community/async-storage';
import RNFetchBlob from 'rn-fetch-blob'
import { PieChart, ContributionGraph } from "react-native-chart-kit";
import styles from './Styles'
import colors from './colors'

const userAgent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'

const screenWidth = Dimensions.get("window").width;

const theme = {
    ...DefaultTheme,
};

async function hasAndroidPermission() {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  
    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
        return true;
    }
  
    const status = await PermissionsAndroid.request(permission);
    return status === 'granted';
}

const MangaViewer = ({ album, close, saveHistory }) => {
    const [currentAlbum, setCurrentAlbum] = useState(null)
    const parseAlbumAndSave = async (page) => {
        const response = await parseAlbum(album.url, page)
        const tempImageList = response.imageList
        const tags = response.tags
        if(currentAlbum){
            setCurrentAlbum({
                ...currentAlbum,
                images: [...currentAlbum.images].concat(tempImageList),
                page: page,
            })
        }
        else{
            const manga = {
                title: album.title,
                url: album.url,
                images: tempImageList,
                imageNumber: album.imageNumber,
                page: 0,
                tags: tags,
            }
            setCurrentAlbum(manga)
        }
    }

    useEffect(() => {
        if(album.downloaded){
            let dirs = RNFetchBlob.fs.dirs
            const path = `${dirs.DocumentDir}/${album.title}`
            setCurrentAlbum({
                ...album,
                images: Array.from({length: album.imageNumber}, (x, i) => i).map(i => ({uri: `${Platform.OS === 'android' ? 'file://' : ''}${path}/${i}`})),
            })
        }
        else{
            parseAlbumAndSave(0)
        }
    }, [album])

    const ReaderHeader = ({close}) => (
        <SafeAreaView>
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={close}
                >
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
    const ReaderFooter = ({imageIndex, totalPages}) => (
        <SafeAreaView>
            <View style={styles.footerContainer}>
                <Text style={styles.footerText}>{`P.${imageIndex + 1}/${totalPages}`}</Text>
            </View>
        </SafeAreaView>
    )

    const fetchMoreImage = imageIndex => {
        if((imageIndex + 1) === currentAlbum.images.length && !(currentAlbum.images.length >= currentAlbum.imageNumber)){
            parseAlbumAndSave(currentAlbum.page + 1)
        }
    }

    return(
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
                    HeaderComponent={({imageIndex}) => <ReaderHeader close={() => [saveHistory(currentAlbum.tags, imageIndex), close()]}/>}
                    FooterComponent={({imageIndex}) => <ReaderFooter imageIndex={imageIndex} totalPages={currentAlbum.imageNumber} />} />
            }
        </>
    )
}

async function parseAlbum(url, page) {
    const initial = await fetch(`${url}?p=${page || 0}`, {
        method: 'GET',
        headers: {'User-Agent': userAgent},
    })
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
    let promise = []
    rawImageDiv.map((div, i) => {
        promise.push(
            fetch(div.querySelector('a').rawAttributes.href, {
                method: 'GET',
                headers: {
                    'User-Agent': userAgent,
                },
            })
                .then(res => res.text())
                .then(html => {
                    let doc = HTMLParser.parse(html);
                    const uri = doc.querySelector('#img').rawAttributes.src
                    if(uri){
                        const image = {
                            uri: uri,
                            index: i,
                        }
                        tempImageList.push(image)
                    }
                })
                .catch(e => alert(e))
        )
    })
    await Promise.all(promise)
    tempImageList.sort((a, b) => (a.index > b.index) ? 1 : -1)
    return {
        imageList: tempImageList,
        tags: tags,
    }
}

async function fetchAllImages(url, imageNumber) {
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

    const searchBarRef = useRef();

    const parseHomePage = async (parseParams) => {
        const url = parseParams && parseParams.refresh && searchQuery === '' ?
            'https://e-hentai.org/?&f_cats=767' : // default search string, can based on user preferred tags
            `https://e-hentai.org/?${currentPage ? `page=${currentPage + 1}` : '' }&f_search=${searchQuery ? [...new Set(searchQuery.split(/\s+/))].filter(k => k !== '').join('+') : 'chinese'}&inline_set=dm_t`
        console.log(url)
        await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': userAgent,
            },
        })
            .then(res => res.text())
            .then(html => { // Parse the content in homepage
                let doc = HTMLParser.parse(html);
                const rawMangaDiv = doc.querySelectorAll('.gl1t');
                const tempMangaList = parseParams && parseParams.refresh && (!searchQuery || parseParams.initial) ? [] : [...mangaList]
                rawMangaDiv.map(div => {
                    const a = div.querySelector('a')
                    const detail = div.querySelector('.gl5t')
                    const manga = {
                        title: a.text,
                        url: a.rawAttributes.href,
                        thumbnail: div.querySelector('img').rawAttributes.src,
                        imageNumber: parseInt(detail.childNodes[1].text),
                    }
                    tempMangaList.push(manga)
                })
                setMangaList(uniq(tempMangaList));
                setCurrentPage(currentPage + 1);
            })
            .catch(e => alert(e))
    }

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

    const uniq = a => a.filter((v,i,a) => a.findIndex(t => (t.url === v.url)) === i)

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
                <Card.Content>
                    <Card.Title
                        title={manga.title}
                        subtitle={`${manga.imageNumber} pages`}
                        style={styles.cardTitleContainer}
                        titleStyle={styles.cardTitle}
                        rightStyle={styles.cardButton}
                        titleNumberOfLines={3}
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
                <Card.Cover source={{ uri: manga.thumbnail }} />
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
                mangaList &&
                <>
                    {
                        !mode &&
                        <Searchbar
                            ref={searchBarRef}
                            style={styles.searchBar}
                            placeholder="Enter keywords"
                            onChangeText={query => setSearchQuery(query)}
                            value={searchQuery}
                            onSubmitEditing={onSearchPressed}
                        />
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
                        (!mode) && Object.keys(tagObject).length !== 0 && tagObject['artist'] &&
                        <View style={styles.chipContainer}>
                            <FlatList
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                data={
                                    Object.entries(tagObject['artist'])
                                        .sort(([,a],[,b]) => b-a)
                                        .slice(0, 10)
                                }
                                keyExtractor={item => item[0]}
                                renderItem={({item}) => 
                                    <Chip 
                                        icon={searchQuery.toLowerCase().includes(item[0]) ? 'check' : 'fire'}
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
                                    mode && mode.isDashboard && Object.keys(tagObject).length !== 0 && tagObject['artist'] &&
                                    <>
                                        <Surface style={[styles.surface, styles.surfaceRow]}>
                                            <PieChart
                                                style={styles.chart}
                                                data={
                                                    Object.entries(tagObject['artist'])
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
                </>
            }
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

export default function App(){
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
        { key: 'home', title: 'Home', icon: 'image-size-select-actual'},
        { key: 'downloads', title: 'Download', icon: 'arrow-collapse-down' },
        { key: 'favourites', title: 'Favourite', icon: 'heart' },
        { key: 'account', title: 'account', icon: 'account'},
    ]);

    const renderScene = ({ route }) => {
        if (routes[index].key !== route.key) { // to unmount other routes
            return null;
        }
        switch (route.key) {
        case 'home':
            return <Home />;
        case 'downloads':
            return <Home mode={{isDownload: {iconName: routes[index].icon}}} />;
        case 'favourites':
            return <Home mode={{isFav: {iconName: routes[index].icon}}} />;
        case 'account':
            return <Home mode={{isDashboard: {iconName: 'clock-time-two'}}} />;
        }
    }

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={{ backgroundColor: colors.backgroundColor }} forceInset={{ bottom: 'never'}} />
            <BottomNavigation
                labeled={false}
                barStyle={styles.bottomNavigationBar}
                navigationState={{ index, routes }}
                onIndexChange={setIndex}
                renderScene={renderScene}
            />
            <SafeAreaView />
        </PaperProvider>
    );
}
