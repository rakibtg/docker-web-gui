import React from 'react'
import { Pane, Spinner, SegmentedControl } from 'evergreen-ui'

class SecondaryNavBar extends React.PureComponent {
  render() {
    const loadingContainerFilter = ''
    return <Pane 
      backgroundColor="#f1f1f1" 
      display="flex" 
      justifyContent="center"
      padding={10}>
      <SegmentedControl
        width={400}
        height={26}
        options={[
          { label: loadingContainerFilter === 'all' ? <Spinner size={16} /> : 'All', value: 'all' },
          { label: loadingContainerFilter === 'active' ? <Spinner size={16} /> : 'Active', value: 'active' },
          { label: loadingContainerFilter === 'stopped' ? <Spinner size={16} /> : 'Stopped', value: 'stopped' }
        ]}
        value={'active'}
        onChange={value => {
          console.log(value)
        }}
      />
    </Pane>
  }
}

export default SecondaryNavBar