import React from 'react'
import { Switch } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { groupStatusUpdater } from '../../store/actions/groups.action'
import { toggleContainer } from '../../store/actions/container.action'

class GroupSwitch extends React.PureComponent {

  init () {
    const { containers, groupIndex, groupStatusUpdater } = this.props
    const runningContainers = containers.filter(c => c.State.Running === true)
    const add = containers.length === runningContainers.length
    groupStatusUpdater('groupsRunning', groupIndex, add)
  }

  render () {
    // const { container, toggleContainer } = this.props
    // const command = container.State.Running
    //   ? 'stop'
    //   : 'start'
    // const disabled = !!container.stateToggling
    this.init()
    const disabled = true
    return <Switch 
      marginRight={10} 
      height={22} 
      marginTop={2}
      // checked={container.State.Running} 
      // disabled={disabled}
      onChange={() => {
        // toggleContainer(container, command)
      }}
    />
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    toggleContainer,
    groupStatusUpdater,
  },
  dispatch
)

export default connect(null, mapDispatchToProps)( GroupSwitch )