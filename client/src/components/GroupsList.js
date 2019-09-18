import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { getGroups } from '../store/actions/groups.action'

class GroupsList extends React.PureComponent {

  componentDidMount () {
    const { getGroups } = this.props
    getGroups()
  }

  render () {
    return <div>
      Groups List
    </div>
  }
}

const mapStateToProps = state => {
  return {
    groups: state.groups.groups,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getGroups
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( GroupsList )