import React from 'react'
import { Pane, Button, Heading, Badge } from 'evergreen-ui'
import '../components/container/style/card.css'
const Loader = (props) => {
    return (
      <Pane 
      display="flex" 
      flexDirection="column" 
      justifyContent="center" 
      alignItems="center"
      marginTop={20}>
         <Pane 
            display="flex" 
            padding={12}
            borderRadius={6}
            justifyContent="center" 
            className={"element-card card-active"}
            >
            <Heading>Loading images. Please wait....</Heading>
         </Pane>
      </Pane>
    )
};

export default Loader