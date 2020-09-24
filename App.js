import { ScrollView, View, Text, StatusBar, Modal, RefreshControl, FlatList, TouchableOpacity } from 'react-native';
import React, { Component, Fragment, useState, useEffect, useCallback} from 'react';
import { createAppContainer, SafeAreaView } from 'react-navigation';
import { Provider as PaperProvider, Card, Title, Paragraph } from 'react-native-paper';
import HTMLParser from 'fast-html-parser'
import ImageView from "react-native-image-viewing";
import styles from './Styles'
import colors from './colors'
const userAgent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'


const Home = () => {

    const [mangaList, setMangaList] = useState([])
    const [currentPage, setCurrentPage] = useState(0)
    const [currentAlbum, setCurrentAlbum] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    // eslint-disable-next-line arrow-parens
    const parseHomePage = async (parseParams) => {
        const url = parseParams && parseParams.refresh?
            'https://e-hentai.org/?&f_search=chinese' :
            `https://e-hentai.org/?${currentPage ? `page=${currentPage + 1}` : '' }&f_search=${parseParams && parseParams.tags ? parseParams.tags.join('+') : 'chinese'}&inline_set=dm_t`
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
                const tempMangaList = parseParams && parseParams.refresh ? [] : [...mangaList]
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
                setMangaList([...new Set(tempMangaList)]);
                setCurrentPage(currentPage + 1);
            })
            .catch(e => alert(e))
    }

    const parseAlbum = (album, page) => {
        console.log(album)
        fetch(album.url || (`${currentAlbum.url}?p=${page}`), {
            method: 'GET',
            headers: {
                'User-Agent': userAgent,
            },
        })
            .then(res => res.text())
            .then(html => { // Parse album view to get full res link
                let doc = HTMLParser.parse(html);
                const rawImageDiv = doc.querySelectorAll('.gdtm');
                const tempImageList = []
                let promise = []
                rawImageDiv.slice(0, Math.min(25, rawImageDiv.length)).map(div => {
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
                                const image = {
                                    uri: doc.querySelector('#img').rawAttributes.src,
                                }
                                tempImageList.push(image)
                            })
                    )
                })
                Promise.all(promise)
                    .then(() => {
                        if(currentAlbum){
                            setCurrentAlbum({
                                ...currentAlbum,
                                images: [...currentAlbum.images].push(tempImageList),
                                page: page,
                            })
                        }
                        else{
                            setCurrentAlbum({
                                title: album.title,
                                url: album.url,
                                images: tempImageList,
                                imageNumber: album.imageNumber,
                                page: 1,
                            })
                        }
                    })
            })
            .catch(e => alert(e))
    }

    useEffect(() => {
        parseHomePage();
    },[])

    const MangaCard = ({ manga }) => (
        <Card style={styles.mangaCard} onPress={() => parseAlbum(manga)}>
            <Card.Content>
                <Title>{manga.title}</Title>
                <Paragraph>{`${manga.imageNumber} pages`}</Paragraph>
            </Card.Content>
            <Card.Cover source={{ uri: manga.thumbnail }} />
        </Card>
    )
    
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        parseHomePage({refresh: true})
            .then(() => [console.log("Refreshed!"),setRefreshing(false)])
    }, []);
  
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

    return(
        <>
            {
                mangaList &&
                <FlatList
                    contentContainerStyle={styles.container}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    data={mangaList}
                    keyExtractor={manga => manga.url}
                    onEndReached={() => parseHomePage()}
                    renderItem={({item}) => <MangaCard manga={item} />}
                />
            }
            {
                currentAlbum &&
                <ImageView
                    images={currentAlbum.images}
                    imageIndex={0}
                    visible={true}
                    onRequestClose={() => setCurrentAlbum(null)}
                    swipeToCloseEnabled={false}
                    HeaderComponent={() => <ReaderHeader close={() => setCurrentAlbum(null)}/>}
                    FooterComponent={({imageIndex}) => <ReaderFooter imageIndex={imageIndex} totalPages={currentAlbum.imageNumber} />}
                />
            }
        </>
    )
}

export default function App(){
    return (
        <PaperProvider>
            <SafeAreaView style={{ backgroundColor: colors.backgroundColor }} forceInset={{ bottom: 'never'}}>
                <Home/>
            </SafeAreaView>
        </PaperProvider>
    );
}
