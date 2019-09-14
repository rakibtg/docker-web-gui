import React from 'react'
import { Badge } from 'evergreen-ui'

class ContainerStat extends React.PureComponent {
  render () {
    return <>
      <Badge backgroundColor="#deebf7" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>cpu 0.5%</Badge>
      <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>ram 423.3 mb</Badge>
    </>
  }
}

export default ContainerStat