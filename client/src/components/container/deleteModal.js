import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import './style/modal.css'
import { Pane, Button, Heading, Icon } from 'evergreen-ui'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { deleteContainer } from '../../store/actions/container.action'
import { deleteImage } from '../../store/actions/image.action'

const modalRoot = document.getElementById('modal-root')


class Modal extends Component {
    constructor(props) {
        super(props);
        this.el = document.createElement('div');
        this.handleDelete = this.handleDelete.bind(this)
    }

    componentDidMount() {
        modalRoot.appendChild(this.el);
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el);
    }

    handleDelete(){
       if(this.props.container){
         this.props.deleteContainer(this.props.container, 'rm')
       } else {
          console.log('else')
         this.props.deleteImage(this.props.image, 'rm')
       }
    }

    render() {
      const { container, image } = this.props
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
                        <Pane flex={1} display="flex" justifyContent="center" alignItems="center">
                           <Heading size={400}>{`Are you sure to delete this ${container ? 'container' : 'image'}?`}</Heading>
                        </Pane>
                        <Pane>
                           <Icon icon='cross' className='modal-close'
                           onClick={this.props.toggleModal}/>
                        </Pane>
                     </Pane>
                     <Pane display="flex" alignItems="center" justifyContent="center">
                        <Heading size={600}>{container ? container.Name : image.ID}</Heading>
                     </Pane>
                     <Pane display="flex" marginTop={10} justifyContent="center" alignItems="center">
                        <Pane>
                           <Button marginRight={10} height={22} onClick={this.props.toggleModal}>Cancel</Button>
                           <Button  height={22} iconBefore="trash" onClick={ this.handleDelete }>Delete</Button>
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
      deleteContainer,
      deleteImage
   },
   dispatch
 )

export default connect(null, mapDispatchToProps)(Modal)