import React from 'react'
import { Pane } from 'evergreen-ui'

import SecondaryNavBar from '../components/SecondaryNavBar'

class ContainerPage extends React.PureComponent {

  render () {
    return <>
      <SecondaryNavBar />
      <Pane padding={20}>
        Mellos.
      </Pane>
    </>
  }

}

export default ContainerPage