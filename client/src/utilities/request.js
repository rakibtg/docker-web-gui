import axios from 'axios'
export const restPath = 'http://'+window.location.hostname+':3230/api/'

export const request = ( method, path, data = {} ) => {
  const options = {
    method,
    data,
    url: restPath + path,
    timeout: 50000,
  }
  return axios(options)
}
