import React from 'react'
import { Pane, Button, Heading, Badge } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

class GroupCard extends React.PureComponent {

  render () {
    const { group } = this.props
    // const active = activeIndex == index
    const active = true
      return <Pane 
            display="flex" 
            flexDirection="column" 
            flexGrow={1}
            padding={12}
            borderRadius={6}
            marginBottom={16}
            border="default"
            className={active ? "element-card card-active" : "element-card"}
            // onMouseEnter={() => genericContainer({
            //   activeIndex: index
            // })}
            >
        <Pane display="flex" alignItems="center">
          <Pane display="flex" justifyContent="center" alignItems="center">
            <Heading size={400}>{group.name}</Heading>
          </Pane>
          {/* <Badge backgroundColor="#e7e9ef" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>{container.shortId}</Badge> */}
        </Pane>
    </Pane>
  }

}

// const mapStateToProps = state => {
//   return {
//     groups: state.groups.groups,
//   }
// }

// const mapDispatchToProps = dispatch => bindActionCreators(
//   {
//     getGroups
//   },
//   dispatch
// )

export default connect(null, null)( GroupCard )