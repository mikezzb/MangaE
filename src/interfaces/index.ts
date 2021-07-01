export interface IManga {
  url: string,
  title: string,
  thumbnail?: string,
  stars?: number
  imageNumber?: number,
  tags?: any,
}

export interface ITags {
  [key: string]: {
    [key: string]: number
  }
}

export interface IFavourite {
  [key: string]: IManga;
}

export interface IDownload extends IManga {
  thumbnail: string,
}

export interface IDownloadObject {
  [key: string]: IDownload;
}

export interface IUser {
  history: IManga[],
}

export interface IParseParams {
  url?: string,
  refresh?: boolean,
  initial?: boolean,
  page?: number,
  filter?: string,
  searchQuery?: string,
}

export interface IImage {
  uri: string,
  index?: number,
}

export interface IAlbum extends IManga {
  downloaded?: boolean,
  images: Array<IImage>,
  page: number,
}

export interface ICommitObject {
  [key: string]: number,
}

export interface ISnackbar {
  label: string,
}
