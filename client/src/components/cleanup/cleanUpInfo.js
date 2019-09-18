import React from 'react'
import { Pane, Button, Heading, Paragraph } from 'evergreen-ui'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import '../container/style/card.css'
import { pruneCommand } from '../../store/actions/cleanUp.action'

class CleanUpInfo extends React.PureComponent {

  render () {

     const { selectedSegment, pruneCommand, apiCallStarted } = this.props
     return <Pane 
               display="flex" 
               flexDirection="column" 
               justifyContent="center" 
               alignItems="center"
               marginTop={20}>
               <Pane 
                  display="flex" 
                  flexDirection="column" 
                  flexGrow={1}
                  padding={12}
                  borderRadius={6}
                  border="default"
                  className={"element-card card-active" }
                  >
                  <Pane display="flex">
                     <Pane display="flex" >
                        <Heading>{`Prune Docker ${selectedSegment.value}s`}</Heading>
                     </Pane>
                  </Pane>
                  <Pane display="flex" marginTop={12}>
                     <Paragraph>{selectedSegment.message} </Paragraph>
                  </Pane>                 
                  <Pane display="flex" marginTop={12} >              
                     <Button marginRight={5} 
                        height={22} 
                        iconBefore="trash" 
                        intent="danger"
                        isLoading={apiCallStarted}
                        onClick={()=>{
                           pruneCommand(selectedSegment.value)
                        }}
                        >
                        {`Proceed to Prune ${selectedSegment.value}`}
                     </Button>
                  </Pane>                    
               </Pane>
         </Pane>
  }

}

const mapStateToProps = state => {
  return {
      selectedSegment: state.cleanup.selectedSegment,
      apiCallStarted: state.cleanup.apiCallStarted
  }
}

const mapDispatchToProps = dispatch => bindActionCreators(
  {
   pruneCommand
  },
  dispatch
)

export default connect(mapStateToProps, mapDispatchToProps)( CleanUpInfo )