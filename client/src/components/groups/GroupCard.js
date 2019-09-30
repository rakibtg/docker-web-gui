import React from 'react'
import { Pane, Button, Heading, Badge } from 'evergreen-ui'
import './style/GroupCard.css'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { genericGroups } from '../../store/actions/groups.action'

import ContainerCard from '../container/card'
import GroupSwitch from '../groups/GroupSwitch'
import GroupDeleteButton from './GroupDeleteButton'

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
    if(containers.length <= 0) return null
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
        >
          <Pane display="flex" flexGrow={1} alignItems="center">
            <Pane display="flex" flexGrow={1} justifyContent="center" alignItems="center">
              <GroupSwitch 
                containers={containers} 
                groupIndex={index}/>
              <Heading 
                display="flex" 
                alignItems="center" 
                className="groupOptToggler"
                onClick={() => genericGroups({
                  activeIndex: index
                })}
                size={600}>{group.name} 
                <Badge
                  marginLeft={6}>{containers.length}</Badge>
              </Heading>
              <Pane display="flex" flexGrow={1} justifyContent="flex-end">
                <GroupDeleteButton groupName={group.name} groupId={group.id} />
              </Pane>
            </Pane>
          </Pane>
          {
            active && <Pane marginLeft={30} marginTop={10}>
              <Heading size={400} marginLeft={14} marginTop={10} color="#999">All Containers</Heading>
              {
                containers.map((container, index) => {
                  return <ContainerCard
                    key={index} 
                    index={index} 
                    container={container}
                    noHoverStyle 
                    showStatsInNewLine
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