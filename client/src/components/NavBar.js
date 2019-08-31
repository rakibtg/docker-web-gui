import React from 'react'
import {Link} from 'react-router-dom'
import { Pane, Icon, Text, Badge, SegmentedControl } from 'evergreen-ui'

class NavBar extends React.PureComponent {

  navButton (name, icon) {
    return <Text display='flex' alignItems='center'>
      <Icon size={14} color="muted" icon={ icon } marginRight={5}/> 
        { name }
    </Text>
  }

  render () {
    return <Pane display="flex" justifyContent="center" padding={26} background="#f9f9fc">
      <SegmentedControl
        width={750}
        height={50}
        options={[
          { label: this.navButton( 'Container', 'layers' ), value: 'container' },
          { label: this.navButton( 'Image', 'projects' ), value: 'image' },
          { label: this.navButton( 'Usage Stat', 'chart' ), value: 'stat' },
          { label: this.navButton( 'Clean-up', 'shield' ), value: 'cleanup' }
        ]}
        onChange={value => console.log(value)}
      />
    </Pane>
  }
}

// const NavBar = () => {
//     return (
//     <Pane display="flex" padding={16} background="#f9f9fc">
//       <Pane flex={1} alignItems="center" display="flex">
//         <Icon icon="dashboard" color="dark" marginRight={16} />
//       </Pane>
//       <Pane color="black">
//         <Link to='/' style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'black' }}>Containers</Link>&nbsp;|&nbsp; 
//         <Link to='/images' style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'black' }}>Images</Link> &nbsp;| &nbsp;
//       < Link to='/stats' style={{ textDecoration: 'none', textTransform: 'uppercase', color: 'black' }}>Stats</Link>
//       </Pane>
//     </Pane>
//     )
// }

export default NavBar