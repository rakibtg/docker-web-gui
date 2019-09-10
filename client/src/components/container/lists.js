import React from 'react'
import { Pane } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getContainers } from '../../store/actions/container.action'

import ContainerCard from './card'
import LogSideSheet from '../LogSideSheet'

class ContainersList extends React.PureComponent {

  componentDidMount () {
    this.props.getContainers('active')
  }

  render () {
    const { containers } = this.props
    return <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
      <LogSideSheet />
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
  return {containers: state.container.containers}
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getContainers
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainersList )