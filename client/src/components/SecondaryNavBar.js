import React from 'react'
import { Pane, Spinner, SegmentedControl, Button } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { getContainers } from '../store/actions/container.action'
import { genericGroups } from '../store/actions/groups.action'

import NewGroupForm from './groups/NewGroupForm'

class SecondaryNavBar extends React.PureComponent {

  containerFilters () {
    const { loading, segment, getContainers } = this.props
    return <SegmentedControl
      width={400}
      height={26}
      options={[
        { label: loading === 'all' ? <Spinner size={16} /> : 'All', value: 'all' },
        { label: loading === 'active' ? <Spinner size={16} /> : 'Active', value: 'active' },
        { label: loading === 'stopped' ? <Spinner size={16} /> : 'Stopped', value: 'stopped' }
      ]}
      value={segment}
      onChange={value => {
        getContainers(value)
      }}
    />
  }

  newGroupButton () {
    const { showNewGroupForm, genericGroups, getContainers } = this.props
    return <Button 
      marginRight={12} 
      iconBefore='add'
      paddingLeft={35}
      paddingRight={30}
      height={26}
      onClick={() => {
        const groupForm = !showNewGroupForm
        genericGroups({
          showGroupsPage: false,
          showNewGroupForm: groupForm,
        })
        if(groupForm) {
          getContainers('all')
        }
      }}>Create New Group</Button>
  }

  groupsToggler () {
    const { genericGroups, showGroupsPage, showNewGroupForm } = this.props
    const isBack = showGroupsPage || showNewGroupForm
    return <Button 
      marginRight={12} 
      iconBefore={isBack ? 'chevron-left' : 'tag'}
      paddingLeft={35}
      paddingRight={30}
      height={26}
      onClick={() => {
        genericGroups({ 
          showGroupsPage: !showGroupsPage,
          showNewGroupForm: false,
        })
      }}>
        {isBack ? 'Back' : 'Groups'}
    </Button>
  }

  renderBody () {
    const { showNewGroupForm, showGroupsPage } = this.props
    if(showNewGroupForm) {
      return <NewGroupForm />
    } else if (showGroupsPage) {
      return this.newGroupButton()
    } else {
      return this.containerFilters()
    }
  }

  render() {
    return <Pane 
      backgroundColor="#f1f1f1" 
      display="flex" 
      justifyContent="center"
      padding={10}>
        {this.groupsToggler()}
        {this.renderBody()}
      </Pane>
  }
}

const mapStateToProps = state => {
  return {
    segment: state.container.segment,
    loading: state.container.loading,
    showGroupsPage: state.groups.showGroupsPage,
    showNewGroupForm: state.groups.showNewGroupForm,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getContainers,
    genericGroups,
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( SecondaryNavBar )