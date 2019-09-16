import React from 'react'
import { Pane, Button, TextInput } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

class NewGroupForm extends React.PureComponent {
  render () {
    const { selectedItems } = this.props
    return <Pane 
      display='flex'
      justifyContent='center'
      alignItems='center'>
        <TextInput
          name="text-input-name"
          placeholder="New Group Name"
          height={26}
          display='flex'
          flexGrow={1}
        />
        <Button
          height={26}
          appearance="primary"
          marginLeft={12}
          intent="success"
          disabled={selectedItems.length <= 0}
        >
          Create Group
        </Button>
    </Pane>
  }
}

const mapStateToProps = state => {
  return {
    selectedItems: state.groups.selectedItems,
  }
}

// const mapDispatchToProps = dispatch => bindActionCreators(
//   {
//     groupItemSelector
//   },
//   dispatch
// )

export default connect(mapStateToProps, null)( NewGroupForm )