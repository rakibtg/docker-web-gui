import React from 'react'
import { Pane, Spinner, SegmentedControl, Button } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { 
  getContainers, 
  genericContainer,
} from '../store/actions/container.action'

class SecondaryNavBar extends React.PureComponent {

  render() {
    const { segment, loading, getContainers, genericContainer } = this.props
    return <Pane 
      backgroundColor="#f1f1f1" 
      display="flex" 
      justifyContent="center"
      padding={10}>
      <Button 
        marginRight={12} 
        iconBefore="tag" 
        paddingLeft={35}
        paddingRight={30}
        height={26}
        onClick={() => {
          genericContainer({
            showGroupsPage: true,
          })
        }}>
          Groups
      </Button>
      <SegmentedControl
        width={400}
        height={26}
        options={[
          { label: loading === 'all' ? <Spinner size={16} /> : 'All', value: 'all' },
          { label: loading === 'active' ? <Spinner size={16} /> : 'Active', value: 'active' },
          { label: loading === 'stopped' ? <Spinner size={16} /> : 'Stopped', value: 'stopped' }
        ]}
        value={segment}
        onChange={value => {
          getContainers(value)
        }}
      />
    </Pane>
  }
}

const mapStateToProps = state => {
  return {
    segment: state.container.segment,
    loading: state.container.loading,
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
    getContainers,
    genericContainer,
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( SecondaryNavBar )