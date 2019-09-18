import { request } from '../../utilities/request'

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
  request('get', `container/command?type=${type}`)
    .then(res => {
      dispatch(executePrune({
        isShowingSideSheet: true,
        responseData: res.Data
      }))
    })  
}