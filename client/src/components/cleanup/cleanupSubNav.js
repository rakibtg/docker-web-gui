import React from 'react'
import { Pane, Spinner, SegmentedControl, Button } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'


class CleanUpNavBar extends React.PureComponent {

   render() {
      const loading=false;
      const segment='image'
      return <Pane 
        backgroundColor="#f1f1f1" 
        display="flex" 
        justifyContent="center"
        padding={10}>
        <SegmentedControl
          width={600}
          height={26}
          options={[
            { label: loading === 'all' ? <Spinner size={16} /> : 'Prune Images', value: 'image' },
            { label: loading === 'active' ? <Spinner size={16} /> : 'Prune Containers', value: 'container' },
            { label: loading === 'stopped' ? <Spinner size={16} /> : 'Prune Volumes', value: 'volume' },
            { label: loading === 'stopped' ? <Spinner size={16} /> : 'Prune System', value: 'system' }
          ]}
          value={segment}
          onChange={value => {
            
          }}
        />
      </Pane>
    }
  }
  
  const mapStateToProps = state => {
    return {
      
    }
  }
  
  const mapDispatchToProps = dispatch => bindActionCreators(
    {
      
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)( CleanUpNavBar )