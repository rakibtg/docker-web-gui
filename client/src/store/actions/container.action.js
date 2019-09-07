import { request } from '../../utilities/request'

export const genericContainer = payload => ({
  type: 'GENERIC_CONTAINER',
  payload
})

export const getContainers = (status = 'active') => {
  return dispatch => {
    dispatch(genericContainer({
      loading: status,
      pageError: false,
      segment: status,
      activeIndex: 0,
    }))
    request('get', `container/fetch?status=${status}`, {})
      .then(response => {
        dispatch(genericContainer({
          loading: false,
          containers: response.data,
          pageError: false,
        }))
      }).catch(error => {
        dispatch(genericContainer({
          loading: false,
          pageError: true,
        }))
      })
  }
}