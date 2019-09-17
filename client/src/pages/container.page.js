import React from 'react'

import SecondaryNavBar from '../components/SecondaryNavBar'
import ContainerLists from '../components/container/lists'
import GroupsList from '../components/GroupsList'

import { connect } from 'react-redux'

import {containerStatsProcess} from '../store/actions/stats.action'

import {store} from '../store'

class ContainerPage extends React.PureComponent {

  componentDidMount () {
    // store.dispatch(containerStatsProcess())
  }

  render () {
    const { showGroupsPage } = this.props
    return <>
      <SecondaryNavBar />
      {
        showGroupsPage
          ? <GroupsList />
          : <ContainerLists />
      }
    </>
  }

}

const mapStateToProps = state => {
  return {
    showGroupsPage: state.groups.showGroupsPage,
  }
}

export default connect(mapStateToProps, null)( ContainerPage )