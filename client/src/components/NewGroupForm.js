import React from 'react'
import { Pane, Button, TextInput } from 'evergreen-ui'

class NewGroupForm extends React.PureComponent {
  render () {
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
        >
          Create Group
        </Button>
    </Pane>
  }
}

export default NewGroupForm