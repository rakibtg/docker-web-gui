import { combineReducers } from 'redux'
import container from './container.reducer'
import stats from './stats.reducer'

const appReducer = combineReducers({
  stats,
  container,
})

export default (state, action) => {
  return appReducer(state, action)
}