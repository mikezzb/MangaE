import {
  Image,
  ScrollView,
  Dimensions,
  View,
  FlatList,
} from 'react-native';
import React, { useState, useEffect, useCallback, useReducer } from 'react';
import {
  Menu,
  Text,
  Surface,
  Snackbar,
  IconButton,
  Colors,
  Button,
  Chip,
  Card,
  Searchbar,
} from 'react-native-paper';
import { PieChart, ContributionGraph } from 'react-native-chart-kit';
import MangaViewer from '../components/MangaViewer';
import parseGallery from '../parsers/parseGallery';
import styles from '../style';
import { isEmpty, uniq } from '../utils';
import config, { chartConfig } from '../constants/config';
import { getStoreData, removeStoreItem, storeData } from '../utils/store';
import { IAlbum, ICommitObject, IDownloadObject, IFavourite, IManga, IParseParams, ISnackbar, ITags, IUser } from '../interfaces';
import downloadManga from '../parsers/downloadManga';

const screenWidth = Dimensions.get('window').width;

export enum HOME_MODES {
  INITIAL,
  DOWNLOAD,
  FAVOURITE,
  DASHBOARD,
}

class IStore {
  'downloaded': any;
  'favourites': IFavourite;
  'user': any;
  'tags': any;
  'commits': any;
  [key: string]: any;
}

type IHome = {
  mode: HOME_MODES,
  icon?: string,
}

const STORE_ITEMS = ['downloaded', 'favourites', 'user', 'tags', 'commits'];

