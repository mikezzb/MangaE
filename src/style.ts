import { StyleSheet } from 'react-native';
import colors from './constants/colors';

export default StyleSheet.create({
  listHeader: {
    width: '100%',
  },
  surface: {
    flexDirection:'row',
    height: 'auto',
    marginTop:20,
    marginBottom: 5,
    width: '94%',
    marginLeft: '3%',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  surfaceRow: {
    flexDirection:'column',
  },
  chart: {
    width: '94%',
    marginLeft: '3%',
  },
  container:{
    alignItems: 'center',
    width:'100%',
    backgroundColor: colors.backgroundColor,
  },
  mangaCard:{
    maxWidth: '94%',
    minWidth: '94%',
    marginTop: 12,
    marginBottom: 12,
  },
  cardContent:{
    flexDirection: 'row',
    minHeight: 200,
    paddingLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    overflow: 'hidden',
  },
  cardImage:{
    resizeMode: 'cover',
    aspectRatio: 0.7,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    marginRight: 33,
    marginTop: 0,
  },
  cardButton: {
    position:'absolute',
    top: 0,
    right: 0,
    marginRight: 0,
  },
  searchBar:{
    width: '94%',
    marginLeft: '3%',
    marginTop: 20,
    marginBottom: 10,
  },
  dropDownMenuStyle:{
    marginTop: 75,
    marginLeft: 5,
  },
  chipContainer:{
    width: '94%',
    marginLeft: '3%',
    flexDirection: 'row',
    overflow: 'visible',
  },
  chip: {
    margin: 8,
  },
  headerContainer: {
    flexDirection:'row',
    justifyContent: 'flex-end',
    width: '100%',
    backgroundColor: 'transparent',
    color: '#FFF',
  },
  footerContainer: {
    marginLeft: 20,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFF',
  },
  closeButton: {
    width: 45,
    height: 45,
    marginLeft: 20,
    marginTop: 20,
  },
  closeText: {
    lineHeight: 25,
    fontSize: 25,
    paddingTop: 2,
    includeFontPadding: false,
    color: '#FFF',
  },
  footerText: {
    lineHeight: 12,
    fontSize: 12,
    paddingTop: 2,
    includeFontPadding: false,
    color: '#FFF',
  },
  bottomNavigationBar: {
    backgroundColor: '#FFF',
    height: 54,
  },
});

