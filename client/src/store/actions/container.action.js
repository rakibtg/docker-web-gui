import { request } from '../../utilities/request'

export const genericContainer = payload => ({
  type: 'GENERIC_CONTAINER',
  payload
})

export const getContainers = token => {
  return dispatch => {
    request('post', 'container', {})
      .then(response => {
        console.log(response)
        // dispatch(genericContainer({
        //   homeScreenLoading: false
        // }))
      }).catch(error => {
        // dispatch(genericContainer({
        //   homeScreenLoading: false
        // }))
      })
  }
}