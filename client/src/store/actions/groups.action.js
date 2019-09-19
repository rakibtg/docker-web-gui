import { store } from '../'
import { request } from '../../utilities/request'

export const genericGroups = payload => ({
  type: 'GENERIC_GROUPS',
  payload
})

export const groupItemSelector = itemID => {
  return dispatch => {
    const selectedItems = store.getState().groups.selectedItems
    if(selectedItems.includes(itemID)) {
      // Remove item.
      const modifiedListOfItems = selectedItems.filter(value => value != itemID)
      dispatch(genericGroups({
        selectedItems: modifiedListOfItems,
      }))
    } else {
      // Add item.
      const items = [
        ...selectedItems,
        itemID
      ]
      dispatch(genericGroups({
        selectedItems: items
      }))
    }
  }
}

export const groupStatusUpdater = (groupSchemaProperty, groupIndex, add) => {
  return dispatch => {
    const items = store.getState().groups[groupSchemaProperty]
    // if(items.includes(groupIndex)) {
    if(add) {
      // Remove the group index.
      const newItems = items.filter(value => value != groupIndex)
      dispatch(genericGroups({
        [groupSchemaProperty]: newItems
      }))
    } else {
      // Add the group index.
      const newItems = [
        ...items,
        groupIndex
      ]
      dispatch(genericGroups({
        [groupSchemaProperty]: newItems
      }))
    }
  }
}

export const createGroup = data => {
  return dispatch => {
    dispatch(genericGroups({ createFormLoading: true }))
    request('post', 'groups', {name: data.newGroupName, containers: data.selectedItems})
      .then(res => {
        setTimeout(() => {
          dispatch(genericGroups({ 
            newGroupName: '',
            selectedItems: [],
            showGroupsPage: true,
            showNewGroupForm: false,
            createFormLoading: false,
          }))
        }, 1200)
      })
  }
}

export const getGroups = () => {
  return dispatch => {
    dispatch(genericGroups({
      groupListLoading: true,
    }))
    request('get', 'groups', {})
      .then(res => {
        dispatch(genericGroups({
          groups: res.data,
          groupListLoading: false,
        }))
      })
  }
}