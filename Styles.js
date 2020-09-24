import { StyleSheet } from "react-native"
import colors from './colors'
export default StyleSheet.create({
    container:{
        alignItems: 'center',
        width:'100%',
        backgroundColor: colors.backgroundColor,
    },
    mangaCard:{
        maxWidth: '80%',
        minWidth: '80%',
        marginTop: 20,
        marginBottom: 20,
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

