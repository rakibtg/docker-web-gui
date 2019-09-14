export default (state = null, action) => {

  switch (action.type) {

    case 'GENERIC_STATS':
      return {
        ...state,
        ...action.payload
      }
      
    default:
      return state

  }
}