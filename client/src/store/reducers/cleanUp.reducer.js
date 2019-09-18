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
       
     default:
       return state
 
   }
 }