import React from 'react'
import { Pane, Button, Heading, Badge } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { genericGroups } from '../../store/actions/groups.action'

import ContainerCard from '../container/card'

class GroupCard extends React.PureComponent {

  filterContainers () {
    const { group, containers } = this.props
    const groupContainers = JSON.parse(group.containers_id)
    const filteredContainers = containers.filter(container => groupContainers.includes(container.shortId))
    return filteredContainers
  }

  render () {
    const { group, genericGroups, index, activeIndex } = this.props
    const containers = this.filterContainers()
    const active = activeIndex == index
      return <Pane 
        display="flex" 
        flexDirection="column" 
        flexGrow={1}
        padding={12}
        borderRadius={6}
        marginBottom={16}
        border="default"
        className="element-card card-active"
        onMouseEnter={() => genericGroups({
          activeIndex: index
        })}
        >
          <Pane display="flex" alignItems="center">
            <Pane display="flex" justifyContent="center" alignItems="center">
              <Heading size={600}>{group.name}</Heading>
            </Pane>
            {/* <Badge backgroundColor="#e7e9ef" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>{container.shortId}</Badge> */}
          </Pane>
          {
            active && <Pane marginLeft={30} marginTop={10}>
              <Heading size={400} marginLeft={14} marginTop={10}>All Containers</Heading>
              {
                containers.map((container, index) => {
                  return <ContainerCard
                    key={index} 
                    index={index} 
                    container={container}
                    noHoverStyle 
                  />
                })
              }
            </Pane>
          }

    </Pane>
  }

}

const mapStateToProps = state => {
  return {
    containers: state.container.containers,
    activeIndex: state.groups.activeIndex,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    genericGroups,
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( GroupCard )