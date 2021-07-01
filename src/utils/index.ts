export const uniq = (a: Array<any>) => a.filter((v,i,acc) => acc.findIndex(t => (t.url === v.url)) === i);

export const isEmpty = (obj: object) => obj && Object.keys(obj).length === 0 && obj.constructor === Object;
