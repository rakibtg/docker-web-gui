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
         ...{
          images: state.images.map(c => {
            if(c.ID == action.payload.imageId) {
              return {
                ...c,
                ...action.payload.data
              }
            } else {
              return c
            }
          })
        }
       }

     case 'DELETE_IMAGE':
       return {
         ...state,
         ...{
           images: state.images.filter(c => {
            if(action.payload.imageId) {
              return c.ID !== action.payload.imageId
            } else {
              return c
            }
           }),
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