import React from 'react'
import ContainerListItem from './ContainerListItem'
import { Pane, Button, Text, Heading, Icon, Badge, Switch } from 'evergreen-ui'

const DockerContainer = () => {
    return (
        <Pane padding={20}>
            <Heading size={600}>Containers</Heading>
        {['1', '2', '3', '4'].map(intent => {
            return (
              <ContainerListItem/>
            )
          })}
        </Pane>
    );
};

export default DockerContainer;