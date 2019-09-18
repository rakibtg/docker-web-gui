import React from 'react'

import { bindActionCreators } from 'redux'

import CleanUpNavBar from '../components/cleanup/cleanupSubNav'
import CleanUpInfo from '../components/cleanup/cleanUpInfo'
import { resetLogSideSheet } from '../store/actions/cleanUp.action'
import LogSideSheet from '../components/LogSideSheet'

import { connect } from 'react-redux'

class CleanUpPage extends React.PureComponent {
  render () {
    const { resetLogSideSheet, isShowingSideSheet, logData } = this.props
    return <>
      <LogSideSheet resetLogSideSheet={resetLogSideSheet} isShowingSideSheet={isShowingSideSheet} logData={logData} />
      <CleanUpNavBar />
      <CleanUpInfo/>
    </>
  }

}

const mapStateToProps = state => {
  return {
    isShowingSideSheet: state.cleanup.isShowingSideSheet,
    logData: state.cleanup.responseData
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    resetLogSideSheet
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( CleanUpPage )