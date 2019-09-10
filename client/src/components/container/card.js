import React from 'react'
import { Pane, Button, Heading, Badge, Switch } from 'evergreen-ui'
import './style/card.css'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { genericContainer, deleteContainer } from '../../store/actions/container.action'

import ContainerSwitch from './switch'
import ContainerRestart from './restartButton'

class ContainerCard extends React.PureComponent {

  render () {
    const { container, activeIndex, genericContainer, index } = this.props
    const active = activeIndex == index
      return <Pane 
            display="flex" 
            flexDirection="column" 
            flexGrow={1}
            padding={12}
            borderRadius={6}
            border="default"
            className={active ? "element-card card-active" : "element-card"}
            onMouseEnter={() => genericContainer({
              activeIndex: index
            })}>
        <Pane display="flex">
          <Pane display="flex" justifyContent="center" alignItems="center">
            <ContainerSwitch container={container} />
            <Heading size={400}>{container.Name}</Heading>
          </Pane>
          <Badge backgroundColor="#e7e9ef" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>{container.shortId}</Badge>
          <Badge backgroundColor="#d4eee3" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>nov 6</Badge>
          {
            container.State.Running && <>
              <Badge backgroundColor="#deebf7" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>cpu 0.5%</Badge>
              <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>ram 423.3 mb</Badge>
            </>
          }
        </Pane>
        { active && 
          <Pane display="flex" marginTop={12} marginLeft={46}>
            <ContainerRestart container={container} />
            <Button marginRight={5} height={22} iconBefore="application">Log</Button>
            <Button marginRight={5} 
                    height={22} 
                    iconBefore="trash" 
                    onClick={() => {
                      deleteContainer(container)
                    }}>
                    Delete
            </Button>
          </Pane>
        }
    </Pane>
  }
}

const mapStateToProps = state => {
  return {
    activeIndex: state.container.activeIndex
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    genericContainer
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( ContainerCard )