import { store } from '../'
import { request } from '../../utilities/request'

export const genericGroups = payload => ({
  type: 'GENERIC_GROUPS',
  payload
})

/*
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
  if(!store.getState().stats.isLive) {
    return dispatch => {
      dispatch(getContainersStat())
      dispatch(genericStats({ isLive: true }))
      setInterval(() => {
        dispatch(getContainersStat())
      }, 4000)
    }
  } else {
    return dispatch => {
      dispatch(genericStats({ isLive: true }))
    }
  }
}
*/