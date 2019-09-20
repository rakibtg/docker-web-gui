import React from 'react'
import { Button } from 'evergreen-ui'

class GroupDeleteButton extends React.PureComponent {
  render () {
    return <Button marginRight={5} 
      height={22} 
      iconBefore="trash" 
      // disabled={container.State.Running}
      onClick={() => {
        // toggleDeleteModal(container)
      }}>
      Delete Group
    </Button>
  }
}

export default GroupDeleteButton