import { request } from '../../utilities/request'

export const genericStats = payload => ({
  type: 'GENERIC_STATS',
  payload
})

export const getContainersStat = () => {
  return dispatch => {
    request('get', `container/stats`, {})
      .then(response => {
        dispatch(genericStats({ containerStats: response.data }))
      }).catch(error => {
        console.log(error)
      })
  }
}

export const containerStatsProcess = () => {
  return dispatch => {
    setInterval(() => {
      dispatch(getContainersStat())
    }, 4000)
  }
}