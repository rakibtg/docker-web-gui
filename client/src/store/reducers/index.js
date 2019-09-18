import { combineReducers } from 'redux'

import stats from './stats.reducer'
import groups from './groups.reducer'
import container from './container.reducer'
import image from './image.reducer'

const appReducer = combineReducers({
  stats,
  groups,
  container,
  image,
})

export default (state, action) => {
  return appReducer(state, action)
}