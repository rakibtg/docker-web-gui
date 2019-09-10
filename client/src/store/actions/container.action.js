import { request } from '../../utilities/request'

export const genericContainer = payload => ({
  type: 'GENERIC_CONTAINER',
  payload
})

export const updateContainer = payload => ({
  type: 'UPDATE_CONTAINER',
  payload
})

export const removeContainer = payload => ({
  type: 'DELETE_CONTAINER',
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

export const toggleContainer = (container, status) => {
  return dispatch => {
    dispatch(updateContainer({
      containerId: container.shortId,
      data: { stateToggling: true },
    }))
    request('get', `container/command?container=${container.shortId}&command=${status}`)
      .then(res => {
        const State = {
          ...container.State,
          ...{
            Running: status === 'start'
              ? true
              : false
          }
        }
        dispatch(updateContainer({
          containerId: container.shortId,
          data: { 
            State,
            stateToggling: false,
          },
        }))
      })
  }
}

export const restartContainer = (container, status) => {
  return dispatch => {
    dispatch(updateContainer({
      containerId: container.shortId,
      data: { 
        stateToggling: true,
        State: {
          ...container.State,
          ...{
            Running: false
          }
        }
      },
    }))
    request('get', `container/command?container=${container.shortId}&command=${status}`)
      .then(res => {
        dispatch(updateContainer({
          containerId: container.shortId,
          data: { 
            State: {
              ...container.State,
              ...{
                Running: true
              }
            },
            stateToggling: false,
          },
        }))
      })
  }
}

export const deleteContainer = (container, command) => {
  return dispatch => {
    dispatch(removeContainer({
      containerId: container.shortId
    }))
    request('get', `container/command?container=${container.shortId}&command=${command}`)
      .then(res => {
        dispatch(removeContainer({
          containerId: container.shortId
        }))
      })
  }
}