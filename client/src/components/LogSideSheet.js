import React from 'react'
import { Pane, Spinner, SegmentedControl, SideSheet, Heading, Paragraph, Card } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'


class LogSideSheet extends React.PureComponent {

  render() {
    const { isShowingSideSheet, logData } = this.props
    return <SideSheet
                isShown={isShowingSideSheet}
                onCloseComplete={() => this.setState({ isShowingSideSheet: false })}
                containerProps={{
                display: 'flex',
                flex: '1',
                flexDirection: 'column',
                }}
            >
                <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
                <Pane padding={16}>
                    <Heading size={600}>Container logs</Heading>
                    {logData.container && 
                        <Paragraph size={400}>
                            {`${logData.container.Name}`}
                        </Paragraph>
                    }
                </Pane>
                </Pane>
                <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
                <Card
                    backgroundColor="white"
                    elevation={0}
                    height={240}
                    display="flex"
                    alignItems="left"
                    justifyContent="center"
                >
                    {logData && <Heading>{logData.data}</Heading>}
                </Card>
                </Pane>
            </SideSheet>
  }
}

const mapStateToProps = state => {
  return {
    isShowingSideSheet: state.container.isShowingSideSheet,
    logData: state.container.logData
  }
}


export default connect(mapStateToProps, null)( LogSideSheet )