import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import './style/modal.css'
import { Pane, Button, Heading, Icon } from 'evergreen-ui'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { toggleDeleteModal, deleteContainer } from '../../store/actions/container.action'

const modalRoot = document.getElementById('modal-root')


class Modal extends Component {
    constructor(props) {
        super(props);
        this.el = document.createElement('div');
    }

    componentDidMount() {
        modalRoot.appendChild(this.el);
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el);
    }

    render() {
      const { container, toggleDeleteModal, deleteContainer} = this.props
        return ReactDOM.createPortal(
            <div className="modal" id="deleteModal">
               <Pane 
                  display="flex" 
                  flexDirection="column" 
                  flexGrow={1}
                  padding={12}
                  borderRadius={6}
                  border="default"
                  className="modal-pane">
                     <Pane display="flex">
                        <Pane flex={1} display="flex">
                           <Heading size={400}>Are you sure to delete this container?</Heading>
                        </Pane>
                        <Pane>
                           <Icon icon='cross' className='modal-close'
                           onClick={()=>{
                                 toggleDeleteModal()
                           }}/>
                        </Pane>
                     </Pane>
                     <Pane display="flex" alignItems="center" justifyContent="center">
                        <Heading size={600}>{container.Name}</Heading>
                     </Pane>
                     <Pane display="flex" marginTop={10}>
                        <Pane flex={1} alignItems="center" display="flex">
                        </Pane>
                        <Pane>
                           <Button marginRight={10} height={22} onClick={()=>{toggleDeleteModal()}}>Cancel</Button>
                           <Button  height={22} iconBefore="trash" onClick={()=>{deleteContainer(container, 'rm')}}>Delete</Button>
                        </Pane>
                     </Pane>
               </Pane>
            </div>,
            this.el,
        );
    }
}
 
const mapDispatchToProps = dispatch => bindActionCreators(
   {
      toggleDeleteModal,
      deleteContainer
   },
   dispatch
 )

export default connect(null, mapDispatchToProps)(Modal)