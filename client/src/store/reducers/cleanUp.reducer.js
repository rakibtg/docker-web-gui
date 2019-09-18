export default (state = null, action) => {

   switch (action.type) {
 
     case 'SELECTED_SEGMENT':
       return {
         ...state,
         ...{
            selectedSegment: state.segmentOptions.find(c => {
              return c.value === action.payload.segmentValue
            })
          }
       }
      
      case 'EXECUTE_PRUNE':
       return {
         ...state,
         ...{
            isShowingSideSheet: action.payload.isShowingSideSheet,
            responseData: action.payload.responseData ? {
              data: action.payload.responseData
            } : {},
            apiCallStarted: action.payload.apiCallStarted
          }
       }
       
     default:
       return state
 
   }
 }