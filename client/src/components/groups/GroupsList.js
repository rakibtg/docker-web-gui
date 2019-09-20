import React from 'react'
import { Pane, Heading } from 'evergreen-ui'

import GroupCard from './GroupCard'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { getContainers } from '../../store/actions/container.action'
import { getGroups } from '../../store/actions/groups.action'

class GroupsList extends React.PureComponent {

  componentDidMount () {
    const { getGroups, getContainers } = this.props
    getGroups()
    getContainers('all')
  }

  renderGroupsList () {
    const { groups, groupListLoading, containerListLoading } = this.props
    if( groupListLoading && containerListLoading ) {
      return <Heading size={600}>Please wait</Heading>
    }
    if( groups.length <= 0 ) {
      return <Heading size={600}>No groups found, please create a new one.</Heading>
    }
    return groups.map((group, index) => {
      return <GroupCard 
        key={index}
        index={index}
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
    groupListLoading: state.groups.groupListLoading,
    containerListLoading: state.container.containerListLoading,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getGroups,
    getContainers,
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( GroupsList )