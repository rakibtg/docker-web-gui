exports.lightContainerDetail = (id, inspectedData) => ({
  Id: inspectedData.Id,
  shortId: id,
  Created: inspectedData.Created,
  State: inspectedData.State,
  Name: inspectedData.Name.replace('/', '')
})