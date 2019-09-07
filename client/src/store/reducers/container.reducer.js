export default (state = null, action) => {

  switch (action.type) {

    case 'GENERIC_CONTAINER':
      return {
        ...state,
        ...action.payload
      }

    default:
      return state

  }
}