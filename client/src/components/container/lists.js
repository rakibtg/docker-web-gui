import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { getContainers } from '../../store/actions/container.action'

class ContainersList extends React.PureComponent {

  componentDidMount () {
    console.log('containers:', this.props.containers)
  }

  render () {
    return <>
      hello...
    </>
  }

}

const mapStateToProps = state => {
  console.log('State:', state)
  return {containers: state.container}
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getContainers
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainersList )