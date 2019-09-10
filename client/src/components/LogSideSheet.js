import React from 'react'
import { Pane, Spinner, SegmentedControl } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'


class SecondaryNavBar extends React.PureComponent {

  render() {
    const { isShowingSideSheet, logData } = this.props
    return <SideSheet
                isShown={state.isShowingSideSheet}
                onCloseComplete={() => setState({ isShowingSideSheet: false })}
                containerProps={{
                display: 'flex',
                flex: '1',
                flexDirection: 'column',
                }}
            >
                <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
                <Pane padding={16}>
                    <Heading size={600}>Title</Heading>
                    <Paragraph size={400}>
                    Optional description or sub title
                    </Paragraph>
                </Pane>
                </Pane>
                <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
                <Card
                    backgroundColor="white"
                    elevation={0}
                    height={240}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Heading>Some content</Heading>
                </Card>
                </Pane>
            </SideSheet>
  }
}

const mapStateToProps = state => {
  return {
    isShowingSideSheet,
    logData,
  }
}


export default connect(mapStateToProps, null)( SecondaryNavBar )