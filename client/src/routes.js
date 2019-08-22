
import React from 'react'
import DockerContainer from './components/DockerContainer';
import DockerImage from './components/DockerImage';
import Stats from './components/Stats';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

const Routes = () => {
    return (
        <React.Fragment>
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact component={DockerContainer}/>
                    <Route path="/images" component={DockerImage}/>
                    <Route path="/stats" component={Stats}/>
                </Switch>
            </BrowserRouter>
        </React.Fragment>
    );
};

export default Routes