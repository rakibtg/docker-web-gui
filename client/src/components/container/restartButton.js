import React from 'react'
import { Button } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { restartContainer } from '../../store/actions/container.action'

class ContainerRestartButton extends React.PureComponent {
  render () {
    const { container, restartContainer } = this.props
    const disabled = !!container.stateToggling
    return <Button 
      marginRight={5} 
      height={22} 
      iconBefore="refresh"
      disabled={disabled}
      onClick={() => {
        restartContainer(container, 'restart')
      }}
      >
        Restart
    </Button>
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    restartContainer
  },
  dispatch
)

export default connect(null, mapDispatchToProps)( ContainerRestartButton )