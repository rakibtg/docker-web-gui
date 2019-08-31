import React from 'react'
import { Pane, Heading } from 'evergreen-ui'

import ContainerListItem from './ContainerListItem'
import SecondaryNavBar from './SecondaryNavBar'

const DockerContainer = () => {
    return (
        <Pane padding={20}>
            <Heading />
            <SecondaryNavBar />
            <Pane display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                {['1', '2', '3', '4'].map(i => {
                    return <ContainerListItem key={i}/>
                })}
            </Pane>
        </Pane>
    )
}

export default DockerContainer