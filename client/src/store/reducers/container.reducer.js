export default (state = null, action) => {

  switch (action.type) {

    case 'GET_CONTAINERS':
      return {
        ...state,
        ...action.payload
      }

    default:
      return state

  }
}