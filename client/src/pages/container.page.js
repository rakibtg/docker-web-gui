import React from 'react'

import SecondaryNavBar from '../components/SecondaryNavBar'
import ContainerLists from '../components/container/lists'
import GroupsList from '../components/groups/GroupsList'

import {containerStatsProcess} from '../store/actions/stats.action'

import {store} from '../store'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { toggleDeleteModal, resetLogSideSheet } from '../store/actions/container.action'
import LogSideSheet from '../components/LogSideSheet'
import Modal from '../components/container/deleteModal'

class ContainerPage extends React.PureComponent {

  componentDidMount () {
    store.dispatch(containerStatsProcess())
  }

  render () {
    const { showGroupsPage,showModal, selectedContainer, toggleDeleteModal, 
      resetLogSideSheet, isShowingSideSheet, logData } = this.props
    return <>
      <SecondaryNavBar />
      <LogSideSheet resetLogSideSheet={resetLogSideSheet} isShowingSideSheet={isShowingSideSheet} logData={logData} />
      { showModal && <Modal container={selectedContainer} toggleModal={toggleDeleteModal} />} 
      <div className="subnavaware-view">
        {
          showGroupsPage
            ? <GroupsList />
            : <ContainerLists />
        }
      </div>
    </>
  }

}

const mapStateToProps = state => {
  return {
    showGroupsPage: state.groups.showGroupsPage,
    showModal: state.container.showModal,
    selectedContainer: state.container.selectedContainer,
    isShowingSideSheet: state.container.isShowingSideSheet,
    logData: state.container.logData
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    toggleDeleteModal,
    resetLogSideSheet
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainerPage )