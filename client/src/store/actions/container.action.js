import { request } from '../../utilities/request'
import { toaster } from 'evergreen-ui'

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

export const updateContainerLog = payload => ({
  type: 'UPDATE_LOG',
  payload
})

export const toggleModal = payload => ({
  type: 'TOGGLE_MODAL',
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

export const deleteContainer = (container, command) => (dispatch, getState)=>{
    request('get', `container/command?container=${container.shortId}&command=${command}`)
      .then(res => {
        dispatch(removeContainer({
          containerId: container.shortId,
          showModal: !getState().container.showModal,
          selectedContainer: {}
        }))
        toaster.success(
          `${container.Name} is removed.`,
          {
            duration: 5
          }
        )
      })  
}

export const getLog = (container) => {
  return dispatch => {
    dispatch(updateContainerLog({
      container: container,
      isShowingSideSheet: false,
    }))
    request('get', `container/logs?container=${container.shortId}`)
      .then(response => {
        dispatch(updateContainerLog({
          container: container,
          isShowingSideSheet: true,
          logData: response.data
        }))
      })
  }
}

export const resetLogSideSheet = () => (dispatch, getState)=>{
  dispatch(updateContainerLog({
    isShowingSideSheet: !getState().container.isShowingSideSheet,
  }))
}

export const toggleDeleteModal = (container) => (dispatch, getState)=>{
  dispatch(toggleModal({
    showModal: !getState().container.showModal,
    selectedContainer: container ? container : {}
  }))
}