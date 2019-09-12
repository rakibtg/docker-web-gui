import React from 'react'
import { Pane, Spinner, Pre, SideSheet, Heading, Paragraph, Card } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { resetLogSideSheet } from '../store/actions/container.action'


class LogSideSheet extends React.PureComponent {

  render() {
    const { isShowingSideSheet, logData,resetLogSideSheet } = this.props
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
                <Pane padding={16}>
                    <Heading size={600}>Container logs</Heading>
                    {logData.container && 
                        <Paragraph size={400}>
                            {`Container Name: ${logData.container.Name}`}
                        </Paragraph>
                    }
                </Pane>
                </Pane>
                <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
                    <Pane>
                      {logData && <Pre marginTop={0}>{logData.data}</Pre>}
                    </Pane>
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

const mapDispatchToProps = dispatch => bindActionCreators(
    {
        resetLogSideSheet
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)( LogSideSheet )