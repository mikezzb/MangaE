import { StyleSheet } from "react-native"
import colors from './colors'
export default StyleSheet.create({
    container:{
        alignItems: 'center',
        width:'100%',
        backgroundColor: colors.backgroundColor,
    },
    mangaCard:{
        maxWidth: '90%',
        minWidth: '90%',
        marginTop: 12,
        marginBottom: 12,
    },
    searchBar:{
        width: '90%',
        marginLeft: '5%',
        marginTop: 20,
        marginBottom: 10,
    },
    chipContainer:{
        width: '90%',
        marginLeft: '5%',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        margin: 8,
    },
    headerContainer: {
        flexDirection:'row',
        justifyContent: 'flex-end',
        width: '100%',
        backgroundColor: "transparent",
        color: "#FFF",
    },
    footerContainer: {
        marginLeft: 20,
        alignSelf: 'flex-start',
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "#FFF",
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
        color: "#FFF",
    },
    footerText: {
        lineHeight: 12,
        fontSize: 12,
        paddingTop: 2,
        includeFontPadding: false,
        color: "#FFF",
    },
});

