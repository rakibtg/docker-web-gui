import axios from 'axios'
export const restPath = '/api/'

export const request = ( method, path, data = {} ) => {
  const options = {
    method,
    data,
    url: restPath + path,
    timeout: 50000,
  }
  return axios(options)
}
