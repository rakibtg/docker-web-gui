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

export const toggleModal = payload => ({
  type: 'TOGGLE_IMAGE_MODAL',
  payload
})

export const getImages = () => {
  return dispatch => {
    dispatch(genericImage({
      loading: true,
      pageError: false,
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
        dispatch(runImage({
          imageId: image.ID,
          data: { stateToggling: false },
        }))
        toaster.success(`Image ${image.ID} has been started running.`,{ duration: 5 })
      })
      .catch( ex => {
        dispatch(runImage({
          imageId: image.ID,
          data: { stateToggling: false },
        }))
        toaster.warning(`There is problem running image ${image.ID}`,{duration: 5})
      })
  }
}


export const deleteImage = (image, command) => (dispatch, getState)=>{
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
        dispatch(removeImage({
          showModal: !getState().image.showModal,
          selectedImage: {}
        }))
        toaster.danger(
          `Image ${image.ID} can not be deleted! May be used by some containers.`,
          {
            duration: 5
          },
        )
      })
}

export const toggleImageDeleteModal = (image) => (dispatch, getState)=>{
  dispatch(toggleModal({
    showModal: !getState().image.showModal,
    selectedImage: image ? image : {}
  }))
}