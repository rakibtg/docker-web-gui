import React from 'react'
import { Pane, Spinner, SegmentedControl, Button } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { getContainers } from '../store/actions/container.action'
import { genericGroups } from '../store/actions/groups.action'

import NewGroupForm from './NewGroupForm'

class SecondaryNavBar extends React.PureComponent {

  render() {
    const { 
      segment, 
      loading, 
      getContainers, 
      genericGroups, 
      showGroupsPage,
    } = this.props
    return <Pane 
      backgroundColor="#f1f1f1" 
      display="flex" 
      justifyContent="center"
      padding={10}>
      <Button 
        marginRight={12} 
        iconBefore={showGroupsPage ? 'chevron-left' : 'tag'}
        paddingLeft={35}
        paddingRight={30}
        height={26}
        onClick={() => {
          genericGroups({ showGroupsPage: !showGroupsPage })
        }}>
          {showGroupsPage ? 'Back' : 'Groups'}
      </Button>
      {
        showGroupsPage 
          ? <NewGroupForm />
          : <SegmentedControl
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
    </Pane>
  }
}

const mapStateToProps = state => {
  return {
    segment: state.container.segment,
    loading: state.container.loading,
    showGroupsPage: state.groups.showGroupsPage,
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