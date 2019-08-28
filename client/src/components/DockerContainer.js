import React from 'react'
import ContainerListItem from './ContainerListItem'
import { Pane, Heading, SearchInput } from 'evergreen-ui'

const DockerContainer = () => {
    return (
        <Pane padding={20}>
            <Heading size={600}>Containers</Heading>
            <SearchInput placeholder="search container" width="100%" marginBottom={10}/>
            {['1', '2', '3', '4'].map(i => {
                return (
                <ContainerListItem/>
                )
            })}
        </Pane>
    );
};

export default DockerContainer;