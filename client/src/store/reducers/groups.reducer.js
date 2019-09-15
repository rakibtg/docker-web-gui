export default (state = null, action) => {

  switch (action.type) {

    case 'GENERIC_GROUPS':
      return {
        ...state,
        ...action.payload
      }
      
    default:
      return state

  }
}