import React from 'react'
import { Badge } from 'evergreen-ui'

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
TimeAgo.locale(en)
const timeAgo = new TimeAgo('en-US')

const CreatedAt = props => {
  const twitterStyleTime = timeAgo.format(new Date(props.time), 'twitter')
  return <Badge backgroundColor="#d4eee3" fontWeight="bold" borderRadius={16} paddingLeft={10} fontSize={11} paddingRight={10} marginLeft={10} marginTop={3}>
    {twitterStyleTime.trim() === '' ? 'now' : twitterStyleTime}
  </Badge>
}

export default CreatedAt