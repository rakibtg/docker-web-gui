import React from 'react'
import { Pane, Pre, SideSheet, Heading, Paragraph } from 'evergreen-ui'

class LogSideSheet extends React.PureComponent {

  render() {
    const { isShowingSideSheet, logData, resetLogSideSheet } = this.props
    return <SideSheet
                width={1000}
                isShown={isShowingSideSheet}
                onCloseComplete={resetLogSideSheet}
                containerProps={{
                display: 'flex',
                flex: '1',
                flexDirection: 'column',
                }}
            >
                <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
                {logData && logData.container && 
                    <Pane padding={16}>
                        <Heading size={600}>Container logs</Heading>                  
                        <Paragraph size={400}>
                            {`Container Name: ${logData.container.Name}`}
                        </Paragraph>
                    </Pane>
                 }
                 { !logData.container && 
                    <Pane padding={16}>
                        <Heading size={600}>Prune response</Heading>                  
                    </Pane>
                 }
                </Pane>
                <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
                    <Pane>
                      {logData && <Pre marginTop={0}>{logData.data}</Pre>}
                    </Pane>
                </Pane>
            </SideSheet>
  }
}

export default  LogSideSheet 