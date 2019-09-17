export default (state = null, action) => {

   switch (action.type) {
 
     case 'GENERIC_IMAGE':
       return {
         ...state,
         ...action.payload
       }

     case 'RUN_IMAGE':
       return {
         ...state,

       }

     case 'DELETE_IMAGE':
       return {
         ...state,
         ...{
           containers: state.images.filter(c => {
             return c.ID !== action.payload.imageId
           },
           ),
           showModal: action.payload.showModal,
           selectedImage: action.payload.selectedImage
         }
       }
 
     case 'TOGGLE_IMAGE_MODAL':
       return {
         ...state,
         ...{
           showModal: action.payload.showModal,
           selectedImage: action.payload.selectedImage
         }
       }
       
     default:
       return state
 
   }
 }