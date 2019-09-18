import React from 'react'

import CleanUpNavBar from '../components/cleanup/cleanupSubNav'
import CleanUpInfo from '../components/cleanup/cleanUpInfo'

import { connect } from 'react-redux'

class CleanUpPage extends React.PureComponent {
  render () {
    return <>
      <CleanUpNavBar />
      <CleanUpInfo/>
    </>
  }

}

const mapStateToProps = state => {
    return {
      
    }
  }

export default connect(mapStateToProps, null)( CleanUpPage )