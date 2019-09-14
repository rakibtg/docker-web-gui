import React from 'react'
import { Badge } from 'evergreen-ui'
import { connect } from 'react-redux'


class ContainerStat extends React.PureComponent {
  
  getMemoryUsage(memory) {
    [memory] = memory.split('/')
    let memoryFormated = memory.replace(/[a-zA-Z]/g, '').trim()
    return Number(memoryFormated).toFixed(1) + 'mb'
  }

  renderBadges () {
    const { stats, containerID } = this.props
    const data = stats
      .find(n => n.id === containerID)
    return data 
      ? <>
        <Badge backgroundColor="#deebf7" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
          cpu {data.cpu_percentage}
        </Badge>
        <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
          ram {this.getMemoryUsage(data.memory_usage)}
        </Badge>
        <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
          net {this.getMemoryUsage(data.network_io)}
        </Badge>
      </>
      : null
  }

  render () {
    return this.renderBadges()
  }
}

const mapStateToProps = state => {
  return {
    stats: state.stats.containerStats
  }
}

export default connect(mapStateToProps, null)( ContainerStat )