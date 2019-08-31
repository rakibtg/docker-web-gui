import React from 'react'
import { Pane, Button, Heading, Badge, Switch } from 'evergreen-ui'
import './ElementCard.css'

class ContainerList extends React.PureComponent {

    state = {
        active: false,
    }

    handleHover (active) {
        this.setState({ active })
    }

    render () {
        const { active } = this.state
        return <Pane 
                display="flex" 
                flexDirection="column" 
                flexGrow={1}
                padding={12}
                borderRadius={6}
                border="default"
                className="element-card"
                onMouseEnter={() => this.handleHover(true)}
                onMouseLeave={() => this.handleHover(false)}>
            <Pane display="flex">
                <Pane display="flex" justifyContent="center" alignItems="center">
                    <Switch marginRight={10} height={18} marginTop={2}/> 
                    <Heading size={500}>Container name</Heading>
                </Pane>
                <Badge backgroundColor="#e7e9ef" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>3da3ad7b90e3</Badge>
                <Badge backgroundColor="#deebf7" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>cpu 0.5%</Badge>
                <Badge backgroundColor="#ebe7f8" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>ram 423.3 mb</Badge>
            </Pane>
            { active && 
                <Pane display="flex" marginTop={12} marginLeft={46}>
                    <Button marginRight={5} height={22} iconBefore="refresh">Restart</Button>
                    <Button marginRight={5} height={22} iconBefore="application">Log</Button>
                    <Button marginRight={5} height={22} iconBefore="trash">Delete</Button>
                </Pane>
            }
        </Pane>
    }
}

export default ContainerList