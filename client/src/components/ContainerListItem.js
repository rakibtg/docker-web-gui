import React from 'react'
import { Pane, Button, Text, Heading, Icon, Badge, Switch } from 'evergreen-ui'

const ContainerListItem = () => {
    return (
        <Pane border="default" padding={10} marginBottom={10}>
           <Pane display="flex">
               <Heading size={500}>Container name</Heading>
               <Badge color="green" marginLeft={10} marginTop={3}>Success</Badge>
           </Pane>
           <Pane display="flex" marginTop={10}>
               <Switch marginRight={12} marginTop={2}/>
               <Button marginRight={12} height={20} iconBefore="edit" appearance="primary" intent='warning'>Edit</Button>
               <Button marginRight={12} height={20} iconBefore="delete" appearance="primary" intent='danger'>Delete</Button>
               <Button marginRight={12} height={20} iconBefore="application" appearance="primary" intent='none'>Log</Button>
           </Pane>
        </Pane>
    );
};

export default ContainerListItem;