import AsyncStorage from '@react-native-async-storage/async-storage';

const removeStoreItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  }
  catch (e) {
    return false;
  }
};

const getStoreData = async (key: string): Promise<string> => {
  try {
    return JSON.parse(await AsyncStorage.getItem(key) || '{}');
  }
  catch (e) {
    console.log(`Loading error: ${e}`);
    return 'null';
  }
};

const storeData = async (key: string, value: any) => {
  try {
    return await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  catch (e) {
    console.log(`Saving error: ${e}`);
    return false;
  }
};

export {
  removeStoreItem, getStoreData, storeData,
};
