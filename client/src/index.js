import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import {createStore, applyMiddleware} from 'redux'
import {Provider} from 'react-redux'
import reducers from './reducers'
import Routes from './routes'


const store = createStore(reducers)

const app = (
   <Provider store={store}>
      <Routes/>
   </Provider>
)
ReactDOM.render(app, document.getElementById('root'));
