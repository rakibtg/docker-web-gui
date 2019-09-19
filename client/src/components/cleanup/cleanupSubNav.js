import React from 'react'
import { Pane, Spinner, SegmentedControl, Button } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { setSelectedCleanUpSegment } from '../../store/actions/cleanUp.action'


class CleanUpNavBar extends React.PureComponent {

   render() {
      const {segmentOptions, selectedSegment, setSelectedCleanUpSegment} = this.props;
      
      return <Pane 
        backgroundColor="#f1f1f1" 
        display="flex" 
        justifyContent="center"
        padding={10}>
        <SegmentedControl
          width={600}
          height={26}
          options={segmentOptions}
          value={selectedSegment.value}
          onChange={value => {
            setSelectedCleanUpSegment(value)
          }}
        />
      </Pane>
    }
  }
  
  const mapStateToProps = state => {
    return {
      segmentOptions: state.cleanup.segmentOptions,
      selectedSegment: state.cleanup.selectedSegment
    }
  }
  
  const mapDispatchToProps = dispatch => bindActionCreators(
    {
      setSelectedCleanUpSegment
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)( CleanUpNavBar )