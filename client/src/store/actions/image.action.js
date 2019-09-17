import { request } from '../../utilities/request'
import { toaster } from 'evergreen-ui'

export const genericImage = payload => ({
  type: 'GENERIC_IMAGE',
  payload
})

export const runImage = payload => ({
  type: 'RUN_IMAGE',
  payload
})

export const removeImage = payload => ({
  type: 'DELETE_IMAGE',
  payload
})

// export const updateContainerLog = payload => ({
//   type: 'UPDATE_LOG',
//   payload
// })

export const toggleModal = payload => ({
  type: 'TOGGLE_IMAGE_MODAL',
  payload
})

export const getImages = (status = 'active') => {
  return dispatch => {
    dispatch(genericImage({
      loading: status,
      pageError: false,
      segment: status,
      activeIndex: 0,
    }))
    request('get', `image/fetch`)
      .then(response => {
        dispatch(genericImage({
          loading: false,
          images: response.data,
          pageError: false,
        }))
      }).catch(error => {
        dispatch(genericImage({
          loading: false,
          pageError: true,
        }))
      })
  }
}

export const runImageToContainer = (image) => {
  return dispatch => {
    dispatch(runImage({
      imageId: image.ID,
      data: { stateToggling: true },
    }))
    request('get', `image/command?image=${image.ID}&command=${'run'}`)
      .then(res => {
        const State = {
          ...image.State,
        }
        dispatch(runImage({
          imageId: image.ID,
          data: { 
            State,
            stateToggling: false,
          },
        }))
        toaster.success(`Image ${image.ID} has been started running.`,{ duration: 5 })
      })
      .catch( ex => {
        dispatch(runImage({
          imageID: image.ID,
          data: { stateToggling: false },
        }))
        toaster.warning(`There is problem running image ${image.ID}`,{duration: 5})
      })
  }
}


export const deleteImage = (image, command) => (dispatch, getState)=>{
  console.log('deac')
    request('get', `image/command?image=${image.ID}&command=${command}`)
      .then(res => {
        dispatch(removeImage({
          imageId: image.ID,
          showModal: !getState().image.showModal,
          selectedImage: {}
        }))
        toaster.success(
          `Image ${image.ID} is no more!!!.`,
          {
            duration: 5
          }
        )
      })
      .catch(ex=>{
        console.log('excep', ex)
        dispatch(removeImage({
          imageId: image.ID,
          showModal: !getState().image.showModal,
          selectedImage: {}
        }))
        toaster.danger(
          `Image ${image.ID} can not be deleted!!!.`,
          {
            duration: 5
          },
        )
      })
}

// export const getLog = (container) => {
//   return dispatch => {
//     dispatch(updateContainerLog({
//       container: container,
//       isShowingSideSheet: false,
//     }))
//     request('get', `container/logs?container=${container.shortId}`)
//       .then(response => {
//         dispatch(updateContainerLog({
//           container: container,
//           isShowingSideSheet: true,
//           logData: response.data
//         }))
//       })
//   }
// }

// export const resetLogSideSheet = () => (dispatch, getState)=>{
//   dispatch(updateContainerLog({
//     isShowingSideSheet: !getState().container.isShowingSideSheet,
//   }))
// }

export const toggleImageDeleteModal = (image) => (dispatch, getState)=>{
  console.log('cccc')
  dispatch(toggleModal({
    showModal: !getState().image.showModal,
    selectedImage: image ? image : {}
  }))
}