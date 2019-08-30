import React from 'react';
import {Link} from 'react-router-dom';
import { Pane, Button, Text, Heading, Icon } from 'evergreen-ui'
import DockerContainer from './DockerContainer'
import DockerImage from './DockerImage'
import Stats from './Stats'


const NavBar = () => {
    return (
    <Pane display="flex" padding={16} background="#14B5D0" borderRadius={3} paddingLeft={20} paddingRight={20}>
      <Pane flex={1} alignItems="center" display="flex">
      <Icon icon="dashboard" color="#F9F9FB" marginRight={16} />
      </Pane>
      <Pane color="white">
        <Link to='/' style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'white' }}>Containers</Link>&nbsp;|&nbsp; 
        <Link to='/images' style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'white' }}>Images</Link> &nbsp;| &nbsp;
      < Link to='/stats' style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'white' }}>Stats</Link>
      </Pane>
    </Pane>
    );
};

export default NavBar;