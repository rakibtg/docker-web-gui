export const setCleanUpSegment = payload => ({
  type: 'SELECTED_SEGMENT',
  payload
})


export const setSelectedCleanUpSegment = (value) => (dispatch, getState)=>{
  dispatch(setCleanUpSegment({
    segmentValue: value
  }))
}
