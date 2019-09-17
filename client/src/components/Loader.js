import React from 'react'
import { Pane, Button, Heading, Badge, Spinner } from 'evergreen-ui'
import '../components/container/style/card.css'
const Loader = (props) => {
    return (
      <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
         <Heading>Loading images. Please wait....</Heading>
         <Spinner marginX="auto" marginY={120}/>
      </Pane>
    )
};

export default Loader