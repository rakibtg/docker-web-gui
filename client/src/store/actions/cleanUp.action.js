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
  request('get', `cleanup/command?type=${type}`)
    .then(res => {
      console.log('reeee', res)
      dispatch(executePrune({
        isShowingSideSheet: res.data ? true : false,
        responseData: res.data
      }))
      if(!res.data){
        toaster.success(`${type} prune success`, {duration: 5})
      }
    })  
}

export const resetLogSideSheet = () => (dispatch, getState)=>{
  dispatch(executePrune({
    isShowingSideSheet: !getState().cleanup.isShowingSideSheet,
  }))
}