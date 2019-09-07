import React from 'react'
import { Switch } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { toggleContainer } from '../../store/actions/container.action'

class ContainerSwitch extends React.PureComponent {
  render () {
    const { container, toggleContainer } = this.props
    const command = container.State.Running
      ? 'stop'
      : 'start'
    const disabled = !!container.stateToggling
    return <Switch 
      marginRight={10} 
      height={18} 
      marginTop={2}
      checked={container.State.Running} 
      disabled={disabled}
      onChange={() => {
        toggleContainer(container, command)
      }}
    />
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    toggleContainer
  },
  dispatch
)

export default connect(null, mapDispatchToProps)( ContainerSwitch )