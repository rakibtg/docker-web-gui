import React from 'react'

import CleanUpNavBar from '../components/cleanup/cleanupSubNav'

import { connect } from 'react-redux'

class CleanUpPage extends React.PureComponent {
  render () {
    return <>
      <CleanUpNavBar />
    </>
  }

}

const mapStateToProps = state => {
    return {
      
    }
  }

export default connect(mapStateToProps, null)( CleanUpPage )