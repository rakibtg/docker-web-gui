import React from 'react'
import { Pane, Heading } from 'evergreen-ui'

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
    if(groups.length > 0) {
      return groups.map((group, index) => {
        return <GroupCard 
          key={index}
          group={group}
        />
      })
    } else {
      return <div>
        <Heading size={600} marginTop={30}>No group was found</Heading>
      </div>
    }
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