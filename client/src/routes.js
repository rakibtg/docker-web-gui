import React from 'react'
import {BrowserRouter, Route, Switch} from 'react-router-dom'
import Navbar from './components/NavBar'

import ContainerPage from './pages/container.page'
import ImagePage from './pages/image.page'
import CleanupPage from './pages/cleanup.page'

const Routes = () => {
    return (
        <React.Fragment>
            <BrowserRouter>
               <Navbar/>
                <Switch>
                    <Route path="/" exact component={ContainerPage}/>
                    <Route path="/containers" exact component={ContainerPage}/>
                    <Route path="/images" component={ImagePage}/>
                    <Route path="/cleanup" component={CleanupPage}/>
                </Switch>
            </BrowserRouter>
        </React.Fragment>
    )
}

export default Routes