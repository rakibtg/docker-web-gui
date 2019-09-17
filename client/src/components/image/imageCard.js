import React from 'react'
import { Pane, Button, Heading, Badge } from 'evergreen-ui'
import '../../components/container/style/card.css'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { genericImage} from '../../store/actions/image.action'

class ImageCard extends React.PureComponent {

  render () {
    const { image, activeIndex, genericImage, index } = this.props
    const active = activeIndex == index
   return <Pane 
            display="flex" 
            flexDirection="column" 
            flexGrow={1}
            padding={12}
            borderRadius={6}
            border="default"
            className={active ? "element-card card-active" : "element-card"}
            onMouseEnter={() => genericImage({
            activeIndex: index
            })}>
            <Pane display="flex">
               <Pane display="flex" justifyContent="center" alignItems="center">
                  {/* <ContainerSwitch container={container} /> */}
                  <Heading size={400}>{image.ID}</Heading>
               </Pane>
               <Badge backgroundColor="#e7e9ef" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>{image.Repository !== '<none>' ? image.Repository : "No Repository"}</Badge>
               <Badge backgroundColor="#d4eee3" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>{image.Size}</Badge>
               <Badge backgroundColor="#deebf7" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>{image.CreatedSince}</Badge>
            </Pane>
            { active && 
               <Pane display="flex" marginTop={12}>
                  <Button marginRight={5} 
                        height={22} 
                        iconBefore="application"
                       >Run</Button>
                  <Button marginRight={5} 
                        height={22} 
                        iconBefore="trash" 
                        >
                        Delete
                  </Button>
               </Pane>
            }
         </Pane>
  }
}

const mapStateToProps = state => {
  return {
    activeIndex: state.image.activeIndex,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    genericImage
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ImageCard )