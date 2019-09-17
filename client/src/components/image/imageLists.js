import React from 'react'
import { Pane } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getImages } from '../../store/actions/image.action'

import ImageCard from './imageCard'

class ImageList extends React.PureComponent {

  componentDidMount () {
    this.props.getImages()
  }

  render () {
    const { images, showModal, selectedImage} = this.props
    return <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
      {/* <LogSideSheet />
      { showModal && <Modal container={selectedImage} />}  */}
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
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getImages
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ImageList )