import { combineReducers } from 'redux'
import container from './container.reducer'

const appReducer = combineReducers({
  container,
})

export default (state, action) => {
  return appReducer(state, action)
}