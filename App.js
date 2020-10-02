import { SafeAreaView} from 'react-native';
import React from 'react';
import { BottomNavigation, DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import styles from './style'
import colors from './consts/colors'
import Home from './views/Home'

const theme = {
  ...DefaultTheme,
};

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
