import { SafeAreaView, StatusBar } from 'react-native';
import React from 'react';
import { BottomNavigation, DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import styles from './style';
import colors from './constants/colors';
import Home, { HOME_MODES } from './pages/Home';

const theme = {
  ...DefaultTheme,
};

type IRoute = {
  key: string;
  title?: string;
  icon?: any;
  badge?: string | number | boolean;
  color?: string;
};

type IRenderScene = (props: { route: IRoute; jumpTo: (key: string) => void; }) => React.ReactNode | null

export default function App(){
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'home', title: 'Home', icon: 'image-size-select-actual' },
    { key: 'downloads', title: 'Download', icon: 'arrow-collapse-down' },
    { key: 'favourites', title: 'Favourite', icon: 'heart' },
    { key: 'account', title: 'account', icon: 'account' },
  ]);

  const renderScene:IRenderScene = ({ route }) => {
    if (routes[index].key !== route.key) { // to unmount other routes
      return null;
    }
    switch (route.key) {
      case 'home':
        return <Home mode={HOME_MODES.INITIAL} />;
      case 'downloads':
        return <Home mode={HOME_MODES.DOWNLOAD} icon={routes[index].icon} />;
      case 'favourites':
        return <Home mode={HOME_MODES.FAVOURITE} icon={routes[index].icon} />;
      case 'account':
        return <Home mode={HOME_MODES.DASHBOARD} icon="clock-time-two" />;
    }
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView
        style={{ backgroundColor: colors.backgroundColor }}
      />
      <StatusBar backgroundColor={colors.backgroundColor} barStyle="dark-content" />
      <BottomNavigation
        labeled={false}
        barStyle={styles.bottomNavigationBar}
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={props => renderScene(props)}
      />
      <SafeAreaView />
    </PaperProvider>
  );
}
