import React from 'react'
import { Pane, Spinner, SegmentedControl } from 'evergreen-ui'

class SecondaryNavBar extends React.PureComponent {
  render() {
    const loadingContainerFilter = ''
    return <Pane 
      backgroundColor="#f5f6f7" 
      display="flex" 
      justifyContent="center" 
      marginLeft={-20} 
      marginRight={-20} 
      marginTop={-20} 
      marginBottom={10}
      padding={10}>
      <SegmentedControl
        width={400}
        height={24}
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