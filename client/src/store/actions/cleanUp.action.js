import { request } from '../../utilities/request'
import { toaster } from 'evergreen-ui'

export const setCleanUpSegment = payload => ({
  type: 'SELECTED_SEGMENT',
  payload
})

export const executePrune = payload => ({
  type: 'EXECUTE_PRUNE',
  payload
})


export const setSelectedCleanUpSegment = (value) => (dispatch, getState)=>{
  dispatch(setCleanUpSegment({
    segmentValue: value
  }))
}


export const pruneCommand = (type) => (dispatch, getState)=>{
  dispatch(executePrune({
    apiCallStarted: true,
    responseData: {},
    isShowingSideSheet:false,
  }))
  request('get', `cleanup/command?type=${type}`)
    .then(res => {
      dispatch(executePrune({
        isShowingSideSheet: res.data ? true : false,
        responseData: res.data,
        apiCallStarted: false
      }))
      if(!res.data){
        toaster.success(`${type} prune success`, {duration: 5})
      }
    }) 
    .catch(ex=>{
      dispatch(executePrune({
        responseData: {},
        isShowingSideSheet:false,
        apiCallStarted:false
      }))
    }) 
}

export const resetLogSideSheet = () => (dispatch, getState)=>{
  dispatch(executePrune({
    isShowingSideSheet: !getState().cleanup.isShowingSideSheet,
    apiCallStarted: getState().cleanup.apiCallStarted
  }))
}