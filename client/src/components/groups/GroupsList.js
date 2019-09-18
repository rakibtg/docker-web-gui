import React from 'react'
import { Pane } from 'evergreen-ui'

import GroupCard from './GroupCard'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { getGroups } from '../../store/actions/groups.action'

class GroupsList extends React.PureComponent {

  componentDidMount () {
    const { getGroups } = this.props
    getGroups()
  }

  renderGroupsList () {
    const { groups } = this.props
    return groups.map((group, index) => {
      return <GroupCard 
        key={index}
        group={group}
      />
    })
  }

  render () {
    return <Pane 
    display="flex" 
    flexDirection="column" 
    justifyContent="center" 
    alignItems="center"
    marginTop={20}>
      {this.renderGroupsList()}
    </Pane>
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