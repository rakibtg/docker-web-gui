import React from 'react'
import { Pane, Button, Heading, Badge } from 'evergreen-ui'
import './style/card.css'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { genericContainer, getLog, toggleDeleteModal } from '../../store/actions/container.action'

import ContainerSwitch from './switch'
import ContainerSelector from './selector'
import ContainerRestart from './restartButton'
import ContainerStat from './stat'
import CreatedAt from '../createdAt'

class ContainerCard extends React.PureComponent {

  actionButtons (active) {
    const { container, showNewGroupForm, toggleDeleteModal, getLog } = this.props
    if(!showNewGroupForm) {
      if(active) {
        return <Pane display="flex" marginTop={12} marginLeft={46}>
          <ContainerRestart container={container} />
          <Button marginRight={5} 
            height={22} 
            iconBefore="application"
            onClick={()=>{
              getLog(container)
            }}>Log</Button>
          <Button marginRight={5} 
            height={22} 
            iconBefore="trash" 
            disabled={container.State.Running}
            onClick={() => {
              toggleDeleteModal(container)
            }}>
            Delete
          </Button>
        </Pane>
      } else {
        return null
      }
    }
  }

  renderStats (container) {
    const { showNewGroupForm } = this.props
    if(!showNewGroupForm) {
      if(container.State.Running) {
        return <ContainerStat containerID={container.shortId} />
      }
    }
  }

  renderInfo (container) {
    const { showStatsInNewLine } = this.props
    const marginLeft = !!showStatsInNewLine ? 35:0
    const marginTop = !!showStatsInNewLine ? 5:0
    return <Pane display="flex" marginLeft={marginLeft} marginTop={marginTop}>
      { this.renderStats(container) }
    </Pane>
  }

  render () {
    const { container, activeIndex, genericContainer, index, showNewGroupForm, noHoverStyle, showStatsInNewLine } = this.props
    const active = activeIndex == index
    let cardName = 'element-card'
    if(!noHoverStyle) {
      if(active) {
        cardName += ' card-active'
      }
    }
    const showColumn = !!showStatsInNewLine ? 'column':'row'
      return <Pane 
            display="flex" 
            flexDirection="column" 
            flexGrow={1}
            padding={12}
            borderRadius={6}
            border="default"
            className={cardName}
            onMouseEnter={() => genericContainer({
              activeIndex: index
            })}>
        <Pane display="flex" flexDirection={showColumn}>
          <Pane display="flex" alignItems="flex-start">
            {
              showNewGroupForm
                ? <ContainerSelector container={container} />
                : <ContainerSwitch container={container} />
            }
            <Heading size={400}>{container.Name}</Heading>
            <Badge 
              backgroundColor="#e7e9ef" 
              fontWeight="bold" 
              borderRadius={16} 
              paddingLeft={10} 
              fontSize={11} 
              paddingRight={10} 
              marginLeft={10} 
              marginTop={3}>{container.shortId}
            </Badge>
            <CreatedAt time={container.Created} />
          </Pane>
          { this.renderInfo(container) }
        </Pane>
        { this.actionButtons(active) }
    </Pane>
  }
}

const mapStateToProps = state => {
  return {
    activeIndex: state.container.activeIndex,
    showNewGroupForm: state.groups.showNewGroupForm,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    genericContainer,
    getLog,
    toggleDeleteModal
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainerCard )