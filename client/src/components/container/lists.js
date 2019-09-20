import React from 'react'
import { Pane } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getContainers, toggleDeleteModal, resetLogSideSheet } from '../../store/actions/container.action'

import ContainerCard from './card'

class ContainersList extends React.PureComponent {

  componentDidMount () {
    this.props.getContainers(this.props.segment)
  }

  render () {
    const { containers } = this.props
    return <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
      
        {
          containers.map((container, index) => 
            <ContainerCard 
              key={index} 
              index={index} 
              container={container} 
            />
          )
        }
    </Pane>
  }

}

const mapStateToProps = state => {
  return {
    segment: state.container.segment,
    containers: state.container.containers,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getContainers
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainersList )