import React from 'react'
import { Pane } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getContainers, toggleDeleteModal } from '../../store/actions/container.action'

import ContainerCard from './card'
import LogSideSheet from '../LogSideSheet'
import Modal from './deleteModal'

class ContainersList extends React.PureComponent {

  componentDidMount () {
    this.props.getContainers(this.props.segment)
  }

  render () {
    const { containers, showModal, selectedContainer, toggleDeleteModal} = this.props
    return <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
      <LogSideSheet />
      { showModal && <Modal container={selectedContainer} toggleModal={toggleDeleteModal} />} 
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
    showModal: state.container.showModal,
    selectedContainer: state.container.selectedContainer
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getContainers,
    toggleDeleteModal
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainersList )