import React from 'react'

import SecondaryNavBar from '../components/SecondaryNavBar'
import ContainerLists from '../components/container/lists'

import {containerStatsProcess} from '../store/actions/stats.action'

import {store} from '../store'

class ContainerPage extends React.PureComponent {

  componentDidMount () {
    store.dispatch(containerStatsProcess())
  }

  render () {
    return <>
      <SecondaryNavBar />
      <ContainerLists />
    </>
  }

}

export default ContainerPage