import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import './style/card.css'
import { Pane, Button, Heading, Badge, Switch, Icon } from 'evergreen-ui'

const modalRoot = document.getElementById('modal-root')


class Modal extends Component {
    constructor(props) {
        super(props);
        this.el = document.createElement('div');
        //this.handleSubmit = this.handleSubmit.bind(this)
    }


    componentDidMount() {
        modalRoot.appendChild(this.el);
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el);
    }

    handleSubmit(event) {
        event.preventDefault()
        this.props.setAuthenticated(event)
    }
    render() {
        return ReactDOM.createPortal(
            <div className="modal" id="deleteModal">
                {/* <div className="modal-content">
                  <span className="close">&times;</span>
                  <p>Some text in the Modal..</p>
               </div> */}
               <Pane 
                  display="flex" 
                  flexDirection="column" 
                  flexGrow={1}
                  padding={12}
                  borderRadius={6}
                  border="default"
                  className="modal-pane"
                  >
                     <Pane display="flex">
                        <Pane flex={1} display="flex">
                           <Heading size={400}>Are you sure to delete this container?</Heading>
                        </Pane>
                        <Pane>
                           <Icon icon='cross'/>
                        </Pane>
                     </Pane>
                     <Pane display="flex" alignItems="center" justifyContent="center">
                        <Heading size={600}>Container Name</Heading>
                     </Pane>
                     <Pane display="flex" marginTop={10}>
                        <Pane flex={1} alignItems="center" display="flex">
                        </Pane>
                        <Pane>
                           <Button marginRight={10} height={22} 
                                 >Cancel</Button>
                           <Button  
                                 height={22} 
                                 iconBefore="trash" 
                                 >
                                 Delete
                           </Button>
                        </Pane>
                     </Pane>
               </Pane>
            </div>,
            this.el,
        );
    }
}

export default Modal