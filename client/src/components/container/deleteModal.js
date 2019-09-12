import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import './style/card.css'

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
            <div  id="deleteModal">
                <div className="modal-content">
                  <span className="close">&times;</span>
                  <p>Some text in the Modal..</p>
               </div>
            </div>,
            this.el,
        );
    }
}

export default Modal