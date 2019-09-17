export default (state = null, action) => {

   switch (action.type) {
 
     case 'GENERIC_IMAGE':
       return {
         ...state,
         ...action.payload
       }

   //   case 'DELETE_IMAGE':
   //     return {
   //       ...state,
   //       ...{
   //         containers: state.containers.filter(c => {
   //           return c.shortId !== action.payload.containerId
   //         },
   //         ),
   //         showModal: action.payload.showModal,
   //         selectedContainer: action.payload.selectedContainer
   //       }
   //     }
 
   //   case 'TOGGLE_MODAL':
   //     return {
   //       ...state,
   //       ...{
   //         showModal: action.payload.showModal,
   //         selectedContainer: action.payload.selectedContainer
   //       }
   //     }
       
     default:
       return state
 
   }
 }