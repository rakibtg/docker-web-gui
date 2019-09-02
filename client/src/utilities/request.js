import axios from 'axios'
export const restPath = 'http://localhost:3230/api/'

export const request = ( method, path, data = {} ) => {
  const options = {
    method,
    data,
    url: restPath + path,
    timeout: 50000,
  }
  return axios(options)
}