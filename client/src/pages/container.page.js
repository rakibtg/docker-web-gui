import React from 'react'
import { Pane } from 'evergreen-ui'

import SecondaryNavBar from '../components/SecondaryNavBar'
import ContainerLists from '../components/container/lists'

class ContainerPage extends React.PureComponent {

  render () {
    return <>
      <SecondaryNavBar />
      <ContainerLists />
    </>
  }

}

export default ContainerPage