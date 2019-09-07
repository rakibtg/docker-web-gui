import React from 'react'
import DockerImage from './components/DockerImage';
import Stats from './components/Stats';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import Navbar from './components/NavBar'

import ContainerPage from './pages/container.page'

const Routes = () => {
    return (
        <React.Fragment>
            <BrowserRouter>
               <Navbar/>
                <Switch>
                    <Route path="/" exact component={ContainerPage}/>
                    <Route path="/containers" exact component={ContainerPage}/>
                    <Route path="/images" component={DockerImage}/>
                    <Route path="/stats" component={Stats}/>
                </Switch>
            </BrowserRouter>
        </React.Fragment>
    );
};

export default Routes