import React from 'react'
import { Button, Dialog, Heading, Badge } from 'evergreen-ui'
import ReactDOM from 'react-dom'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { deleteGroup } from '../../store/actions/groups.action'

class GroupDeleteButton extends React.PureComponent {

  state = {
    deleteModal: false,
  }

  renderDeleteModal () {
    const { groupName, groupId, deleteGroup } = this.props
    if(this.state.deleteModal) {
      return ReactDOM.createPortal(
        <Dialog
          isShown={this.state.deleteModal}
          title="Confirmation"
          hasHeader={false}
          intent="danger"
          onConfirm={() => {
            deleteGroup(groupId)
            this.setState({
              deleteModal: false,
            })
          }}
          onCloseComplete={() => this.setState({ deleteModal: false })}
          confirmLabel="Confirm"
        >
          <Heading size={500} marginTop="default" marginBottom="default">
            Are you sure you want to delete <Badge color="neutral">{groupName}</Badge> container group?
          </Heading>
        </Dialog>,
        document.body
      )
    } else {
      return null
    }
  }

  render () {
    return <>
      <Button marginRight={5} 
        height={22} 
        iconBefore="trash"
        onClick={() => {
          this.setState({
            deleteModal: !this.state.deleteModal
          })
        }}>
        Delete Group
      </Button>
      {this.renderDeleteModal()}
    </>
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    deleteGroup,
  },
  dispatch
)

export default connect(null, mapDispatchToProps)( GroupDeleteButton )