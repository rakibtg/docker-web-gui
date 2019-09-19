import React from 'react'
import { Pane } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getImages, toggleImageDeleteModal } from '../../store/actions/image.action'

import ImageCard from './imageCard'
import Modal from '../container/deleteModal'
import Loader from '../Loader'

class ImageList extends React.PureComponent {

  componentDidMount () {
    this.props.getImages()
  }

  render () {
    const { images, showModal, selectedImage, toggleImageDeleteModal, loading } = this.props
    if(loading){
      return <Loader spinner={true}/>
    } else if(images.length == 0){
      return <Loader/>
    }
    return <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
      
      { showModal && <Modal image={selectedImage} toggleModal={toggleImageDeleteModal} />} 
        {
          images.map((image, index) => 
            <ImageCard 
              key={index} 
              index={index} 
              image={image} 
            />
          )
        }
    </Pane>
  }

}

const mapStateToProps = state => {
  return {
    images: state.image.images,
    showModal: state.image.showModal,
    selectedImage: state.image.selectedImage,
    loading: state.image.loading
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getImages,
    toggleImageDeleteModal
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ImageList )