const Home = ({ mode, icon }: IHome) => {
  const [mangaList, setMangaList] = useState<IManga[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentAlbum, setCurrentAlbum] = useState<IAlbum>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<Array<string>>([]);
  const [favObject, setFavObject] = useState<IFavourite>({});
  const [downloadObject, setDownloadObject] = useState<IDownloadObject>({});
  const [userObject, setUserObject] = useState<IUser>({ history: [] });
  const [tagObject, setTagObject] = useState<ITags>({});
  const [commitObject, setCommitObject] = useState<ICommitObject>({});
  const [snackbar, setSnackbar] = useState<ISnackbar | null>(null);

  const [showMenu, setShowMenu] = useReducer(
    (state: any, active: any) =>
      Object.keys(state).reduce(
        (result, menu) => ({ ...result, [menu]: active === menu }),
        {}
      ),
    {
      search: false,
    }
  );

  useEffect(() => {
    fetchStorage();
  }, []);

  const init = async () => {
    await Promise.all(
      STORE_ITEMS.map(async (label: string) => {
        await removeStoreItem(label);
      })
    );
  };

  const fetchStorage = async () => {
    const store = new IStore();
    await Promise.all(
      STORE_ITEMS.map(async (label: string) => {
        store[label] = await getStoreData(label);
      })
    );
    console.table(store);
    setDownloadObject(store.downloaded);
    setFavObject(store.favourites);
    setUserObject(store.user);
    setTagObject(store.tags);
    setCommitObject(store.commits);

    if (mode) {
      mode === HOME_MODES.DOWNLOAD && setMangaList(Object.values(store.downloaded));
      mode === HOME_MODES.FAVOURITE && setMangaList(Object.values(store.favourites));
      mode === HOME_MODES.DASHBOARD && setMangaList(store.user.history.reverse());
    }
  };

  const toggleFavourite = async (manga: IManga) => {
    try {
      let favObjectCopy: IFavourite = { ...favObject };
      if (!favObjectCopy[manga.url]) {
        favObjectCopy[manga.url] = manga;
      }
      else {
        delete favObjectCopy[manga.url];
      }
      await storeData('favourites', favObjectCopy);
      setFavObject(favObjectCopy);
    }
    catch (e) {
      console.log(e);
    }
  };

  const saveHistory = async (tags: any, imageIndex: number) => {
    try {
      if (imageIndex >= 1 || imageIndex / (currentAlbum.imageNumber || 1) >= 0.5) {
        const tagsCopy = { ...tagObject } || {};
        Object.entries(tags).map(([k, v]) => {
          !tagsCopy[k] && (tagsCopy[k] = {});
          v.map((tag: string) => {
            tagsCopy[k][tag] = tagsCopy[k][tag] ? tagsCopy[k][tag] + 1 : 1;
          });
        });
        await storeData('tags', tagsCopy);
      }
      const currentAlbumCopy = { ...currentAlbum };
      delete currentAlbumCopy.downloaded;
      let userObjectCopy = {
        ...userObject,
        history: userObject.history
          ? uniq(userObject.history.concat([currentAlbumCopy]))
          : [currentAlbumCopy],
      };
      await storeData('user', userObjectCopy);
      setUserObject(userObjectCopy);
      const dateNow = new Date(Date.now());
      const todayDateString = new Date(
        dateNow.getTime() - dateNow.getTimezoneOffset() * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      const commitCopy = {
        ...commitObject,
        [todayDateString]: commitObject[todayDateString]
          ? commitObject[todayDateString] + 1
          : 1,
      };
      await storeData('commits', commitCopy);
      setCommitObject(commitCopy);
    }
    catch (e) {
      console.log(e);
    }
  };

  const MangaCard = ({ manga }: { manga: IManga }) => {
    const [showAction, setShowAction] = useState(false);
    return (
      <Card
        style={styles.mangaCard}
        onPress={() =>
          setCurrentAlbum({
            ...manga,
            downloaded: Boolean(downloadObject[manga.url]),
          })
        }
        onLongPress={() => setShowAction(!showAction)}
      >
        <Card.Content style={styles.cardContent}>
          <Image style={styles.cardImage} source={{ uri: manga.thumbnail }} />
          <Card.Title
            title={manga.title}
            subtitle={`${Array((manga.stars || -1) + 1)
              .map(() => '')
              .join('★')}\n${manga.imageNumber} pages`}
            style={styles.cardTitleContainer}
            titleStyle={styles.cardTitle}
            rightStyle={styles.cardButton}
            titleNumberOfLines={3}
            subtitleNumberOfLines={2}
            right={props => (
              <IconButton
                {...props}
                onPress={() => toggleFavourite(manga)}
                color={Colors.purple800}
                size={18}
                icon={favObject[manga.url] ? 'heart' : 'heart-outline'}
              />
            )}
          />
        </Card.Content>
        {showAction && (
          <Card.Actions>
            <Button onPress={() => setShowAction(false)}>Cancel</Button>
            <Button
              onPress={async () => {
                setSnackbar({ label: 'Downloading!' });
                setShowAction(false);
                const result = await downloadManga(manga, downloadObject);
                if (!result) {
                  setSnackbar({ label: 'No image saving permission!' });
                }
                else {
                  setSnackbar({ label:'All downloaded!' });
                  setDownloadObject(result);
                }
              }}
            >
              Download
            </Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  const parseHomePage = async (parseParams: IParseParams) => {
    const needsReset =
      parseParams &&
      parseParams.refresh &&
      (!searchQuery || parseParams.initial);
    const response = await parseGallery({
      ...(parseParams || {}),
      searchQuery: searchQuery,
      page: needsReset ? 0 : currentPage,
      url: parseParams && parseParams.url,
      filter: !searchQuery && config.defaultFilter,
    });
    setMangaList(
      needsReset
        ? response.mangaList
        : old => (old || []).concat(response.mangaList)
    );
    setCurrentPage(response.page);
  };

  useEffect(() => {
    if (!mode) {
      setCurrentPage(0);
      parseHomePage({ refresh: true, initial: true });
    }
  }, [searchQuery.split(/\s+/).length]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    parseHomePage({ refresh: true }).then(() => setRefreshing(false));
  }, []);

  const onSearchPressed = () => {
    setCurrentPage(0);
    parseHomePage({ refresh: true, initial: true });
    setSearchHistory([...searchHistory.concat([searchQuery])]);
  };

  const switchChart = () => {};

  return (
    <>
      {!mode && (
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
                refresh: true,
                initial: true,
                url: 'https://e-hentai.org/popular',
              }),
              setShowMenu(),
            ]}
            title="Popular"
            icon="fire"
          />
        </Menu>
      )}
      {searchQuery !== '' && (
        <View style={styles.chipContainer}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            {[...new Set(searchQuery.split(/\s+/))]
              .filter(k => k !== '')
              .map(keyword => (
                <Chip
                  style={styles.chip}
                  mode={'outlined'}
                  key={keyword}
                  onClose={() => [
                    setSearchQuery(searchQuery.replace(keyword, '')),
                  ]} // Potential setState async bug, better use useEffect
                >
                  {keyword}
                </Chip>
              ))}
          </ScrollView>
        </View>
      )}
      {!mode &&
        Object.keys(tagObject).length !== 0 &&
        tagObject[config.tagMode] && (
        <View style={styles.chipContainer}>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={Object.entries(tagObject[config.tagMode])
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)}
            keyExtractor={item => item[0]}
            renderItem={({ item }) => (
              <Chip
                icon={
                  searchQuery.toLowerCase().includes(item[0])
                    ? 'check'
                    : 'heart'
                }
                style={styles.chip}
                selected={searchQuery.toLowerCase().includes(item[0])}
                onPress={() => [
                  setSearchQuery(
                    searchQuery.toLowerCase().includes(item[0])
                      ? searchQuery.replace(item[0], '')
                      : searchQuery.concat(` ${item[0]}`)
                  ),
                ]}
              >
                {`${item[0]} ${item[1]}`}
              </Chip>
            )}
          />
        </View>
      )}
      <FlatList
        ListHeaderComponent={
          mode && (
            <>
              <Surface
                style={[styles.surface, { justifyContent: 'flex-start' }]}
              >
                <IconButton
                  icon={icon}
                  onPress={switchChart}
                />
                <Text>{`${mangaList.length} Items`}</Text>
              </Surface>
              {mode === HOME_MODES.DASHBOARD &&
                Object.keys(tagObject).length !== 0 &&
                tagObject[config.tagMode] && (
                <>
                  <Surface style={[styles.surface, styles.surfaceRow]}>
                    <PieChart
                      style={styles.chart}
                      data={Object.entries(tagObject[config.tagMode])
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([k, v], i) => ({
                          name: k,
                          count: v,
                          color: `rgba(0,0,0,${1 - i / 8.0})`,
                          legendFontColor: '#7F7F7F',
                        }))}
                      width={screenWidth * 0.94}
                      height={220}
                      chartConfig={chartConfig}
                      accessor="count"
                      absolute
                    />
                  </Surface>
                  <Surface style={[styles.surface, styles.surfaceRow]}>
                    <ContributionGraph
                      values={Object.entries(commitObject).map(([k, v]) => ({
                        date: k,
                        count: v,
                      }))}
                      endDate={new Date(Date.now())}
                      numDays={105}
                      width={screenWidth * 0.94}
                      height={220}
                      chartConfig={chartConfig}
                    />
                  </Surface>
                </>
              )}
            </>
          )
        }
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.container}
        onRefresh={() => (mode ? fetchStorage() : onRefresh())}
        refreshing={refreshing}
        data={mangaList}
        keyExtractor={manga => manga.url}
        onEndReached={() => !mode && parseHomePage()}
        renderItem={({ item }) => <MangaCard manga={item} />}
      />
      {!isEmpty(currentAlbum) && (
        <MangaViewer
          album={currentAlbum}
          close={() => setCurrentAlbum({})}
          saveHistory={saveHistory}
        />
      )}
      {snackbar && (
        <Snackbar
          style={styles.snackBar}
          visible={Boolean(snackbar)}
          onDismiss={() => setSnackbar(null)}
          duration={1000}
        >
          {snackbar.label}
        </Snackbar>
      )}
    </>
  );
};

export default Home;
